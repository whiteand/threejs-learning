import gsap from 'gsap'
import GUI from 'lil-gui'
import { MeshLineGeometry, MeshLineMaterial } from 'meshline'
import { BehaviorSubject, filter, fromEvent, map } from 'rxjs'
import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import { DotScreenPass } from 'three/examples/jsm/postprocessing/DotScreenPass.js'
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js'
import { GlitchPass } from 'three/examples/jsm/postprocessing/GlitchPass.js'
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js'
import { ShaderPass } from 'three/examples/jsm/postprocessing/ShaderPass.js'
import { GammaCorrectionShader } from 'three/examples/jsm/shaders/GammaCorrectionShader.js'
import { createApp } from '~/packages/interactive-app'

interface IAnimationSettings {
  points: THREE.Vector3[]
  startColor: THREE.Color
  endColor: THREE.Color
}

type Cube = THREE.Mesh
function addCubesAlongCurve(
  curve: THREE.CatmullRomCurve3,
  cubesNumber: number,
  scene: THREE.Scene,
  size$: BehaviorSubject<THREE.Vector2>,
  initialSettings: IAnimationSettings,
): {
  dispose(): void
  meshes: Cube[]
  animate(time: number): void
  updateSettings(newSettings: IAnimationSettings): void
} {
  let settings = initialSettings
  const cubes: Cube[] = []

  const geometry = new MeshLineGeometry()

  geometry.setPoints(settings.points)

  const materials = Array.from({ length: cubesNumber }, (_, ind) => {
    const res = new MeshLineMaterial({
      color: 0xffffff,
      lineWidth: 0.05,
      resolution: size$.getValue(),
      opacity: ind === 0 ? 1 : 0,
    })
    res.depthTest = ind === 0 ? false : true
    res.transparent = true
    return res
  })

  const sub = size$.subscribe((size) => {
    for (const mat of materials) {
      mat.resolution = size
      mat.needsUpdate = true
    }
  })

  function updateMesh(mesh: Cube, ind: number, time: number) {
    const ratio = ind / cubesNumber

    if (ind === 0) {
      materials[ind].opacity = 1
      mesh.position.copy(curve.getPointAt(time))
      mesh.lookAt(curve.getTangentAt(time))
    } else {
      if (ratio < time) {
        scene.remove(mesh)
      } else if (!scene.children.includes(mesh)) {
        scene.add(mesh)
      }
      if (ratio < time) return
      const targetOpacity = Math.pow(1 - Math.abs(time - ratio), 2)
      const appearingAnimationTime = THREE.MathUtils.clamp(
        time / (0.1 + ratio * 0.4),
        0,
        1,
      )
      const easedAppearingTime = Math.pow(appearingAnimationTime, 2)
      materials[ind].opacity = targetOpacity * easedAppearingTime
      const targetLightness = Math.pow(targetOpacity, 3)
      const newColor = new THREE.Color().lerpColors(
        settings.startColor,
        settings.endColor,
        ratio,
      )
      const hsl = { h: 0, s: 0, l: 0 }
      newColor.getHSL(hsl)
      materials[ind].color.setHSL(hsl.h, 1, targetLightness)
    }
  }

  for (let i = 0; i < cubesNumber; i++) {
    const cube = new THREE.Mesh(geometry, materials[i])

    const ratio = i / cubesNumber
    cube.position.copy(curve.getPointAt(ratio))
    cube.lookAt(curve.getTangentAt(ratio))
    cubes.push(cube)
    scene.add(cube)
  }

  return {
    dispose: () => {
      sub.unsubscribe()
      scene.remove(...cubes)
    },
    meshes: cubes,
    animate(time: number) {
      for (let i = 0; i < cubes.length; i++) {
        updateMesh(cubes[i], i, time)
      }
    },
    updateSettings(newSettings: IAnimationSettings) {
      settings = newSettings
    },
  }
}

