import { BehaviorSubject } from 'rxjs'
import {
  BoxGeometry,
  Color,
  Mesh,
  MeshBasicMaterial,
  PerspectiveCamera,
  Scene,
  Vector2,
  WebGLRenderer,
} from 'three'
import { createApp } from '~/packages/interactive-app'

export default function createUkrainianFlagApp(
  canvas: HTMLCanvasElement,
  size$: BehaviorSubject<Vector2>,
) {
  const BLUE_HSL = new Color(0x0056b9)
  const YELLOW_HSL = new Color(0xffd800)
  const RED_HSL = new Color(0xcc0000)
  const BLACK_HSL = new Color(0x000000)
  return createApp(
    () => {
      // Building Scene
      const scene = new Scene()

      const sizes = new Vector2(canvas.width, canvas.height)

      // Creating a cube
      const yellowGeometry = new BoxGeometry(3, 1, 1)
      const blueGeometry = yellowGeometry.clone()
      blueGeometry.translate(0, 1, 0)
      const blueMaterial = new MeshBasicMaterial({
        color: BLUE_HSL.clone(),
      })
      const yellowMaterial = new MeshBasicMaterial({
        color: YELLOW_HSL.clone(),
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
        alpha: true,
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
        bluePart,
        yellowPart,
        renderer,
        scene,
        camera,
        subscription,
      }
    },
    (ctx, time) => {
      const t = (time / 4096) * Math.PI
      const animation = (Math.cos(t) + 1) * 0.5 // Math.min(t / 1000, 1)
      const { renderer } = ctx
      const R = 5
      ctx.camera.position.set(Math.sin(t) * R, 0.5, Math.cos(t) * R)
      ctx.camera.lookAt(0, 1, 0)

      ctx.bluePart.material.color.set(BLUE_HSL.clone().lerp(RED_HSL, animation))
      ctx.yellowPart.material.color.set(
        YELLOW_HSL.clone().lerp(BLACK_HSL, animation),
      )

      renderer.render(ctx.scene, ctx.camera)
    },
    ({ subscription }) => {
      subscription.unsubscribe()
    },
  )
}
