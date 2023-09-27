/* eslint-disable @typescript-eslint/no-unused-vars */
import gsap from 'gsap'
import GUI from 'lil-gui'
import { BehaviorSubject, fromEvent, map } from 'rxjs'
import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js'
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js'
import { createApp } from '~/packages/interactive-app'

class PathCurve extends THREE.Curve<THREE.Vector3> {
  constructor() {
    super()
  }
  getPoint(t: number) {
    const tx = t * 3 - 1.5
    const ty = Math.sin(2 * Math.PI * t)
    const tz = 0
    return new THREE.Vector3(tx, ty, tz)
  }
}

function createShader(): THREE.ShaderMaterialParameters {
  return {
    transparent: true,
    uniforms: {
      uTime: { value: 0 },
      uColor: { value: null },
      uFraction: { value: 1 },
      uCameraPosition: { value: null },
    },
    vertexShader: `
      varying vec2 vUv;
      void main() { 
        vUv = uv;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `,

    fragmentShader: `
     float random (vec2 st) {
          return fract(sin(dot(st.xy,
                              vec2(12.9898,78.233)))*
              43758.5453123);
      }
      varying vec2 vUv;
      uniform float uTime;
      uniform float uFraction;
      uniform vec3 uColor;
      float getNoiseValue() {
        if (uFraction <= 0.0) return 0.0;
        if (uFraction >= 1.0) return 1.0;
        float randPos = random(vUv);
        return randPos <= uFraction ? 1.0 : 0.0;
      }
      void main() {
        float visible = getNoiseValue();
        gl_FragColor = vec4(uColor, visible);
      }
    `,
  }
}

function placeMesh(
  mesh: THREE.Mesh,
  curve: THREE.Curve<THREE.Vector3>,
  time: number,
) {
  const t = THREE.MathUtils.clamp(time, 0, 1)
  mesh.rotation.y = t
  mesh.position.z = curve.getPointAt(t).x
  mesh.lookAt(curve.getTangentAt(t))
}

function createShapeCurve(scale: number = 1) {
  const shapeCurve = new THREE.CurvePath<THREE.Vector3>()
  shapeCurve.add(
    new THREE.LineCurve3(
      new THREE.Vector3(0, 0.5, 0).multiplyScalar(scale),
      new THREE.Vector3(0, 0, 0).multiplyScalar(scale),
    ),
  )
  shapeCurve.add(
    new THREE.LineCurve3(
      new THREE.Vector3(0, 0, 0).multiplyScalar(scale),
      new THREE.Vector3(0.5, -0.5, 0)
        .normalize()
        .multiplyScalar(0.5)
        .multiplyScalar(scale),
    ),
  )
  return shapeCurve
}

export default function createIntrinsicApp(
  canvas: HTMLCanvasElement,
  size$: BehaviorSubject<THREE.Vector2>,
) {
  return createApp(
    () => {
      const gui = new GUI()
      const tweens: gsap.core.Tween[] = []
      const settings = {
        // bgColor: 0xd9d9d9,
        bgColor: 0xeaeaea,
        uTime: 0,
        startShapeColor: new THREE.Color(0.2, 0.4, 0.6),
        endShapeColor: new THREE.Color(0.2, 0.6, 0.4),
        scale: 1,
        elementsNumber: 48,
        animationProgress: 0,
        noisePower: 2,
        lightPower: 2,
        scalePower: 1,
        maxScale: 2,
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

      const createGeometry = (ratio: number) => {
        const actualRatio = Math.pow(ratio, settings.scalePower)
        const scale = THREE.MathUtils.lerp(
          MIN_SCALE,
          settings.maxScale,
          actualRatio,
        )
        const shapeGeometry = new THREE.TubeGeometry(
          createShapeCurve(scale),
          64,
          settings.tubeRadius * scale,
          10,
          false,
        )
        shapeGeometry.center()
        return shapeGeometry
      }

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
        mesh.geometry.dispose()
        mesh.geometry = createGeometry(additionalScale).clone()
      }
      const handleFrameForMesh = (
        settings: {
          startShapeColor: THREE.Color
          endShapeColor: THREE.Color
          animationProgress: number
          elementsNumber: number
          noisePower: number
          lightPower: number
          scalePower: number
        },
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

        const noiseOpacity = Math.pow(meshProgress, settings.noisePower)
        const lightnessLevel = Math.pow(meshProgress, settings.lightPower)

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
        settings: {
          elementsNumber: number
          startShapeColor: THREE.Color
          endShapeColor: THREE.Color
          animationProgress: number
          noisePower: number
          lightPower: number
          scalePower: number
        },
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
          const mesh = new THREE.Mesh(createGeometry(0).clone(), shapeMaterial)

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

      camera.position.set(-1, 0.05, 1.3)
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
      renderer.setClearColor(settings.bgColor, 1)
      renderer.setSize(size$.getValue().x, size$.getValue().y)

      const controls = new OrbitControls(camera, renderer.domElement)
      controls.zoomSpeed = 0.5
      controls.enableDamping = true

      const effectComposer = new EffectComposer(renderer)

      const renderPass = new RenderPass(scene, camera)
      effectComposer.addPass(renderPass)

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

      const onFrame = () => {
        if (tweens.length > 0) {
          // camera.lookAt(meshes[0].position)
        }
        for (let i = 0; i < meshes.length; i++) {
          const mesh = meshes[i]
          if (!mesh.material.uniforms) continue
          if (mesh.material.uniforms.uTime) {
            mesh.material.uniforms.uTime.value = clock.getElapsedTime()
            mesh.material.needsUpdate = true
          }
          if (mesh.material.uniforms.uCameraPosition) {
            mesh.material.uniforms.uCameraPosition.value = camera.position
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
