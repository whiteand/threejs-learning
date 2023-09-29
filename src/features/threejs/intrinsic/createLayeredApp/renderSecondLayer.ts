import GUI from 'lil-gui'
import { BehaviorSubject } from 'rxjs'
import * as THREE from 'three'
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js'
import { OutputPass } from 'three/examples/jsm/postprocessing/OutputPass.js'
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js'
import { ShaderPass } from 'three/examples/jsm/postprocessing/ShaderPass.js'
import { createBlurNoiseShader } from '~/shaders/blur_noise/createShader'
import { ILayer } from './ILayer'
import { getItemRatio } from './getItemRatio'
import { FigureMesh, IGlobalSettings } from './types'

interface ISecondLayerSettings {
  uBlur: number
  uFraction: number
  maxScale: number
  elementsNumber: number
  blurPassesNumber: number
}

function updateMesh(
  globalSettings: IGlobalSettings,
  settings: ISecondLayerSettings,
  index: number,
  mesh: FigureMesh<THREE.ShaderMaterial>,
): void {
  const { time } = globalSettings
  const { elementsNumber, maxScale } = settings
  const meshRatio = getItemRatio(elementsNumber, index)
  if (time >= meshRatio) {
    mesh.material.uniforms.uFraction.value = 0
    return
  }
  const progress = 1 - (meshRatio - time) / meshRatio
  mesh.material.uniforms.uScale.value = 1 + (1 - progress) * maxScale
  mesh.material.uniforms.uFraction.value = progress
}

export function renderSecondLayer({
  size$,
  camera,
  renderer,
  gui,
  meshBuilder,
  placeMesh,
  settings: initialGlobalSettings,
}: {
  size$: BehaviorSubject<THREE.Vector2>
  camera: THREE.Camera
  renderer: THREE.WebGLRenderer
  gui: GUI
  meshBuilder: () => FigureMesh<THREE.ShaderMaterial>
  placeMesh: (
    mesh: FigureMesh<THREE.ShaderMaterial>,
    traectoryPosition: number,
  ) => void
  settings: IGlobalSettings
}): ILayer {
  const settings: ISecondLayerSettings = {
    // uBlur: 4,
    uFraction: 0.25,
    uBlur: 2,
    // uFraction: 1,
    elementsNumber: 64,
    blurPassesNumber: 1,
    maxScale: 1.5,
  }
  const scene = new THREE.Scene()

  const meshes: FigureMesh<THREE.ShaderMaterial>[] = []

  const refreshMeshes = (globalSettings: IGlobalSettings) => {
    if (meshes.length !== settings.elementsNumber) {
      for (const mesh of meshes) {
        scene.remove(mesh)
      }
      meshes.splice(0, meshes.length)
      for (let i = 0; i < settings.elementsNumber; i++) {
        const mesh = meshBuilder()
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

  const effectComposer = new EffectComposer(renderer, renderTarget)
  effectComposer.addPass(new RenderPass(scene, camera))

  const shaderPasses = [0, Math.PI / 4, Math.PI / 2].map((angle) => {
    const shaderPass = new ShaderPass(createBlurNoiseShader())
    shaderPass.material.uniforms.uBlur.value = settings.uBlur
    shaderPass.material.uniforms.uFraction.value = settings.uFraction
    shaderPass.material.uniforms.uAngle.value = angle
    return shaderPass
  })

  const outputPasses = shaderPasses.map(() => new OutputPass())
  for (let i = 0; i < shaderPasses.length; i++) {
    effectComposer.addPass(shaderPasses[i])
    effectComposer.addPass(outputPasses[i])
    shaderPasses[i].enabled = i < settings.blurPassesNumber
    outputPasses[i].enabled = i < settings.blurPassesNumber
  }
  if (settings.blurPassesNumber === 0) {
    outputPasses[0].enabled = true
  }

  gui
    .add(settings, 'maxScale')
    .min(1)
    .max(10)
    .step(0.01)
    .name('Max Scale')
    .onChange(() => refreshMeshes(initialGlobalSettings))

  gui
    .add(settings, 'blurPassesNumber')
    .min(0)
    .max(shaderPasses.length)
    .step(1)
    .name('Blur Passes')
    .onChange((value: number) => {
      for (let i = 0; i < shaderPasses.length; i++) {
        shaderPasses[i].enabled = i < value
        outputPasses[i].enabled = i < value
      }
      if (value === 0) {
        outputPasses[0].enabled = true
      }
    })

  gui
    .add(settings, 'uBlur')
    .min(0)
    .max(5)
    .step(0.01)
    .name('Blur Distance')
    .onChange((value: number) => {
      for (const shaderPass of shaderPasses) {
        shaderPass.material.uniforms.uBlur.value = value
      }
    })
  gui
    .add(settings, 'uFraction')
    .min(0)
    .max(1)
    .step(0.01)
    .name('Noise Opacity')
    .onChange((value: number) => {
      for (const shaderPass of shaderPasses) {
        shaderPass.material.uniforms.uFraction.value = value
      }
    })

  const sub = size$.subscribe((sizes) => {
    for (const shaderPass of shaderPasses) {
      shaderPass.uniforms.uResolution.value = sizes
    }
    renderTarget.setSize(sizes.x, sizes.y)
    effectComposer.setSize(sizes.x, sizes.y)
    effectComposer.setPixelRatio(renderer.getPixelRatio())
  })

  const api: ILayer = {
    update(globalSettings) {
      // for (const shaderPass of shaderPasses) {
      //   shaderPass.material.uniforms.uBlur.value = (1 - globalSettings.time) * 5
      // }
      refreshMeshes(globalSettings)

      const oldTarget = renderer.getRenderTarget()
      renderer.setRenderTarget(renderTarget)

      effectComposer.render()

      renderer.setRenderTarget(oldTarget)
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

  gui
    .add(settings, 'elementsNumber')
    .min(0)
    .max(100)
    .step(1)
    .name('Elements')
    .onChange(() => refreshMeshes(initialGlobalSettings))

  return api
}
