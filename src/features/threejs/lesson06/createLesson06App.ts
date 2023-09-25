import gsap from 'gsap'
import { BehaviorSubject } from 'rxjs'
import * as THREE from 'three'
import { createApp } from '~/packages/interactive-app'

export default function createLesson06App(
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

      const tl = gsap
        .timeline({
          repeat: -1,
          yoyo: true,
        })
        .add(gsap.to(cube.position, { x: 1, duration: 2 }))
        .add(gsap.to(cube.position, { x: -1, duration: 2 }))

      // Renderer
      const renderer = new THREE.WebGLRenderer({
        canvas,
        alpha: true,
      })

      renderer.setSize(size$.getValue().x, size$.getValue().y)

      renderer.render(scene, camera)

      const subscription = size$.subscribe((sizes) => {
        renderer.setSize(sizes.x, sizes.y)
        camera.aspect = sizes.x / sizes.y
        camera.updateProjectionMatrix()
      })

      return {
        renderer,
        scene,
        camera,
        tl,
        cube,
        subscription,
        clock,
      }
    },
    ({ scene, camera, renderer }) => {
      renderer.render(scene, camera)
    },
    ({ subscription, clock, tl }) => {
      subscription.unsubscribe()
      clock.stop()
      tl.kill()
    },
  )
}
