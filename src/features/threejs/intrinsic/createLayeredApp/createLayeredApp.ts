/* eslint-disable @typescript-eslint/no-unused-vars */
import gsap from 'gsap'
import GUI from 'lil-gui'
import { BehaviorSubject, fromEvent, map } from 'rxjs'
import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js'
import { ShaderPass } from 'three/examples/jsm/postprocessing/ShaderPass.js'
import {
  FigureMesh,
  IGlobalSettings,
} from '~/features/threejs/intrinsic/createLayeredApp/types'
import { createApp } from '~/packages/interactive-app'
import { createComposeShader } from '~/shaders/compose/createComposeShader'
import { createNoiseShader } from '~/shaders/noise/createShader'
import { createShapeCurve } from './createShapeCurve'
import { renderMainLayer } from './renderMainLayer'
import { renderSecondLayer } from './renderSecondLayer'

class PathCurve extends THREE.Curve<THREE.Vector3> {
  constructor() {
    super()
  }
  getPointAt(t: number) {
    const x = Math.sin(t * Math.PI * 2)
    const y = Math.cos(t * Math.PI * 2)
    const z = t * Math.sin(t * Math.PI * 2) * 0.1
    return new THREE.Vector3(x, y, z)
  }
  getTangentAt(
    t: number,
    optionalTarget?: THREE.Vector3 | undefined,
  ): THREE.Vector3 {
    const x = Math.cos(t * Math.PI * 2) * Math.PI * 2
    const y = 0
    const z = -Math.sin(t * Math.PI * 2) * Math.PI * 2
    return optionalTarget?.set(x, y, z) || new THREE.Vector3(x, y, z)
  }
}

export default function createLayeredApp(
  canvas: HTMLCanvasElement,
  size$: BehaviorSubject<THREE.Vector2>,
) {
  return createApp(
    () => {
      const tweens: gsap.core.Tween[] = []
      const settings: IGlobalSettings = {
        time: 0,
        duration: 5,
        bgColor: new THREE.Color(0xeaeaea),
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
              yoyo: false,
              duration: this.duration,
              ease: 'power2.inOut',
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
        .onChange(() => {
          composerShaderPass.material.uniforms.uBgColor.value = settings.bgColor
        })

      const camera = new THREE.PerspectiveCamera(
        75,
        size$.getValue().x / size$.getValue().y,
        0.1,
        100,
      )

      camera.position.set(
        3.507639018776456e-7,
        -1.5566343379644363,
        0.0000015165998643485532,
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

      const pathCurve = new PathCurve()
      const placeMesh = (mesh: FigureMesh, traectoryPosition: number) => {
        const curvePoint = pathCurve.getPointAt(traectoryPosition)
        const curveTangent = pathCurve.getTangentAt(traectoryPosition)
        mesh.position.copy(curvePoint)
        mesh.lookAt(curveTangent)
      }
      const shapeGeometry = new THREE.TubeGeometry(
        createShapeCurve(),
        64,
        0.01,
        32,
        false,
      )

      const mainLayer = renderMainLayer({
        size$,
        camera,
        renderer,
        gui: gui.addFolder('Main Layer'),
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
        gui: gui.addFolder('Second Layer Layer'),
        meshBuilder: () => {
          const material = new THREE.ShaderMaterial(createNoiseShader())
          material.uniforms.uColor.value = new THREE.Color(1, 1, 1)
          material.uniforms.uFraction.value = 1
          material.uniforms.uScale.value = 1
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
      composerShaderPass.material.uniforms.uBgColor.value = settings.bgColor
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

      const clock = new THREE.Clock(true)

      settings.play()

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
      clock.stop()
      controls.dispose()
      settings.stop()
      gui.destroy()
    },
  )
}
