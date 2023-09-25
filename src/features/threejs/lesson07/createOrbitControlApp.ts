import { BehaviorSubject, fromEvent, map } from 'rxjs'
import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import { createApp } from '~/packages/interactive-app'

export default function createFlyControlApp(
  canvas: HTMLCanvasElement,
  size$: BehaviorSubject<THREE.Vector2>,
) {
  return createApp(
    () => {
      // Building Scene
      const scene = new THREE.Scene()

      const clock = new THREE.Clock()

      const axesHelper = new THREE.AxesHelper()
      scene.add(axesHelper)

      const cube = new THREE.Mesh(
        new THREE.BoxGeometry(1, 1, 1),
        new THREE.MeshBasicMaterial({
          color: 0x336699,
        }),
      )
      scene.add(cube)

      // Camera
      const camera = new THREE.PerspectiveCamera(
        55,
        size$.getValue().x / size$.getValue().y,
      )

      camera.position.set(2, 2, 2)
      camera.lookAt(cube.position)

      scene.add(camera)

      // Renderer
      const renderer = new THREE.WebGLRenderer({
        canvas,
        alpha: false,
      })

      renderer.setSize(size$.getValue().x, size$.getValue().y)

      const controls = new OrbitControls(camera, renderer.domElement)
      controls.enableDamping = true

      renderer.render(scene, camera)

      const subscription = size$.subscribe((sizes) => {
        renderer.setSize(sizes.x, sizes.y)
        camera.aspect = sizes.x / sizes.y
        camera.updateProjectionMatrix()
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
        cube,
        subscription,
        mousePosition$,
        clock,
      }
    },
    ({ scene, camera, renderer, controls }) => {
      renderer.render(scene, camera)
      controls.update()
    },
    ({ subscription, clock, controls }) => {
      subscription.unsubscribe()
      clock.stop()
      controls.dispose()
    },
  )
}
