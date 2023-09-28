import GUI from 'lil-gui'
import { BehaviorSubject } from 'rxjs'
import * as THREE from 'three'
import { ILayer } from './ILayer'
import { FigureMesh, IGlobalSettings } from './types'

export function renderMainLayer({
  size$,
  camera,
  meshBuilder,
  placeMesh,
  renderer,
  settings: initialGlobalSettings,
}: {
  size$: BehaviorSubject<THREE.Vector2>
  camera: THREE.Camera
  renderer: THREE.WebGLRenderer
  meshBuilder: () => FigureMesh
  placeMesh: (mesh: FigureMesh, traectoryPosition: number) => void
  gui: GUI
  settings: IGlobalSettings
}): ILayer {
  const scene = new THREE.Scene()

  const mainFigure = meshBuilder()
  scene.add(mainFigure)
  mainFigure.position.set(1, 0, 1)

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

  const api: ILayer = {
    update(globalSettings) {
      placeMesh(mainFigure, globalSettings.time)
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

  api.update(initialGlobalSettings)

  return api
}
