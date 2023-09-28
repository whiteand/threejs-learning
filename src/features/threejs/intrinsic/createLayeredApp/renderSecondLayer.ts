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

  gui
    .add(shaderPass.material.uniforms.uBlur, 'value')
    .min(0)
    .max(100)
    .step(1)
    .name('Value')

  effectComposer.addPass(shaderPass)
  effectComposer.addPass(new OutputPass())

  const sub = size$.subscribe((sizes) => {
    shaderPass.uniforms.uResolution.value = sizes
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
