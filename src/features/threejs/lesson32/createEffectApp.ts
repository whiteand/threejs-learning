import GUI from 'lil-gui'
import { BehaviorSubject, fromEvent, map } from 'rxjs'
import * as THREE from 'three'
import { SobelOperatorShader } from 'three/addons/shaders/SobelOperatorShader.js'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js'
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js'
import { ShaderPass } from 'three/examples/jsm/postprocessing/ShaderPass.js'
import { createApp } from '~/packages/interactive-app'

export default function createEffectApp(
  canvas: HTMLCanvasElement,
  size$: BehaviorSubject<THREE.Vector2>,
) {
  return createApp(
    () => {
      const gui = new GUI()
      const loadingManager = new THREE.LoadingManager()
      const textureLoader = new THREE.TextureLoader(loadingManager)

      const colorTexture = textureLoader.load('/textures/door/color.jpg')
      colorTexture.magFilter = THREE.NearestFilter
      colorTexture.generateMipmaps = false
      const alphaTexture = textureLoader.load('/textures/door/alpha.jpg')
      const heightTexture = textureLoader.load('/textures/door/height.jpg')
      const normalTexture = textureLoader.load('/textures/door/normal.jpg')
      const metalnessTexture = textureLoader.load(
        '/textures/door/metalness.jpg',
      )
      const ambientOcclusionTexture = textureLoader.load(
        '/textures/door/ambientOcclusion.jpg',
      )
      const roughnessTexture = textureLoader.load(
        '/textures/door/roughness.jpg',
      )

      // Building Scene
      const scene = new THREE.Scene()

      const clock = new THREE.Clock()

      const axesHelper = new THREE.AxesHelper()
      scene.add(axesHelper)

      const geometry = new THREE.PlaneGeometry(1, 1, 512, 512)

      const material = new THREE.MeshStandardMaterial({
        map: colorTexture,
        alphaMap: alphaTexture,
        roughnessMap: roughnessTexture,
        displacementMap: heightTexture,
        displacementScale: 0.03,
        normalMap: normalTexture,
        transparent: true,
        metalnessMap: metalnessTexture,
        aoMap: ambientOcclusionTexture,
        aoMapIntensity: 1,
      })
      gui.add(material, 'aoMapIntensity', -1, 5, 0.001)
      const door = new THREE.Mesh(geometry, material)

      door.geometry.setAttribute(
        'uv2',
        new THREE.Float32BufferAttribute(door.geometry.attributes.uv.array, 2),
      )

      // CUBE
      scene.add(door)

      // Camera
      const camera = new THREE.PerspectiveCamera(
        55,
        size$.getValue().x / size$.getValue().y,
      )

      camera.position.set(-1, -1, 1).normalize()
      camera.lookAt(new THREE.Vector3())

      scene.add(camera)
      const light = new THREE.DirectionalLight(0xffffff, 1)
      const lightPolars = { phi: 1.64, theta: 6.28 }
      light.position.setFromSphericalCoords(
        1,
        lightPolars.phi,
        lightPolars.theta,
      )

      gui
        .add(lightPolars, 'phi', 0, Math.PI, 0.01)
        .name('Light Phi')
        .onChange(() => {
          light.position.setFromSphericalCoords(
            1,
            lightPolars.phi,
            lightPolars.theta,
          )
        })
      gui
        .add(lightPolars, 'theta', 0, Math.PI * 2, 0.01)
        .name('Light Theta')
        .onChange(() => {
          light.position.setFromSphericalCoords(
            1,
            lightPolars.phi,
            lightPolars.theta,
          )
        })

      scene.add(light)

      scene.add(new THREE.AmbientLight(0xffffff, 1))

      // Renderer
      const renderer = new THREE.WebGLRenderer({
        canvas,
        alpha: true,
      })

      renderer.setPixelRatio(Math.min(2, window.devicePixelRatio))
      renderer.setSize(size$.getValue().x, size$.getValue().y)

      const controls = new OrbitControls(camera, renderer.domElement)
      controls.zoomSpeed = 0.5
      controls.enableDamping = true

      const effectComposer = new EffectComposer(renderer)

      // Passes
      const renderPass = new RenderPass(scene, camera)
      effectComposer.addPass(renderPass)

      const shaderPass = new ShaderPass(SobelOperatorShader)
      effectComposer.addPass(shaderPass)

      effectComposer.render()

      const subscription = size$.subscribe((sizes) => {
        // Update camera
        camera.aspect = sizes.x / sizes.y
        camera.updateProjectionMatrix()
        // Update renderers
        renderer.setSize(sizes.x, sizes.y)
        renderer.setPixelRatio(Math.min(2, window.devicePixelRatio))
        effectComposer.setPixelRatio(Math.min(2, window.devicePixelRatio))
        effectComposer.setSize(sizes.x, sizes.y)
        // Update shaders
        shaderPass.uniforms['resolution'].value.x = size$.getValue().x
        shaderPass.uniforms['resolution'].value.y = size$.getValue().y
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

      return {
        renderer,
        scene,
        camera,
        controls,
        subscription,
        mousePosition$,
        clock,
        gui,
        effectComposer,
      }
    },
    ({ effectComposer, controls }) => {
      controls.update()
      // renderer.render(scene, camera)
      effectComposer.render()
    },
    ({ subscription, clock, controls, gui, effectComposer }) => {
      subscription.unsubscribe()
      clock.stop()
      controls.dispose()
      gui.destroy()
      effectComposer.dispose()
    },
  )
}
