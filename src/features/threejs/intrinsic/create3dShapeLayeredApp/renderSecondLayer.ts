/* eslint-disable @typescript-eslint/no-explicit-any */
import GUI from 'lil-gui'
import { BehaviorSubject } from 'rxjs'
import * as THREE from 'three'
import { BloomPass } from 'three/examples/jsm/postprocessing/BloomPass.js'
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js'
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js'
import { SavePass } from 'three/examples/jsm/postprocessing/SavePass.js'
import { ShaderPass } from 'three/examples/jsm/postprocessing/ShaderPass.js'
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js'
import { SobelOperatorShader } from 'three/examples/jsm/shaders/SobelOperatorShader.js'
import { ILayer } from './ILayer'
import { getItemRatio } from './getItemRatio'
import { createNoiseShader } from './noiseShader'
import { IGlobalSettings } from './types'

function getSizeValue(noiseType: 'random' | 'smooth', noiseSize: number) {
  if (noiseType === 'random') {
    return 0
  }
  return 1024 / noiseSize ** 2
}

interface ISecondLayerSettings {
  maxScale: number
  elementsNumber: number
  startColor: THREE.Color
  middleColor: THREE.Color
  endColor: THREE.Color
  colorPower: number
  blurStrength: number
  blurKernelSize: number
  blurSigma: number
  blurEnabled: boolean
  noiseSize: number
  noiseType: 'random' | 'smooth'
  noiseTimeBased: boolean
  gradientType: 'rgb' | 'hsl'
  unrealBloomPassStrength: number
  unrealBloomPassRadius: number
  unrealBloomPassThreshold: number
}

function getOpacity(progress: number) {
  const DISSAPPEAR_DURATION = 0.01
  if (progress <= 1 - DISSAPPEAR_DURATION) {
    return Math.pow(progress / (1 - DISSAPPEAR_DURATION), 2)
  }
  return (1 - progress) / DISSAPPEAR_DURATION
}

const WHITE_COLOR = new THREE.Color(1, 1, 1)
function getColor(
  {
    startColor,
    middleColor,
    endColor,
    colorPower,
    gradientType,
  }: ISecondLayerSettings,
  progress: number,
  meshRatio: number,
) {
  const from = meshRatio > 0.5 ? middleColor : startColor
  const to = meshRatio > 0.5 ? endColor : middleColor
  const res = from.clone()
  if (gradientType === 'rgb') {
    res.lerp(to, meshRatio)
    console.log('here')
  } else if (gradientType === 'hsl') {
    res.lerpHSL(to, meshRatio)
  }
  res.lerp(WHITE_COLOR, Math.pow(progress, colorPower))
  return res
}

function updateMesh<F extends THREE.Object3D>(
  scene: THREE.Scene,
  updateMaterial: (
    mesh: F,
    cb: (material: THREE.MeshBasicMaterial) => void,
  ) => void,
  globalSettings: IGlobalSettings,
  settings: ISecondLayerSettings,
  index: number,
  mesh: F,
): void {
  const { time } = globalSettings
  const { elementsNumber, maxScale } = settings
  const meshRatio = getItemRatio(elementsNumber, index)
  if (time >= meshRatio) {
    updateMaterial(mesh, (material) => {
      material.opacity = 0
    })
    scene.remove(mesh)
    return
  } else {
    scene.add(mesh)
  }
  const progress = 1 - (meshRatio - time) / meshRatio

  const scale = 1 + (1 - progress) * maxScale
  mesh.scale.set(scale, scale, scale)
  updateMaterial(mesh, (material) => {
    material.opacity = getOpacity(progress)
    material.color = getColor(settings, progress, meshRatio)
  })
}