export default function createIntrinsicApp(
  canvas: HTMLCanvasElement,
  size$: BehaviorSubject<THREE.Vector2>,
) {
  return createApp(
    () => {
      let animation: gsap.core.Tween | null = null
      const gui = new GUI()
      const settings = {
        bgColor: 0xd9d9d9,
        cubesNumber: 40,
        animationTime: 0,
        play() {
          animation = gsap.fromTo(
            this,
            {
              animationTime: 0,
            },
            {
              animationTime: 1,
              onUpdate: () => {
                cubes.animate(this.animationTime)
              },
              duration: 10,
              ease: 'power2.inOut',
              repeat: -1,
            },
          )
        },
        stop() {
          animation?.kill()
        },
      }
      gui.add(settings, 'play')
      gui.add(settings, 'stop')

      // Building Scene
      const scene = new THREE.Scene()

      const clock = new THREE.Clock()

      // const axesHelper = new THREE.AxesHelper()
      // scene.add(axesHelper)

      // the shape of the number eight as a curve
      const curve = new THREE.CatmullRomCurve3(
        [
          new THREE.Vector3(0, 0, 0),
          new THREE.Vector3(1, 0, 0),
          new THREE.Vector3(1, 0, 1),
          new THREE.Vector3(0, 0, 1),
          new THREE.Vector3(0, 0, 0),
          new THREE.Vector3(0, 1, 0),
          new THREE.Vector3(0, 1, 1),
          new THREE.Vector3(0, 0, 1),
          new THREE.Vector3(0, 0, 0),
        ],
        true,
      )

      const animationSettings: IAnimationSettings = {
        points: [
          new THREE.Vector3(-0.5, -0.5, 0),
          new THREE.Vector3(0.5, -0.5, 0),
          new THREE.Vector3(0.5, 0.5, 0),
          new THREE.Vector3(-0.5, 0.5, 0),
          new THREE.Vector3(-0.5, -0.5, 0),
        ],
        startColor: new THREE.Color('red'),
        endColor: new THREE.Color('blue'),
      }

      gui
        .addColor(animationSettings, 'startColor')
        .name('Start Color')
        .onChange(() => {
          cubes.updateSettings(animationSettings)
          cubes.animate(settings.animationTime)
        })
      gui
        .addColor(animationSettings, 'endColor')
        .name('End Color')
        .onChange(() => {
          cubes.updateSettings(animationSettings)
          cubes.animate(settings.animationTime)
        })

      let cubes = addCubesAlongCurve(
        curve,
        settings.cubesNumber,
        scene,
        size$,
        animationSettings,
      )

      gui
        .add(settings, 'cubesNumber')
        .min(1)
        .max(128)
        .step(1)
        .name('Elements Number')
        .onChange(() => {
          cubes.dispose()
          cubes = addCubesAlongCurve(
            curve,
            settings.cubesNumber,
            scene,
            size$,
            animationSettings,
          )
        })

      gui
        .add(settings, 'animationTime')
        .min(0)
        .max(1)
        .step(1e-5)
        .onChange(() => {
          settings.stop()
          cubes.animate(settings.animationTime)
        })

      // Camera
      const camera = new THREE.PerspectiveCamera(
        55,
        size$.getValue().x / size$.getValue().y,
      )

      camera.position.set(2, 2, 5)
      camera.lookAt(new THREE.Vector3())

      scene.add(camera)

      scene.add(new THREE.AmbientLight(0xffffff, 0.5))
      const pointLight = new THREE.PointLight(0xffffff, 15)
      pointLight.position.set(1, 2, 3)
      scene.add(pointLight)

      // Renderer
      const renderer = new THREE.WebGLRenderer({
        canvas,
        alpha: true,
      })

      renderer.setPixelRatio(Math.min(2, window.devicePixelRatio))
      // renderer.setClearColor(settings.bgColor, 1)
      renderer.setSize(size$.getValue().x, size$.getValue().y)

      const controls = new OrbitControls(camera, renderer.domElement)
      controls.zoomSpeed = 0.5
      controls.enableDamping = true

      const effectComposer = new EffectComposer(renderer)

      const renderPass = new RenderPass(scene, camera)
      effectComposer.addPass(renderPass)
      const dotScreenPass = new DotScreenPass()
      dotScreenPass.enabled = false
      gui.add(dotScreenPass, 'enabled').name('Dot Screen Pass')
      effectComposer.addPass(dotScreenPass)
      const glitchPass = new GlitchPass()
      glitchPass.enabled = false
      glitchPass.goWild = false

      gui
        .add(glitchPass, 'enabled')
        .name('Glitch pass')
        .onChange((enabled: boolean) => {
          if (enabled) {
            wildController.show()
          } else {
            wildController.hide()
          }
        })
      const wildController = gui
        .add(glitchPass, 'goWild')
        .name('Glitch wild')
        .hide()
      effectComposer.addPass(glitchPass)

      const gammaPass = new ShaderPass(GammaCorrectionShader)
      gammaPass.enabled = false
      gui.add(gammaPass, 'enabled').name('Gamma Correction')
      effectComposer.addPass(gammaPass)

      const subscription = size$.subscribe((sizes) => {
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

      subscription.add(
        fromEvent<KeyboardEvent>(window, 'keydown', { passive: true })
          .pipe(filter((event) => event.key === ' '))
          .subscribe(() => {
            settings.play()
          }),
      )

      settings.play()

      return {
        effectComposer,
        controls,
        subscription,
        mousePosition$,
        clock,
        gui,
      }
    },
    ({ effectComposer, controls }) => {
      controls.update()
      effectComposer.render()
    },
    ({ subscription, clock, controls, gui }) => {
      subscription.unsubscribe()
      clock.stop()
      controls.dispose()
      gui.destroy()
    },
  )
}
