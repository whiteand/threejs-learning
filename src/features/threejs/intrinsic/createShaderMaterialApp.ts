/* eslint-disable @typescript-eslint/no-unused-vars */
import GUI from 'lil-gui'
import { BehaviorSubject, fromEvent, map } from 'rxjs'
import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js'
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js'
import { createApp } from '~/packages/interactive-app'

function placeMesh(
  _mesh: THREE.Mesh,
  _curve: THREE.Curve<THREE.Vector3>,
  _time: number,
) {
  // DO NOTHING
}

function createShapeCurve() {
  const shapeCurve = new THREE.CurvePath<THREE.Vector3>()
  shapeCurve.add(
    new THREE.LineCurve3(
      new THREE.Vector3(0, 0.5, 0),
      new THREE.Vector3(0, 0, 0),
    ),
  )
  shapeCurve.add(
    new THREE.LineCurve3(
      new THREE.Vector3(0, 0, 0),
      new THREE.Vector3(0.5, -0.5, 0).normalize().multiplyScalar(0.5),
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
      const settings = {
        uFraction: 0.5,
        uTime: 0,
        uColor: new THREE.Color(0.2, 0.4, 0.6),
        scale: 1,
      }
      const MAX_SCALE = 3
      const MIN_SCALE = 1
      const GEOMETRIES = 32
      const shapeCurve = createShapeCurve()
      const shapeGeometries = Array.from(
        {
          length: GEOMETRIES,
        },
        (_, i) => {
          const ratio = i / (GEOMETRIES - 1)
          const scale = THREE.MathUtils.lerp(MIN_SCALE, MAX_SCALE, ratio)
          const shapeGeometry = new THREE.TubeGeometry(
            shapeCurve,
            64,
            0.01 * scale,
            10,
            false,
          )
          shapeGeometry.scale(scale, scale, scale)
          return shapeGeometry
        },
      )

      const getGeometry = (ratio: number) => {
        if (ratio >= 1) {
          return shapeGeometries[GEOMETRIES - 1]
        }
        if (ratio <= 0) {
          return shapeGeometries[0]
        }
        const ind = Math.floor(ratio * GEOMETRIES)
        return shapeGeometries[ind]
      }

      gui
        .addColor(settings, 'uColor')
        .name('Shape Color')
        .onChange(() => {
          meshes.forEach((mesh) => {
            if (!mesh.material.uniforms) return
            if (mesh.material.uniforms.uColor) {
              mesh.material.uniforms.uColor.value = settings.uColor
              mesh.material.needsUpdate = true
            }
          })
        })

      gui
        .add(settings, 'uFraction')
        .min(0)
        .max(1)
        .step(0.01)
        .name('Fraction of visible dots')
        .onChange(() => {
          meshes.forEach((mesh) => {
            if (!mesh.material.uniforms) return
            if (mesh.material.uniforms.uFraction) {
              mesh.material.uniforms.uFraction.value = settings.uFraction
              mesh.material.needsUpdate = true
            }
            // Update color
            if (mesh.material.uniforms.uColor) {
              const hsl = { h: 0, s: 0, l: 0 }
              settings.uColor.getHSL(hsl)
              const newColor = settings.uColor
                .clone()
                .setHSL(
                  hsl.h,
                  hsl.s,
                  THREE.MathUtils.lerp(0.5, 1, settings.uFraction),
                )
              mesh.material.uniforms.uColor.value = newColor
            }
            // Update Scale
            if (mesh.material.uniforms.uFraction) {
              mesh.geometry = getGeometry(1 - settings.uFraction)
            }
          })
        })

      // Building Scene
      const scene = new THREE.Scene()

      const clock = new THREE.Clock()

      const axesHelper = new THREE.AxesHelper()
      scene.add(axesHelper)

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

      const shapeGeometry = getGeometry(settings.uFraction)
      const NOISE_BLUR_SHADER = {
        transparent: true,
        uniforms: {
          uTime: { value: 0 },
          uColor: { value: null },
          uFraction: { value: settings.uFraction },
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
          void main() {
            float randPos = random(vUv);
            float visible = step(randPos, uFraction);

            gl_FragColor = vec4(uColor, visible);
          }
        `,
      }
      const shapeMaterial = new THREE.ShaderMaterial(NOISE_BLUR_SHADER)
      shapeMaterial.uniforms.uColor.value = settings.uColor
      // shapeMaterial.side = THREE.DoubleSide

      const shapeMesh = new THREE.Mesh(shapeGeometry, shapeMaterial)

      placeMesh(shapeMesh, curve, 0)

      scene.add(shapeMesh)

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

      const meshes = [shapeMesh]

      const onFrame = () => {
        for (const mesh of meshes) {
          if (!mesh.material.uniforms) continue
          if (mesh.material.uniforms.uTime) {
            mesh.material.uniforms.uTime.value = clock.getElapsedTime()
            mesh.material.needsUpdate = true
          }
        }
      }

      return {
        effectComposer,
        controls,
        subscription,
        mousePosition$,
        clock,
        gui,
        onFrame,
      }
    },
    ({ effectComposer, controls, onFrame }) => {
      controls.update()

      onFrame()

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
