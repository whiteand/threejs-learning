/* eslint-disable @typescript-eslint/no-unused-vars */
import gsap from 'gsap'
import GUI from 'lil-gui'
import { BehaviorSubject, fromEvent, map } from 'rxjs'
import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js'
import { ShaderPass } from 'three/examples/jsm/postprocessing/ShaderPass.js'
import { createApp } from '~/packages/interactive-app'
import { createComposeShader } from '~/shaders/compose/createComposeShader'
import { createGeometries } from './createGeometries'
import { renderMainLayer } from './renderMainLayer'
import { renderSecondLayer } from './renderSecondLayer'
import { IGlobalSettings } from './types'

// class PathCurve extends THREE.Curve<THREE.Vector3> {
//   constructor() {
//     super()
//   }
//   getPoint(t: number) {
//     const x = Math.sin(t * Math.PI * 2) * 2
//     const y = Math.cos(t * Math.PI * 2) * 0.1
//     const z = t * Math.sin(t * Math.PI * 2) * 2
//     return new THREE.Vector3(x, y, z)
//   }
// }

export default function createLayeredApp(
  canvas: HTMLCanvasElement,
  size$: BehaviorSubject<THREE.Vector2>,
) {
  return createApp(
    () => {
      const tweens: gsap.core.Tween[] = []
      const settings: IGlobalSettings = {
        time: 0,
        duration: 10,
        bgColor: new THREE.Color(0xeaeaea),
        yoyo: false,
        defaultElementsNumber: 96,
        modelUrl:
          'https://raw.githubusercontent.com/KhronosGroup/glTF-Sample-Models/master/2.0/Duck/glTF/Duck.gltf',
        play() {
          this.stop()
          const cnt = gui.controllers.find((c) => c.property === 'time')

          const tween = gsap.fromTo(
            this,
            {
              time: 0,
            },
            {
              time: 1,
              repeat: -1,
              yoyo: this.yoyo,
              duration: this.duration,
              ease: 'linear',
              onComplete: () => {
                const ind = tweens.indexOf(tween)
                if (ind >= 0) {
                  tweens.splice(ind, 1)
                }
              },
              onUpdate: () => {
                cnt?.setValue(settings.time)
              },
              onStart: () => {
                console.log(
                  `camera.position.set(${camera.position.x}, ${camera.position.y}, ${camera.position.z})`,
                )
              },
            },
          )
          tweens.push(tween)
        },
        stop() {
          tweens.forEach((tween) => tween.kill())
          tweens.splice(0, tweens.length)
        },
        loadModel: () =>
          loadModel().catch((error) => {
            alert(error.message)
          }),
        model: null,
      }

      const gui = new GUI()

      gui.close()

      const modelFolder = gui.addFolder('Model')
      modelFolder.add(settings, 'modelUrl').name('Model URL (GLTF)')
      modelFolder.add(settings, 'loadModel').name('Load Model')
      const gltfLoader = new GLTFLoader()

      async function loadModel() {
        const newModel = await gltfLoader.loadAsync(settings.modelUrl)
        settings.model = newModel
        restartApp()
      }

      function restartApp() {
        mainLayer.destroy()
        secondLayer.destroy()

        // settings.defaultElementsNumber = 96

        mainLayer = renderMainLayer({
          size$,
          camera,
          renderer,
          gui: gui,
          placeMesh,
          meshBuilder: createGroup,
          settings,
        })

        secondLayer = renderSecondLayer({
          size$,
          camera,
          renderer,
          updateMaterial: (group, cb) => {
            updateMaterial(group, (obj) => {
              cb(obj.material)
            })
          },
          gui: gui.addFolder('Second Layer'),
          meshBuilder: createGroup,
          placeMesh,
          settings,
        })

        composerShaderPass.material.uniforms.uMainTexture.value =
          mainLayer.getTexture()
        composerShaderPass.material.uniforms.uSecondaryTexture.value =
          secondLayer.getTexture()
      }

      const animationFolder = gui.addFolder('Animation')
      animationFolder.add(settings, 'play').name('Play')
      animationFolder.add(settings, 'stop').name('Stop')
      animationFolder.add(settings, 'yoyo').name('Yoyo')
      animationFolder
        .add(settings, 'time')
        .min(0)
        .max(1)
        .step(0.001)
        .name('Time')
      animationFolder
        .add(settings, 'duration')
        .min(0)
        .max(20)
        .step(0.1)
        .name('Duration')
        .onChange(() => {
          if (tweens.length > 0) {
            settings.play()
          }
        })

      gui
        .addColor(settings, 'bgColor')
        .name('Background Color')
        .onChange(refreshBgColor)

      function refreshBgColor() {
        renderer.domElement.style.backgroundColor = settings.bgColor.getStyle()
      }

      const camera = new THREE.PerspectiveCamera(
        75,
        size$.getValue().x / size$.getValue().y,
        0.1,
        100,
      )

      camera.position.set(
        -1.7428960410886734,
        -7.186940007666076,
        -7.165800100290473,
      )
      camera.lookAt(new THREE.Vector3())

      // Renderer
      const renderer = new THREE.WebGLRenderer({
        canvas,
        alpha: true,
        powerPreference: 'high-performance',
        antialias: false,
        stencil: false,
        depth: false,
      })
      renderer.outputColorSpace = THREE.SRGBColorSpace
      renderer.setPixelRatio(Math.min(2, window.devicePixelRatio))
      // renderer.setClearColor(settings.bgColor, 1)
      renderer.setSize(size$.getValue().x, size$.getValue().y)
      refreshBgColor()

      const pathCurve = new THREE.EllipseCurve(1, 1, 1, 1, 0, Math.PI * 2, true)
      const placeMesh = (mesh: THREE.Object3D, traectoryPosition: number) => {
        const curvePoint = pathCurve
          .getPointAt(traectoryPosition)
          .multiplyScalar(0.1)
        const curveTangent = pathCurve.getTangentAt(traectoryPosition)
        mesh.position.set(curvePoint.x, 0, curvePoint.y)
        mesh.position.y += Math.sin(traectoryPosition * Math.PI * 2) * 1
        mesh.rotation.x = curveTangent.x
        mesh.rotation.z = curveTangent.y
        // mesh.lookAt(curveTangent.x, 0, curveTangent.y)
      }
      const shapeGeometries = createGeometries()

      const createGroup = (): THREE.Group => {
        if (settings.model && settings.modelUrl) {
          const res = settings.model.scene.clone()

          updateMaterial(res, (obj) => {
            obj.material.dispose()
            obj.material = new THREE.MeshBasicMaterial({
              color: new THREE.Color(1, 1, 1),
            })
          })

          return res
        }
        const group = new THREE.Group()
        const material = new THREE.MeshBasicMaterial({
          color: new THREE.Color(1, 1, 1),
        })
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const meshes: THREE.Mesh<THREE.CapsuleGeometry, any>[] = []
        for (const shapeGeometry of shapeGeometries) {
          const mesh = new THREE.Mesh(shapeGeometry, material)
          meshes.push(mesh)
          group.add(mesh)
        }

        const min = new THREE.Vector3()
        const max = new THREE.Vector3()
        for (const mesh of meshes) {
          mesh.geometry.computeBoundingBox()
          if (mesh.geometry.boundingBox) {
            min.min(mesh.geometry.boundingBox.min)
            max.max(mesh.geometry.boundingBox.max)
          }
        }

        const size = new THREE.Vector3()

        size.subVectors(max, min)
        size.multiplyScalar(0.5)

        for (const mesh of meshes) {
          mesh.position.sub(size)
        }

        group.rotation.x = Math.PI / 2

        return Object.assign(group, { material })
      }

      const updateMaterial = (
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        group: any,
        cb: (obj: { material: THREE.MeshBasicMaterial }) => void,
      ) => {
        const toCheck = [group]

        while (toCheck.length > 0) {
          const current = toCheck.pop()
          if (!current) continue
          if (
            current.isMesh &&
            (current.material instanceof THREE.MeshStandardMaterial ||
              current.material instanceof THREE.MeshBasicMaterial)
          ) {
            cb(current)
          } else if (current.children) {
            for (const child of current.children) {
              toCheck.push(child)
            }
          }
        }
      }

      let mainLayer = renderMainLayer({
        size$,
        camera,
        renderer,
        gui: gui,
        placeMesh,
        meshBuilder: createGroup,
        settings,
      })

      let secondLayer = renderSecondLayer({
        size$,
        updateMaterial: (group, cb) => {
          updateMaterial(group, (obj) => {
            cb(obj.material)
          })
        },
        camera,
        renderer,
        gui: gui.addFolder('Second Layer'),
        meshBuilder: createGroup,
        placeMesh,
        settings,
      })

      const controls = new OrbitControls(camera, renderer.domElement)
      controls.zoomSpeed = 0.5
      controls.enableDamping = true

      const effectComposer = new EffectComposer(renderer)
      const composerShaderPass = new ShaderPass(createComposeShader())
      composerShaderPass.material.uniforms.uMainTexture.value =
        mainLayer.getTexture()
      composerShaderPass.material.uniforms.uSecondaryTexture.value =
        secondLayer.getTexture()
      effectComposer.addPass(composerShaderPass)

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

      fromEvent(canvas, 'dblclick').subscribe(() => {
        if (document.fullscreenElement) {
          document.exitFullscreen()
        } else {
          canvas.requestFullscreen().then(() => {
            const rect = canvas.getBoundingClientRect()
            const width = rect.width
            const height = rect.height
            size$.next(new THREE.Vector2(width, height))
          })
        }
      })

      const clock = new THREE.Clock(true)

      settings.play()
      // document.body.style.backgroundColor = settings.bgColor.getStyle()

      function onFrame() {
        mainLayer.update(settings)
        secondLayer.update(settings)
      }

      return {
        effectComposer,
        controls,
        subscription,
        mousePosition$,
        clock,
        onFrame,
        mainLayer,
        secondLayer,
        settings,
        gui,
      }
    },
    ({ effectComposer, onFrame, controls }) => {
      onFrame()
      controls.update()

      effectComposer.render()
    },
    ({ subscription, clock, settings, controls, gui }) => {
      subscription.unsubscribe()
      // document.body.style.backgroundColor = ''
      clock.stop()
      controls.dispose()
      settings.stop()
      gui.destroy()
    },
  )
}
