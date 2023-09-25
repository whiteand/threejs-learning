import { BehaviorSubject, fromEvent, map } from 'rxjs'
import * as THREE from 'three'
import { createApp } from '~/packages/interactive-app'

export default function createMouseControlApp(
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
      scene.add(camera)
      camera.position.set(2, 2, 3)
      camera.lookAt(cube.position)

      // Renderer
      const renderer = new THREE.WebGLRenderer({
        canvas,
        alpha: false,
      })

      renderer.setSize(size$.getValue().x, size$.getValue().y)

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
        cube,
        subscription,
        mousePosition$,
        clock,
      }
    },
    ({ scene, camera, renderer, mousePosition$ }) => {
      const mousePos = mousePosition$.getValue()
      const ratio2 = mousePos
        ? mousePos
            .clone()
            .divide(size$.getValue())
            .multiplyScalar(Math.pow(2, 10))
            .round()
            .multiplyScalar(Math.pow(2, -10))
        : new THREE.Vector2(0.5, 0.5)
      const R = 3
      camera.position.x =
        R * Math.sin(ratio2.x * Math.PI * 2) * Math.sin(ratio2.y * Math.PI)
      camera.position.z =
        R * Math.cos(ratio2.x * Math.PI * 2) * Math.sin(ratio2.y * Math.PI)
      camera.position.y = R * Math.cos(ratio2.y * Math.PI)

      camera.lookAt(scene.position)

      renderer.render(scene, camera)
    },
    ({ subscription, clock }) => {
      subscription.unsubscribe()
      clock.stop()
    },
  )
}
