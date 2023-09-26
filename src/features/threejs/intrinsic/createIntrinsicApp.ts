import GUI from 'lil-gui'
import { BehaviorSubject, fromEvent, map } from 'rxjs'
import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import { createApp } from '~/packages/interactive-app'

export default function createIntrinsicApp(
  canvas: HTMLCanvasElement,
  size$: BehaviorSubject<THREE.Vector2>,
) {
  return createApp(
    () => {
      const gui = new GUI()
      const settings = {
        bgColor: 0xd9d9d9,
      }

      // Building Scene
      const scene = new THREE.Scene()

      const clock = new THREE.Clock()

      // const axesHelper = new THREE.AxesHelper()
      // scene.add(axesHelper)

      // Cube with outline

      const cubeGeometry = new THREE.BoxGeometry(1, 1, 1)
      const innerCubeMaterial = new THREE.MeshBasicMaterial({
        color: settings.bgColor,
      })
      const cube = new THREE.Mesh(cubeGeometry, innerCubeMaterial)
      scene.add(cube)

      // Create a thicker version of the geometry for the outline
      const outlineMaterial = new THREE.MeshBasicMaterial({
        color: 0xffffff,
        side: THREE.BackSide,
      })
      const outlineGeometry = cubeGeometry.clone()
      const outlineMesh = new THREE.Mesh(outlineGeometry, outlineMaterial)
      outlineMesh.scale.set(1.01, 1.01, 1.01) // Slightly larger than the original
      scene.add(outlineMesh)

      // Camera
      const camera = new THREE.PerspectiveCamera(
        55,
        size$.getValue().x / size$.getValue().y,
      )

      camera.position.set(0, 0, 2)
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

      renderer.render(scene, camera)

      const subscription = size$.subscribe((sizes) => {
        camera.aspect = sizes.x / sizes.y
        camera.updateProjectionMatrix()
        renderer.setSize(sizes.x, sizes.y)
        renderer.setPixelRatio(Math.min(2, window.devicePixelRatio))
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
      }
    },
    ({ scene, camera, renderer, controls }) => {
      controls.update()
      renderer.render(scene, camera)
    },
    ({ subscription, clock, controls, gui }) => {
      subscription.unsubscribe()
      clock.stop()
      controls.dispose()
      gui.destroy()
    },
  )
}
