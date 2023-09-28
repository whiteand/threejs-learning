/* eslint-disable @typescript-eslint/no-unused-vars */
import gsap from 'gsap'
import GUI from 'lil-gui'
import { BehaviorSubject, fromEvent, map } from 'rxjs'
import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js'
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js'
import { createApp } from '~/packages/interactive-app'
import { createShader } from './shaders/noise/createShader'

interface ISettings {
  bgColor: number
  uTime: number
  startShapeColor: THREE.Color
  endShapeColor: THREE.Color
  scale: number
  elementsNumber: number
  animationProgress: number
  noisePower: number
  maxNoiseLevel: number
  lightPower: number
  scalePower: number
  maxScale: number
  tubeRadius: number
  yoyo: boolean
  duration: number
  play(): void
  stop(): void
}

function easeInOut(t: number, power: number) {
  if (t < 0.5) {
    return Math.pow(2 * t, power) / 2
  }
  return 1 - Math.pow(2 * (1 - t), power) / 2
}

class PathCurve extends THREE.Curve<THREE.Vector3> {
  constructor() {
    super()
  }
  getPoint(t: number) {
    const tx = Math.cos(2 * Math.PI * t)
    const ty = Math.sin(2 * Math.PI * t)
    const tz = 0
    return new THREE.Vector3(tx, ty, tz)
  }
}

function placeMesh(
  mesh: THREE.Mesh,
  curve: THREE.Curve<THREE.Vector3>,
  time: number,
) {
  const t = THREE.MathUtils.clamp(time, 0, 1)
  mesh.position.copy(curve.getPointAt(t))
  mesh.lookAt(curve.getTangentAt(t))
}

function createShapeCurve() {
  const shapeCurve = new THREE.CurvePath<THREE.Vector3>()
  const a = new THREE.Vector3(0, 0.5)
  const b = new THREE.Vector3(-0.5, 0)
  const c = new THREE.Vector3(0, -0.5)
  const d = new THREE.Vector3(0.5, 0)

  const edges = [
    [a, b],
    [b, c],
    [c, d],
    [d, a],
  ]

  for (const [from, to] of edges) {
    shapeCurve.add(new THREE.LineCurve3(from, to))
  }

  return shapeCurve
}

