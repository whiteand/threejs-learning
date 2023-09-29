import GUI from 'lil-gui'
import { BehaviorSubject } from 'rxjs'
import * as THREE from 'three'
import { BloomPass } from 'three/examples/jsm/postprocessing/BloomPass.js'
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js'
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js'
import { ILayer } from './ILayer'
import { getItemRatio } from './getItemRatio'
import { FigureMesh, IGlobalSettings } from './types'

type Material = THREE.MeshBasicMaterial

interface ISecondLayerSettings {
  uBlur: number
  uFraction: number
  maxScale: number
  elementsNumber: number
  blurPassesNumber: number
  startColor: THREE.Color
  endColor: THREE.Color
  colorPower: number
}

function getOpacity(progress: number) {
  const DISSAPPEAR_DURATION = 0.01
  if (progress <= 1 - DISSAPPEAR_DURATION) {
    return Math.pow(progress / (1 - DISSAPPEAR_DURATION), 2)
  }
  return (1 - progress) / DISSAPPEAR_DURATION
}

const WHITE_COLOR = new THREE.Color(1, 1, 1)
function updateMesh(
  globalSettings: IGlobalSettings,
  settings: ISecondLayerSettings,
  index: number,
  mesh: FigureMesh<Material>,
): void {
  const { time } = globalSettings
  const { elementsNumber, maxScale, startColor, endColor } = settings
  const meshRatio = getItemRatio(elementsNumber, index)
  if (time >= meshRatio) {
    mesh.material.opacity = 0
    return
  }
  const progress = 1 - (meshRatio - time) / meshRatio

  const scale = 1 + (1 - progress) * maxScale
  mesh.scale.set(scale, scale, scale)
  mesh.material.opacity = getOpacity(progress)
  mesh.material.color
    .lerpColors(startColor, endColor, meshRatio)
    .lerp(WHITE_COLOR, Math.pow(progress, settings.colorPower))
}

export function renderSecondLayer({
  size$,
  camera,
  // renderer,
  gui,
  meshBuilder,
  placeMesh,
  settings: initialGlobalSettings,
  renderer,
}: {
  size$: BehaviorSubject<THREE.Vector2>
  camera: THREE.Camera
  renderer: THREE.WebGLRenderer
  gui: GUI
  meshBuilder: () => FigureMesh<Material>
  placeMesh: (mesh: FigureMesh<Material>, traectoryPosition: number) => void
  settings: IGlobalSettings
}): ILayer {
  const settings: ISecondLayerSettings = {
    // uBlur: 4,
    uFraction: 0.25,
    uBlur: 2,
    // uFraction: 1,
    elementsNumber: 64,
    blurPassesNumber: 0,
    startColor: new THREE.Color(0x00eeff),
    endColor: new THREE.Color(0x61ff4d),
    maxScale: 1.5,
    colorPower: 4,
  }

  gui.addColor(settings, 'startColor').name('Start Color')
  gui.addColor(settings, 'endColor').name('End Color')
  gui.add(settings, 'colorPower').min(1).max(10).step(1).name('Color Power')

  const scene = new THREE.Scene()

  const meshes: FigureMesh<Material>[] = []

  const refreshMeshes = (globalSettings: IGlobalSettings) => {
    if (meshes.length !== settings.elementsNumber) {
      for (const mesh of meshes) {
        scene.remove(mesh)
      }
      meshes.splice(0, meshes.length)
      for (let i = 0; i < settings.elementsNumber; i++) {
        const mesh = meshBuilder()
        mesh.material.transparent = true
        const meshRatio = getItemRatio(settings.elementsNumber, i)
        placeMesh(mesh, meshRatio)
        meshes.push(mesh)
        scene.add(mesh)
      }
    }
    for (let i = 0; i < settings.elementsNumber; i++) {
      const mesh = meshes[i]
      updateMesh(globalSettings, settings, i, mesh)
    }
  }

  const renderTarget = new THREE.WebGLRenderTarget(
    size$.getValue().x,
    size$.getValue().y,
    {
      depthBuffer: false,
      stencilBuffer: false,
    },
  )
  renderTarget.texture.name = 'SecondaryLayerTexture'

  gui
    .add(settings, 'maxScale')
    .min(1)
    .max(10)
    .step(0.01)
    .name('Max Scale')
    .onChange(() => refreshMeshes(initialGlobalSettings))

  const effectComposer = new EffectComposer(renderer, renderTarget)
  effectComposer.renderToScreen = false
  // We want render target to be a write buffer
  effectComposer.swapBuffers()

  const renderPass = new RenderPass(scene, camera)
  effectComposer.addPass(renderPass)

  const bloomPass = new BloomPass(1, 25, 4)
  gui.add(bloomPass, 'enabled').name('Bloom Pass Enabled')
  effectComposer.addPass(bloomPass)

  const sub = size$.subscribe((sizes) => {
    effectComposer.setSize(sizes.x, sizes.y)
    effectComposer.setPixelRatio(renderer.getPixelRatio())
  })

  const api: ILayer = {
    update(globalSettings) {
      refreshMeshes(globalSettings)

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

  // console.log('before', { ...effectComposer })

  api.update(initialGlobalSettings)

  // console.log('after', { ...effectComposer })

  gui
    .add(settings, 'elementsNumber')
    .min(0)
    .max(100)
    .step(1)
    .name('Elements')
    .onChange(() => refreshMeshes(initialGlobalSettings))

  return api
}
