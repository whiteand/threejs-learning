import GUI from 'lil-gui'
import { BehaviorSubject } from 'rxjs'
import * as THREE from 'three'
import { ILayer } from './ILayer'

export function renderMainLayer({
  size$,
  camera,
  renderer,
}: {
  size$: BehaviorSubject<THREE.Vector2>
  camera: THREE.Camera
  renderer: THREE.WebGLRenderer
  gui: GUI
}): ILayer {
  const scene = new THREE.Scene()

  scene.add(
    new THREE.Mesh(
      new THREE.BoxGeometry(1, 1, 1),
      new THREE.MeshBasicMaterial({ color: 16711680 }),
    ),
  )

  const renderTarget = new THREE.WebGLRenderTarget(
    size$.getValue().x,
    size$.getValue().y,
    {
      depthBuffer: false,
      stencilBuffer: false,
    },
  )

  const sub = size$.subscribe((sizes) => {
    renderTarget.setSize(sizes.x, sizes.y)
  })

  const api = {
    update() {
      const oldRenderTarget = renderer.getRenderTarget()
      renderer.setRenderTarget(renderTarget)
      renderer.render(scene, camera)
      renderer.setRenderTarget(oldRenderTarget)
      // renderTarget.texture.needsUpdate = true
    },
    destroy() {
      sub.unsubscribe()
      renderTarget.dispose()
    },
    getTexture() {
      return renderTarget.texture
    },
  }

  api.update()

  return api
}
