import { BehaviorSubject } from 'rxjs'
import * as THREE from 'three'
import { createApp } from '~/packages/interactive-app'

export default function createTransformationApp(
  canvas: HTMLCanvasElement,
  size$: BehaviorSubject<THREE.Vector2>,
) {
  return createApp(
    () => {
      // Building Scene
      const scene = new THREE.Scene()

      const sizes = new THREE.Vector2(canvas.width, canvas.height)

      const group = new THREE.Group()

      const GROUP_SIZE = 16
      const totalWidth = 5
      for (let i = 0; i < GROUP_SIZE; i++) {
        const ratio = i / (GROUP_SIZE - 1)
        const colorRatio = Math.pow(ratio, 3)
        const mesh = new THREE.Mesh(
          new THREE.BoxGeometry(totalWidth / GROUP_SIZE, 1, 1),
          new THREE.MeshBasicMaterial({
            color: new THREE.Color(0x14386b).lerp(
              new THREE.Color(0xfbd85e),
              colorRatio,
            ),
          }),
        )

        mesh.position.setX(ratio * totalWidth - totalWidth / 2)
        group.add(mesh)
      }
      scene.add(group)

      const axesHelper = new THREE.AxesHelper()
      scene.add(axesHelper)

      // Camera
      const camera = new THREE.PerspectiveCamera(55, sizes.x / sizes.y)
      scene.add(camera)
      camera.position.set(2, 2, 6)
      camera.lookAt(group.position)

      // Renderer
      const renderer = new THREE.WebGLRenderer({
        canvas,
        alpha: true,
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
        group,
        scene,
        camera,
        subscription,
      }
    },
    (ctx, time) => {
      ctx.renderer.render(ctx.scene, ctx.camera)
      const STEP = Math.PI / ctx.group.children.length
      const angle = (time / 1000) * Math.PI
      for (let i = 0; i < ctx.group.children.length; i++) {
        const child = ctx.group.children[i]
        child.scale.set(1, Math.sin(angle + i * STEP), 1)
        child.rotation.set(angle / 2 + i * STEP, 0, 0)
      }
      ctx.renderer.render(ctx.scene, ctx.camera)
    },
    ({ subscription }) => {
      subscription.unsubscribe()
    },
  )
}
