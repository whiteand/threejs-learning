import GUI from 'lil-gui'
import { BehaviorSubject } from 'rxjs'
import * as THREE from 'three'
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js'
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js'
import { SavePass } from 'three/examples/jsm/postprocessing/SavePass.js'
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

  // scene.add(new THREE.AxesHelper(1))

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

  const effectComposer = new EffectComposer(renderer)
  effectComposer.renderToScreen = false
  effectComposer.addPass(new RenderPass(scene, camera))
  effectComposer.addPass(new SavePass(renderTarget))

  const sub = size$.subscribe((sizes) => {
    renderTarget.setSize(sizes.x, sizes.y)
    effectComposer.setSize(sizes.x, sizes.y)
    effectComposer.setPixelRatio(Math.min(2, window.devicePixelRatio))
  })

  const api: ILayer = {
    update(globalSettings) {
      placeMesh(mainFigure, globalSettings.time)
      effectComposer.render()
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
