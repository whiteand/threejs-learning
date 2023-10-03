/* eslint-disable @typescript-eslint/no-unused-vars */
import gsap from 'gsap'
import GUI from 'lil-gui'
import { BehaviorSubject, fromEvent, map } from 'rxjs'
import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js'
import { ShaderPass } from 'three/examples/jsm/postprocessing/ShaderPass.js'
import { createApp } from '~/packages/interactive-app'
import { createComposeShader } from '~/shaders/compose/createComposeShader'
import { renderMainLayer } from './renderMainLayer'
import { renderSecondLayer } from './renderSecondLayer'
import { FigureMesh, IGlobalSettings } from './types'

// class PathCurve extends THREE.Curve<THREE.Vector3> {
//   constructor() {
//     super()
//   }
//   getPoint(t: number) {
//     const x = Math.sin(t * Math.PI * 2) * 2
//     const y = Math.cos(t * Math.PI * 2) * 0.1
//     const z = t * Math.sin(t * Math.PI * 2) * 2
//     return new THREE.Vector3(x, y, z)
//   }
// }

export default function createLayeredApp(
  canvas: HTMLCanvasElement,
  size$: BehaviorSubject<THREE.Vector2>,
) {
  return createApp(
    () => {
      const tweens: gsap.core.Tween[] = []
      const settings: IGlobalSettings = {
        time: 0,
        duration: 10,
        bgColor: new THREE.Color(0xeaeaea),
        yoyo: false,
        play() {
          this.stop()
          const cnt = gui.controllers.find((c) => c.property === 'time')

          const tween = gsap.fromTo(
            this,
            {
              time: 0,
            },
            {
              time: 1,
              repeat: -1,
              yoyo: this.yoyo,
              duration: this.duration,
              ease: 'linear',
              onComplete: () => {
                const ind = tweens.indexOf(tween)
                if (ind >= 0) {
                  tweens.splice(ind, 1)
                }
              },
              onUpdate: () => {
                cnt?.setValue(settings.time)
              },
              onStart: () => {
                console.log(
                  `camera.position.set(${camera.position.x}, ${camera.position.y}, ${camera.position.z})`,
                )
              },
            },
          )
          tweens.push(tween)
        },
        stop() {
          tweens.forEach((tween) => tween.kill())
          tweens.splice(0, tweens.length)
        },
      }

      const gui = new GUI()
      gui.close()

      const animationFolder = gui.addFolder('Animation')
      animationFolder.add(settings, 'play').name('Play')
      animationFolder.add(settings, 'stop').name('Stop')
      animationFolder.add(settings, 'yoyo').name('Yoyo')
      animationFolder
        .add(settings, 'time')
        .min(0)
        .max(1)
        .step(0.001)
        .name('Time')
      animationFolder
        .add(settings, 'duration')
        .min(0)
        .max(20)
        .step(0.1)
        .name('Duration')
        .onChange(() => {
          if (tweens.length > 0) {
            settings.play()
          }
        })

      gui
        .addColor(settings, 'bgColor')
        .name('Background Color')
        .onChange(refreshBgColor)

      function refreshBgColor() {
        renderer.domElement.style.backgroundColor = settings.bgColor.getStyle()
      }

      const camera = new THREE.PerspectiveCamera(
        75,
        size$.getValue().x / size$.getValue().y,
        0.1,
        100,
      )

      camera.position.set(
        4.578737493932219,
        -0.8940577010303337,
        -0.4571800272249112,
      )
      camera.lookAt(new THREE.Vector3())

      // Renderer
      const renderer = new THREE.WebGLRenderer({
        canvas,
        alpha: true,
      })
      renderer.setPixelRatio(Math.min(2, window.devicePixelRatio))
      // renderer.setClearColor(settings.bgColor, 1)
      renderer.setSize(size$.getValue().x, size$.getValue().y)
      refreshBgColor()

      const pathCurve = new THREE.EllipseCurve(1, 1, 1, 1, 0, Math.PI * 2, true)
      const placeMesh = (mesh: FigureMesh, traectoryPosition: number) => {
        const curvePoint = pathCurve
          .getPointAt(traectoryPosition)
          .multiplyScalar(0.1)
        const curveTangent = pathCurve.getTangentAt(traectoryPosition)
        mesh.position.set(curvePoint.x, 0, curvePoint.y)
        mesh.position.y += Math.sin(traectoryPosition * Math.PI * 2) * 1
        mesh.lookAt(curveTangent.x, 0, curveTangent.y)

        // mesh.rotation.z = (1 - traectoryPosition) * Math.PI * 2
        // mesh.rotation.y = (1 - traectoryPosition) * Math.PI * 4
      }
      const shapeGeometry = createTwoCubesGeometry()

      const mainLayer = renderMainLayer({
        size$,
        camera,
        renderer,
        gui: gui,
        placeMesh,
        meshBuilder: () =>
          new THREE.Mesh(
            shapeGeometry,
            new THREE.MeshBasicMaterial({
              color: new THREE.Color(1, 1, 1),
            }),
          ),
        settings,
      })

      const secondLayer = renderSecondLayer({
        size$,
        camera,
        renderer,
        gui: gui.addFolder('Second Layer'),
        meshBuilder: () => {
          const material = new THREE.MeshBasicMaterial({
            color: new THREE.Color(0, 0, 0),
          })
          material.side = THREE.DoubleSide
          // material.uniforms.uColor.value = new THREE.Color(1, 1, 1)
          // material.uniforms.uFraction.value = 1
          // material.uniforms.uScale.value = 1
          return new THREE.Mesh(shapeGeometry, material)
        },
        placeMesh,
        settings,
      })

      const controls = new OrbitControls(camera, renderer.domElement)
      controls.zoomSpeed = 0.5
      controls.enableDamping = true

      const effectComposer = new EffectComposer(renderer)
      const composerShaderPass = new ShaderPass(createComposeShader())
      composerShaderPass.material.uniforms.uMainTexture.value =
        mainLayer.getTexture()
      composerShaderPass.material.uniforms.uSecondaryTexture.value =
        secondLayer.getTexture()
      effectComposer.addPass(composerShaderPass)

      const subscription = size$.subscribe((sizes) => {
        gui.domElement.style.setProperty(
          '--width',
          `${Math.min(300, sizes.x)}px`,
        )
        camera.aspect = sizes.x / sizes.y
        camera.updateProjectionMatrix()
        renderer.setSize(sizes.x, sizes.y)
        renderer.setPixelRatio(Math.min(2, window.devicePixelRatio))
        effectComposer.setSize(sizes.x, sizes.y)
        effectComposer.setPixelRatio(Math.min(2, window.devicePixelRatio))
      })

      const mousePosition$ = new BehaviorSubject<THREE.Vector2 | null>(null)

      subscription.add(
        fromEvent<MouseEvent>(canvas, 'mousemove')
          .pipe(map((event) => new THREE.Vector2(event.offsetX, event.offsetY)))
          .subscribe(mousePosition$),
      )

      subscription.add(
        fromEvent(canvas, 'mouseout')
          .pipe(map(() => null))
          .subscribe(mousePosition$),
      )

      fromEvent(canvas, 'dblclick').subscribe(() => {
        if (document.fullscreenElement) {
          document.exitFullscreen()
        } else {
          canvas.requestFullscreen().then(() => {
            const rect = canvas.getBoundingClientRect()
            const width = rect.width
            const height = rect.height
            size$.next(new THREE.Vector2(width, height))
          })
        }
      })

      const clock = new THREE.Clock(true)

      settings.play()
      // document.body.style.backgroundColor = settings.bgColor.getStyle()

      return {
        effectComposer,
        controls,
        subscription,
        mousePosition$,
        clock,
        mainLayer,
        secondLayer,
        settings,
        gui,
      }
    },
    ({ effectComposer, settings, mainLayer, secondLayer, controls }) => {
      mainLayer.update(settings)
      secondLayer.update(settings)

      controls.update()

      effectComposer.render()
    },
    ({ subscription, clock, settings, controls, gui }) => {
      subscription.unsubscribe()
      // document.body.style.backgroundColor = ''
      clock.stop()
      controls.dispose()
      settings.stop()
      gui.destroy()
    },
  )
}
// function createSquareShapeGeometry(): THREE.TubeGeometry {
//   return new THREE.TubeGeometry(createShapeCurve(), 64, 0.01, 32, false)
// }
function createTwoCubesGeometry() {
  const EDGE1 = 1
  const EDGE2 = 1.2
  const EDGE3 = 1.8
  const EDGE4 = 3.7
  const EDGE4_Z = Math.cos(Math.PI / 4) * EDGE4
  const EDGE4_Y = -Math.sin(Math.PI / 4) * EDGE4
  const A = new THREE.Vector3(0, EDGE2, 0)
  const B = new THREE.Vector3(EDGE1, EDGE2, 0)
  const C = new THREE.Vector3(EDGE1, 0, 0)
  const D = new THREE.Vector3(0, 0, 0)
  const E = new THREE.Vector3(0, EDGE2, EDGE3)
  const F = new THREE.Vector3(EDGE1, EDGE2, EDGE3)
  const G = new THREE.Vector3(EDGE1, 0, EDGE3)
  const H = new THREE.Vector3(0, 0, EDGE3)
  const I = new THREE.Vector3(0, EDGE2 + EDGE4_Y, EDGE3 + EDGE4_Z)
  const J = new THREE.Vector3(EDGE1, EDGE2 + EDGE4_Y, EDGE3 + EDGE4_Z)
  const K = new THREE.Vector3(EDGE1, EDGE4_Y, EDGE3 + EDGE4_Z)
  const L = new THREE.Vector3(0, EDGE4_Y, EDGE3 + EDGE4_Z)
  const edges = [
    [A, B],
    [B, C],
    [C, D],
    [D, A],
    [A, E],
    [E, F],
    [F, B],
    [C, G],
    [G, F],
    [G, H],
    [D, H],
    [H, E],
    [E, I],
    [I, J],
    [J, F],
    [G, K],
    [K, J],
    [I, L],
    [L, H],
    [L, K],
  ]

  const shapeCurve = new THREE.CurvePath<THREE.Vector3>()

  for (const [from, to] of edges) {
    shapeCurve.add(new THREE.LineCurve3(from, to))
  }

  const geometry = new THREE.TubeGeometry(shapeCurve, 128, 0.02, 32)
  geometry.center()
  return geometry
}