export function renderSecondLayer<F extends THREE.Object3D>({
  size$,
  camera,
  // renderer,
  gui,
  updateMaterial,
  meshBuilder,
  placeMesh,
  settings: initialGlobalSettings,
  renderer,
}: {
  size$: BehaviorSubject<THREE.Vector2>
  camera: THREE.Camera
  renderer: THREE.WebGLRenderer
  gui: GUI
  meshBuilder: () => F
  placeMesh: (mesh: F, traectoryPosition: number) => void
  updateMaterial: (
    mesh: F,
    cb: (material: THREE.MeshBasicMaterial) => void,
  ) => void
  settings: IGlobalSettings
}): ILayer {
  const settings: ISecondLayerSettings = {
    elementsNumber: initialGlobalSettings.defaultElementsNumber,
    startColor: new THREE.Color(0x0011ff),
    middleColor: new THREE.Color(0xff0000),
    endColor: new THREE.Color(0x0011ff),
    maxScale: 0,
    colorPower: 4,
    blurStrength: 1,
    blurKernelSize: 16,
    blurSigma: 2,
    blurEnabled: true,
    noiseSize: 1.5,
    gradientType: 'hsl',
    noiseType: 'random',
    noiseTimeBased: false,
    unrealBloomPassThreshold: 0.2,
    unrealBloomPassStrength: 0.6,
    unrealBloomPassRadius: 0.05,
  }

  gui.addColor(settings, 'startColor').name('Start Color')
  gui.addColor(settings, 'middleColor').name('Middle Color')
  gui.addColor(settings, 'endColor').name('End Color')
  gui
    .add(settings, 'gradientType')
    .options(['rgb', 'hsl'])
    .name('Gradient Type')
  gui.add(settings, 'colorPower').min(1).max(10).step(1).name('Color Power')

  const scene = new THREE.Scene()

  const figures: F[] = []

  const refreshMeshes = (globalSettings: IGlobalSettings) => {
    if (figures.length !== settings.elementsNumber) {
      for (const figure of figures) {
        scene.remove(figure)
        for (const item of figure.children) {
          if ('geometry' in item) {
            if (
              item.geometry != null &&
              typeof item.geometry === 'object' &&
              'dispose' in item.geometry &&
              typeof item.geometry.dispose === 'function'
            ) {
              item.geometry.dispose()
            }
          }
        }
      }
      figures.splice(0, figures.length)
      for (let i = 0; i < settings.elementsNumber; i++) {
        const mesh = meshBuilder()
        updateMaterial(mesh, (material) => {
          material.transparent = true
        })
        const meshRatio = getItemRatio(settings.elementsNumber, i)
        placeMesh(mesh, meshRatio)
        figures.push(mesh)
        scene.add(mesh)
      }
    }
    for (let i = 0; i < settings.elementsNumber; i++) {
      const mesh = figures[i]
      updateMesh(scene, updateMaterial, globalSettings, settings, i, mesh)
    }
    noiseShaderPass.uniforms.uTime.value = settings.noiseTimeBased
      ? globalSettings.time
      : 1
  }

  const renderTarget = new THREE.WebGLRenderTarget(
    size$.getValue().x,
    size$.getValue().y,
    {
      depthBuffer: false,
      stencilBuffer: false,
      samples: window.devicePixelRatio > 1 ? 1 : 2,
    },
  )
  renderTarget.texture.name = 'SecondaryLayerTexture'

  gui
    .add(settings, 'maxScale')
    .min(0)
    .max(10)
    .step(0.01)
    .name('Max Scale')
    .onChange(() => refreshMeshes(initialGlobalSettings))

  const effectComposer = new EffectComposer(renderer)
  effectComposer.renderToScreen = false

  const renderPass = new RenderPass(scene, camera)
  effectComposer.addPass(renderPass)

  const specialEffectsGui = gui.addFolder('Special Effects')

  const sobelOperatorPass = new ShaderPass(SobelOperatorShader)
  sobelOperatorPass.enabled = false
  specialEffectsGui.add(sobelOperatorPass, 'enabled').name('Sobel Pass Enabled')
  effectComposer.addPass(sobelOperatorPass)

  const unrealBloomPass = new UnrealBloomPass(
    size$.getValue(),
    settings.unrealBloomPassStrength,
    settings.unrealBloomPassRadius,
    settings.unrealBloomPassThreshold,
  )

  unrealBloomPass.enabled = false

  specialEffectsGui
    .add(unrealBloomPass, 'enabled')
    .name('Unreal Bloom Enabled')
    .onChange((enabled: boolean) => {
      if (enabled) {
        unrealBloomFolder.show()
      } else {
        unrealBloomFolder.hide()
      }
    })

  const unrealBloomFolder = specialEffectsGui.addFolder('Unreal Bloom')

  unrealBloomFolder.hide()

  unrealBloomFolder
    .add(settings, 'unrealBloomPassStrength')
    .name('Strength')
    .min(0)
    .max(3)
    .step(0.01)
    .onChange(function (value: number) {
      unrealBloomPass.strength = Number(value)
    })

  unrealBloomFolder
    .add(settings, 'unrealBloomPassRadius')
    .name('Radius')
    .min(0)
    .max(1)
    .step(0.01)
    .onChange(function (value: number) {
      unrealBloomPass.radius = Number(value)
    })

  unrealBloomFolder
    .add(settings, 'unrealBloomPassThreshold')
    .name('Threshold')
    .min(0)
    .max(1)
    .step(0.01)
    .onChange(function (value: number) {
      unrealBloomPass.threshold = Number(value)
    })

  effectComposer.addPass(unrealBloomPass)

  let bloomPass = new BloomPass(settings.blurStrength, 25, 4)
  bloomPass.enabled = true

  specialEffectsGui
    .add(settings, 'blurEnabled')
    .name('Blur Pass Enabled')
    .onChange(() => {
      if (settings.blurEnabled) {
        bloomPassFolder.show()
      } else {
        bloomPassFolder.hide()
      }
      bloomPass.enabled = settings.blurEnabled
    })

  const bloomPassFolder = specialEffectsGui.addFolder('Blur Pass')

  bloomPassFolder
    .add(settings, 'blurStrength')
    .min(0)
    .max(10)
    .step(0.01)
    .name('Strength')
    .onChange((value: number) => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      ;(bloomPass as any).combineUniforms.strength.value = value
      // ;(bloomPass as any).combineUniforms.strength = value
    })
  bloomPassFolder
    .add(settings, 'blurKernelSize')
    .min(0)
    .max(100)
    .step(1)
    .name('Kernel Size')
    .onChange(refreshBlur)
  bloomPassFolder
    .add(settings, 'blurSigma')
    .min(0.01)
    .max(5)
    .step(0.01)
    .name('Sigma')
    .onChange(refreshBlur)

  function refreshBlur() {
    const ind = effectComposer.passes.indexOf(bloomPass)
    if (ind === -1) return
    effectComposer.removePass(bloomPass)
    bloomPass = new BloomPass(
      settings.blurStrength,
      settings.blurKernelSize,
      settings.blurSigma,
    )
    effectComposer.insertPass(bloomPass, ind)
  }

  effectComposer.addPass(bloomPass)

  refreshBlur()

  const noiseShaderPass = new ShaderPass(createNoiseShader()) as ShaderPass & {
    uniforms: ReturnType<typeof createNoiseShader>['uniforms']
  }

  noiseShaderPass.enabled = true

  specialEffectsGui
    .add(noiseShaderPass, 'enabled')
    .name('Noise Enabled')
    .onChange((enabled: boolean) => {
      if (enabled) {
        noiseFolder.show()
      } else {
        noiseFolder.hide()
      }
    })
  const noiseFolder = specialEffectsGui.addFolder('Noise')
  // noiseFolder.hide()

  noiseShaderPass.uniforms.uSize.value = getSizeValue(
    settings.noiseType,
    settings.noiseSize,
  )

  noiseFolder
    .add(settings, 'noiseType')
    .options(['random', 'smooth'])
    .name('Noise Type')
    .onChange(() => {
      const res = getSizeValue(settings.noiseType, settings.noiseSize)
      noiseShaderPass.uniforms.uSize.value = res
      if (settings.noiseType === 'smooth') {
        noiseSizeController.show()
      } else {
        noiseSizeController.hide()
      }
    })

  noiseFolder.add(settings, 'noiseTimeBased').name('Time Based Noise')
  const noiseSizeController = noiseFolder
    .add(settings, 'noiseSize')
    .min(1)
    .max(10)
    .step(0.01)
    .name('Noise Size')
    .onChange(() => {
      const res = getSizeValue(settings.noiseType, settings.noiseSize)
      noiseShaderPass.uniforms.uSize.value = res
    })

  effectComposer.addPass(noiseShaderPass)

  effectComposer.addPass(new SavePass(renderTarget))

  const sub = size$.subscribe((sizes) => {
    for (const pass of effectComposer.passes) {
      pass.setSize(sizes.x, sizes.y)
    }
    renderTarget.setSize(sizes.x, sizes.y)
    sobelOperatorPass.material.uniforms.resolution.value.set(sizes.x, sizes.y)
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
      gui.destroy()
    },
    getTexture() {
      return renderTarget.texture
    },
  }

  api.update(initialGlobalSettings)

  // console.log('after', { ...effectComposer })

  gui
    .add(settings, 'elementsNumber')
    .min(0)
    .max(200)
    .step(1)
    .name('Elements')
    .onChange(() => refreshMeshes(initialGlobalSettings))

  return api
}
