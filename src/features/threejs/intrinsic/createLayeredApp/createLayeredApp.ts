/* eslint-disable @typescript-eslint/no-unused-vars */
import GUI from 'lil-gui'
import { BehaviorSubject, fromEvent, map } from 'rxjs'
import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js'
import { ShaderPass } from 'three/examples/jsm/postprocessing/ShaderPass.js'
import { createApp } from '~/packages/interactive-app'
import { createComposeShader } from '~/shaders/compose/createShader'
import { renderMainLayer } from './renderMainLayer'
import { renderSecondLayer } from './renderSecondLayer'

export default function createLayeredApp(
  canvas: HTMLCanvasElement,
  size$: BehaviorSubject<THREE.Vector2>,
) {
  return createApp(
    () => {
      const gui = new GUI()
      gui.close()

      const camera = new THREE.PerspectiveCamera(
        75,
        size$.getValue().x / size$.getValue().y,
        0.1,
        100,
      )

      camera.position.set(3, 3, 3)
      camera.lookAt(new THREE.Vector3())

      // Renderer
      const renderer = new THREE.WebGLRenderer({
        canvas,
        alpha: true,
      })
      renderer.setPixelRatio(Math.min(2, window.devicePixelRatio))
      // renderer.setClearColor(settings.bgColor, 1)
      renderer.setSize(size$.getValue().x, size$.getValue().y)

      const mainLayer = renderMainLayer({
        size$,
        camera,
        renderer,
        gui: gui.addFolder('Main Layer'),
      })
      const secondLayer = renderSecondLayer({
        size$,
        camera,
        renderer,
        gui: gui.addFolder('Second Layer Layer'),
      })

      const controls = new OrbitControls(camera, renderer.domElement)
      controls.zoomSpeed = 0.5
      controls.enableDamping = true

      const effectComposer = new EffectComposer(renderer)
      const shaderPass = new ShaderPass(createComposeShader())
      console.log(shaderPass.material.uniforms)
      shaderPass.material.uniforms.uMainTexture.value = mainLayer.getTexture()
      shaderPass.material.uniforms.uSecondaryTexture.value =
        secondLayer.getTexture()
      effectComposer.addPass(shaderPass)

      const subscription = size$.subscribe((sizes) => {
        gui.domElement.style.setProperty(
          '--width',
          `${Math.min(300, sizes.x)}px`,
        )
        camera.aspect = sizes.x / sizes.y
        camera.updateProjectionMatrix()
        renderer.setSize(sizes.x, sizes.y)
        renderer.setPixelRatio(Math.min(2, window.devicePixelRatio))
        effectComposer.setSize(sizes.x, sizes.y)
        effectComposer.setPixelRatio(Math.min(2, window.devicePixelRatio))
      })

      const mousePosition$ = new BehaviorSubject<THREE.Vector2 | null>(null)

      subscription.add(
        fromEvent<MouseEvent>(canvas, 'mousemove')
          .pipe(map((event) => new THREE.Vector2(event.offsetX, event.offsetY)))
          .subscribe(mousePosition$),
      )

      subscription.add(
        fromEvent(canvas, 'mouseout')
          .pipe(map(() => null))
          .subscribe(mousePosition$),
      )

      const clock = new THREE.Clock(true)

      return {
        effectComposer,
        controls,
        subscription,
        mousePosition$,
        clock,
        mainLayer,
        secondLayer,
        gui,
      }
    },
    ({ effectComposer, mainLayer, secondLayer, controls }) => {
      mainLayer.update()
      secondLayer.update()

      controls.update()

      effectComposer.render()
    },
    ({ subscription, clock, controls, gui }) => {
      subscription.unsubscribe()
      clock.stop()
      controls.dispose()
      gui.destroy()
    },
  )
}