export default function createIntrinsicApp(
  canvas: HTMLCanvasElement,
  size$: BehaviorSubject<THREE.Vector2>,
) {
  return createApp(
    () => {
      const gui = new GUI({
        width: size$.getValue().x,
      })
      const tweens: gsap.core.Tween[] = []
      const settings: ISettings = {
        // bgColor: 0xd9d9d9,
        bgColor: 0xeaeaea,
        uTime: 0,
        startShapeColor: new THREE.Color(0.2, 0.4, 0.6),
        endShapeColor: new THREE.Color(0.2, 0.6, 0.4),
        scale: 1,
        elementsNumber: 48,
        animationProgress: 0,
        noisePower: 1.5,
        maxNoiseLevel: 0.3,
        lightPower: 2,
        scalePower: 2,
        maxScale: 3,
        tubeRadius: 0.02,
        yoyo: false,
        duration: 5,
        play() {
          console.log(camera.position)
          const cnt = gui
            .controllersRecursive()
            .find((c) => c.property === 'animationProgress')

          const tween = gsap.fromTo(
            this,
            {
              animationProgress: 0,
            },
            {
              animationProgress: 1,
              duration: this.duration,
              ease: 'power2.inOut',
              repeat: -1,
              yoyo: this.yoyo,
              onUpdate: () => {
                cnt?.setValue(this.animationProgress)
              },
              onComplete: () => {
                const ind = tweens.indexOf(tween)
                if (ind >= 0) {
                  tweens.splice(ind, 1)
                  tween.kill()
                }
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
      gui.add(settings, 'play').name('Play')
      gui.add(settings, 'stop').name('Stop')
      gui
        .add(settings, 'noisePower')
        .min(1)
        .max(10)
        .name('Noise rate')
        .onChange(refreshMeshes)
      gui
        .add(settings, 'maxNoiseLevel')
        .min(0)
        .max(1)
        .step(0.01)
        .name('Max Noise Level')
        .onChange(refreshMeshes)

      gui
        .add(settings, 'lightPower')
        .min(1)
        .max(10)
        .name('Light rate')
        .onChange(refreshMeshes)
      gui
        .add(settings, 'scalePower')
        .min(1)
        .max(10)
        .name('Scale rate')
        .onChange(refreshMeshes)
      gui
        .add(settings, 'maxScale')
        .min(1)
        .max(20)
        .name('Max Scale')
        .onChange(refreshMeshes)
      gui
        .add(settings, 'duration')
        .min(1)
        .max(25)
        .name('Animation Duration')
        .onChange(() => {
          settings.stop()
          settings.play()
        })
      gui
        .add(settings, 'yoyo')
        .name('Yoyo')
        .onChange(() => {
          settings.stop()
          settings.play()
        })
      gui
        .add(settings, 'tubeRadius')
        .min(0.01)
        .max(2)
        .name('Tube Radius')
        .onChange(refreshMeshes)
      function refreshMeshes() {
        for (let i = 0; i < meshes.length; i++) {
          const mesh = meshes[i]
          handleFrameForMesh(settings, i, mesh)
        }
      }
      const MIN_SCALE = 1

      const shapeCurve = createShapeCurve()
      const createGeometry = () => {
        const shapeGeometry = new THREE.TubeGeometry(
          shapeCurve,
          64,
          settings.tubeRadius,
          10,
          false,
        )
        shapeGeometry.center()
        return shapeGeometry
      }
      const shapeGeometry = createGeometry()

      const setNoiseOpacity = (
        mesh: THREE.Mesh<THREE.TubeGeometry, THREE.ShaderMaterial>,
        opacity: number,
      ) => {
        if (mesh.material.uniforms.uFraction) {
          mesh.material.uniforms.uFraction.value = opacity
          mesh.material.needsUpdate = true
        }
      }
      const setLightnessLevel = (
        {
          startShapeColor,
          endShapeColor,
          elementsNumber,
        }: {
          startShapeColor: THREE.Color
          endShapeColor: THREE.Color
          elementsNumber: number
        },
        ind: number,
        mesh: THREE.Mesh<THREE.TubeGeometry, THREE.ShaderMaterial>,
        visibleLevel: number,
      ) => {
        if (mesh.material.uniforms.uColor) {
          const color = startShapeColor
            .clone()
            .lerp(endShapeColor, ind / Math.max(1, elementsNumber - 1))
          const hsl = { h: 0, s: 0, l: 0 }

          color.getHSL(hsl)
          const newColor = color
            .clone()
            .setHSL(hsl.h, hsl.s, THREE.MathUtils.lerp(0.5, 1, visibleLevel))
          mesh.material.uniforms.uColor.value = newColor
          mesh.material.needsUpdate = true
        }
      }
      const setMeshSize = (
        mesh: THREE.Mesh<THREE.TubeGeometry, THREE.ShaderMaterial>,
        additionalScale: number,
      ) => {
        const actualRatio = easeInOut(additionalScale, settings.scalePower)
        const scale = THREE.MathUtils.lerp(
          MIN_SCALE,
          settings.maxScale,
          actualRatio,
        )
        mesh.material.uniforms.uScale.value = scale
      }
      const handleFrameForMesh = (
        settings: ISettings,
        meshIndex: number,
        mesh: THREE.Mesh<THREE.TubeGeometry, THREE.ShaderMaterial>,
      ) => {
        if (meshIndex === 0) {
          setNoiseOpacity(mesh, 1)
          setLightnessLevel(settings, meshIndex, mesh, 1)
          setMeshSize(mesh, 0)
          placeMesh(mesh, pathCurve, settings.animationProgress)
          return
        }
        const { animationProgress } = settings
        const meshRatio = meshIndex / Math.max(1, settings.elementsNumber - 1)
        if (animationProgress > meshRatio) {
          setNoiseOpacity(mesh, 0)
          return
        }
        const meshProgress = 1 - (meshRatio - animationProgress) / meshRatio

        const noiseOpacityProgress =
          meshProgress * 0.8 + Math.min(1, animationProgress / 0.1) * 0.2
        const noiseOpacity =
          easeInOut(noiseOpacityProgress, settings.noisePower) *
          settings.maxNoiseLevel
        const lightnessLevel = easeInOut(meshProgress, settings.lightPower)

        setNoiseOpacity(mesh, noiseOpacity)
        setLightnessLevel(settings, meshIndex, mesh, lightnessLevel)
        setMeshSize(mesh, 1 - meshProgress)
      }

      gui
        .addColor(settings, 'startShapeColor')
        .name('Start Shape Color')
        .onChange(refreshMeshes)
      gui
        .addColor(settings, 'endShapeColor')
        .name('End Shape Color')
        .onChange(refreshMeshes)

      // Building Scene
      const scene = new THREE.Scene()

      const clock = new THREE.Clock()

      // const axesHelper = new THREE.AxesHelper()
      // scene.add(axesHelper)

      // the shape of the number eight as a curve
      const pathCurve = new PathCurve()

      const setupMeshes = (
        settings: ISettings,
        curve: THREE.Curve<THREE.Vector3>,
      ) => {
        const meshes: Array<
          THREE.Mesh<THREE.TubeGeometry, THREE.ShaderMaterial>
        > = []

        for (let i = 0; i < settings.elementsNumber; i++) {
          const shapeMaterial = new THREE.ShaderMaterial(createShader())
          // shapeMaterial.side = THREE.DoubleSide
          const meshRatio = i / Math.max(1, settings.elementsNumber - 1)
          shapeMaterial.uniforms.uColor.value = settings.startShapeColor
            .clone()
            .lerp(
              settings.endShapeColor,
              i / Math.max(1, settings.elementsNumber - 2),
            )
          const mesh = new THREE.Mesh(shapeGeometry, shapeMaterial)

          placeMesh(mesh, curve, meshRatio)

          handleFrameForMesh(settings, i, mesh)

          mesh.material.depthTest = false
          mesh.material.blending = THREE.NormalBlending

          meshes.push(mesh)
        }

        return meshes
      }

      const meshes = setupMeshes(settings, pathCurve)

      scene.add(...meshes)

      gui
        .add(settings, 'elementsNumber')
        .min(1)
        .max(256)
        .step(1)
        .name('Elements number')
        .onChange(() => {
          scene.remove(...meshes)
          meshes.splice(0, meshes.length)
          meshes.push(...setupMeshes(settings, pathCurve))
          scene.add(...meshes)
        })

      gui
        .add(settings, 'animationProgress')
        .min(0)
        .max(1)
        .step(0.01)
        .name('Progress')
        .onChange(() => {
          for (let i = 0; i < meshes.length; i++) {
            const mesh = meshes[i]
            handleFrameForMesh(settings, i, mesh)
          }
        })

      // Camera
      const camera = new THREE.PerspectiveCamera(
        55,
        size$.getValue().x / size$.getValue().y,
      )

      camera.position.set(
        -0.2884524476323129,
        0.9844982048260172,
        1.9658694959069598,
      )
      camera.lookAt(meshes[0].position)

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
      renderer.setClearColor(settings.bgColor, 1)
      renderer.setSize(size$.getValue().x, size$.getValue().y)

      const controls = new OrbitControls(camera, renderer.domElement)
      controls.zoomSpeed = 0.5
      controls.enableDamping = true

      const effectComposer = new EffectComposer(renderer)

      const renderPass = new RenderPass(scene, camera)
      effectComposer.addPass(renderPass)

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

      const onFrame = () => {
        const cameraDirection = new THREE.Vector3()
        camera.getWorldDirection(cameraDirection)

        for (const mesh of meshes) {
          if (mesh.material.uniforms.uCameraDirection) {
            mesh.material.uniforms.uCameraDirection.value = cameraDirection
            mesh.material.needsUpdate = true
          }
        }
      }
      onFrame()

      settings.play()

      return {
        effectComposer,
        controls,
        subscription,
        mousePosition$,
        clock,
        gui,
        onFrame,
        tweens,
      }
    },
    ({ effectComposer, controls, onFrame }) => {
      controls.update()

      onFrame()

      effectComposer.render()
    },
    ({ subscription, clock, tweens, controls, gui }) => {
      subscription.unsubscribe()
      clock.stop()
      controls.dispose()
      gui.destroy()
      for (const t of tweens) {
        t.kill()
      }
    },
  )
}
