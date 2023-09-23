import { BehaviorSubject } from 'rxjs'
import {
  BoxGeometry,
  Mesh,
  MeshBasicMaterial,
  PerspectiveCamera,
  Scene,
  Vector2,
  WebGLRenderer,
} from 'three'
import { createApp } from '~/packages/interactive-app'

export default function createLesson03App(
  canvas: HTMLCanvasElement,
  size$: BehaviorSubject<Vector2>,
) {
  return createApp(
    () => {
      // Building Scene
      const scene = new Scene()

      const sizes = new Vector2(canvas.width, canvas.height)

      // Creating a cube
      const yellowGeometry = new BoxGeometry(3, 1, 1)
      const blueGeometry = new BoxGeometry(3, 1, 1)
      blueGeometry.translate(0, 1, 0)
      const blueMaterial = new MeshBasicMaterial({
        color: 0x0056b9,
      })
      const yellowMaterial = new MeshBasicMaterial({
        color: 0xffd800,
      })
      const bluePart = new Mesh(blueGeometry, blueMaterial)
      const yellowPart = new Mesh(yellowGeometry, yellowMaterial)
      scene.add(bluePart, yellowPart)

      // Camera
      const camera = new PerspectiveCamera(55, sizes.x / sizes.y)
      scene.add(camera)
      camera.position.set(1, 1, 1)
      camera.lookAt(bluePart.position)

      // Renderer
      const renderer = new WebGLRenderer({
        canvas,
        // antialias: false,
        // alpha: true,
        // precision: 'lowp',
      })

      renderer.setSize(sizes.x, sizes.y)

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
        subscription,
      }
    },
    (ctx, time) => {
      const t = time / 1024
      const { renderer } = ctx
      const R = 4
      ctx.camera.position.set(Math.sin(t) * R, 1, Math.cos(t) * R)
      ctx.camera.lookAt(0, 0, 0)
      renderer.render(ctx.scene, ctx.camera)
    },
    ({ subscription }) => {
      subscription.unsubscribe()
    },
  )
}
