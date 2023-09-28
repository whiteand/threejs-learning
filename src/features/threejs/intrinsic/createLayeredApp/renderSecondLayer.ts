import GUI from 'lil-gui'
import { BehaviorSubject } from 'rxjs'
import * as THREE from 'three'
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js'
import { OutputPass } from 'three/examples/jsm/postprocessing/OutputPass.js'
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js'
import { ShaderPass } from 'three/examples/jsm/postprocessing/ShaderPass.js'
import { createBlurNoiseShader } from '~/shaders/blur_noise/createShader'
import { ILayer } from './ILayer'

export function renderSecondLayer({
  size$,
  camera,
  renderer,
  gui,
}: {
  size$: BehaviorSubject<THREE.Vector2>
  camera: THREE.Camera
  renderer: THREE.WebGLRenderer
  gui: GUI
}): ILayer {
  const scene = new THREE.Scene()

  const cube = new THREE.Mesh(
    new THREE.BoxGeometry(1, 1, 1),
    new THREE.MeshBasicMaterial({ color: 0xffffff }),
  )
  scene.add(cube)
  cube.position.x += 2

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

  const shaderPass = new ShaderPass(createBlurNoiseShader())

  shaderPass.material.uniforms.uBlur.value = 4
  shaderPass.material.uniforms.uFraction.value = 0.7

  gui
    .add(shaderPass.material.uniforms.uBlur, 'value')
    .min(0)
    .max(100)
    .step(1)
    .name('Value')
    .onChange((value: number) => {
      shaderPass2.material.uniforms.uBlur.value = value
      shaderPass3.material.uniforms.uBlur.value = value
    })
  gui
    .add(shaderPass.material.uniforms.uFraction, 'value')
    .min(0)
    .max(1)
    .step(0.01)
    .name('Noise Fraction')
    .onChange((value: number) => {
      shaderPass2.material.uniforms.uFraction.value = value
      shaderPass3.material.uniforms.uFraction.value = value
    })

  effectComposer.addPass(shaderPass)
  effectComposer.addPass(new OutputPass())
  const shaderPass2 = new ShaderPass(createBlurNoiseShader())
  shaderPass2.material.uniforms.uBlur.value =
    shaderPass.material.uniforms.uBlur.value
  shaderPass2.material.uniforms.uFraction.value =
    shaderPass.material.uniforms.uFraction.value

  shaderPass2.material.uniforms.uAngle.value = Math.PI / 4
  effectComposer.addPass(shaderPass2)
  effectComposer.addPass(new OutputPass())

  const shaderPass3 = new ShaderPass(createBlurNoiseShader())
  shaderPass3.material.uniforms.uBlur.value =
    shaderPass.material.uniforms.uBlur.value
  shaderPass3.material.uniforms.uFraction.value =
    shaderPass.material.uniforms.uFraction.value
  shaderPass3.material.uniforms.uAngle.value = Math.PI / 2
  effectComposer.addPass(shaderPass3)
  effectComposer.addPass(new OutputPass())

  const sub = size$.subscribe((sizes) => {
    shaderPass.uniforms.uResolution.value = sizes
    shaderPass2.uniforms.uResolution.value = sizes
    shaderPass3.uniforms.uResolution.value = sizes
    renderTarget.setSize(sizes.x, sizes.y)
    effectComposer.setSize(sizes.x, sizes.y)
    effectComposer.setPixelRatio(renderer.getPixelRatio())
  })

  const api = {
    update() {
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

  api.update()

  return api
}
