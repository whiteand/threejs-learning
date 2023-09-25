import gsap from 'gsap'
import GUI from 'lil-gui'
import { BehaviorSubject, fromEvent, map } from 'rxjs'
import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import { createApp } from '~/packages/interactive-app'

export default function createSerpinskiTriangle(
  canvas: HTMLCanvasElement,
  size$: BehaviorSubject<THREE.Vector2>,
) {
  return createApp(
    () => {
      const gui = new GUI()

      const settings = {
        meshColor: 0x336699,
        cubeWidth: 1,
        cubeHeight: 1,
        cubeDepth: 1,
        showWireframe: true,
        spin,
      }

      gui.add(settings, 'spin')

      // Building Scene
      const scene = new THREE.Scene()

      const clock = new THREE.Clock()

      const axesHelper = new THREE.AxesHelper()
      scene.add(axesHelper)

      const geometry = new THREE.BoxGeometry(
        settings.cubeWidth,
        settings.cubeHeight,
        settings.cubeDepth,
      )

      const coloredCube = new THREE.Mesh(
        geometry,
        new THREE.MeshBasicMaterial({
          color: settings.meshColor,
        }),
      )

      const cubeFolder = gui.addFolder('Cube')

      cubeFolder.addColor(coloredCube.material, 'color')

      cubeFolder
        .add(settings, 'cubeWidth', 0, 10, 0.1)
        .name('Cube Width')
        .onChange((value: number) => {
          for (const mesh of meshes) {
            mesh.geometry = new THREE.BoxGeometry(
              value,
              settings.cubeHeight,
              settings.cubeDepth,
            )
          }
        })
      cubeFolder
        .add(settings, 'cubeHeight', 0, 10, 0.1)
        .name('Cube Height')
        .onChange((value: number) => {
          for (const mesh of meshes) {
            mesh.geometry = new THREE.BoxGeometry(
              settings.cubeWidth,
              value,
              settings.cubeDepth,
            )
          }
        })
      cubeFolder
        .add(settings, 'cubeDepth', 0, 10, 0.1)
        .name('Cube Depth')
        .onChange((value: number) => {
          for (const mesh of meshes) {
            mesh.geometry = new THREE.BoxGeometry(
              settings.cubeWidth,
              settings.cubeHeight,
              value,
            )
          }
        })

      const wireframeCube = new THREE.Mesh(
        geometry,
        new THREE.MeshBasicMaterial({
          color: 0xffffff,
          wireframe: true,
        }),
      )
      // CUBE
      const meshes = [wireframeCube, coloredCube]
      scene.add(coloredCube)
      if (settings.showWireframe) {
        scene.add(wireframeCube)
      }

      const folder = gui.addFolder('Scene')

      folder
        .add(settings, 'showWireframe')
        .name('Show Wireframe')
        .onChange((showWireframe: boolean) => {
          if (showWireframe) {
            scene.add(wireframeCube)
          } else {
            scene.remove(wireframeCube)
          }
        })

      // Camera
      const camera = new THREE.PerspectiveCamera(
        55,
        size$.getValue().x / size$.getValue().y,
      )

      camera.position.set(3, 3, 3)
      camera.lookAt(new THREE.Vector3())

      scene.add(camera)

      // Renderer
      const renderer = new THREE.WebGLRenderer({
        canvas,
        alpha: true,
      })

      renderer.setPixelRatio(Math.min(2, window.devicePixelRatio))
      renderer.setSize(size$.getValue().x, size$.getValue().y)

      const controls = new OrbitControls(camera, renderer.domElement)
      controls.zoomSpeed = 0.5
      controls.enableDamping = true

      renderer.render(scene, camera)

      const subscription = size$.subscribe((sizes) => {
        camera.aspect = sizes.x / sizes.y
        camera.updateProjectionMatrix()
        renderer.setSize(sizes.x, sizes.y)
        renderer.setPixelRatio(Math.min(2, window.devicePixelRatio))
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

      const props: ('x' | 'y' | 'z')[] = ['x', 'y', 'z']

      return {
        renderer,
        scene,
        camera,
        controls,
        meshes,
        gui,
        subscription,
        mousePosition$,
        clock,
      }

      function spin() {
        const p = props.shift()
        if (!p) return
        props.push(p)
        for (const mesh of meshes) {
          gsap.to(mesh.rotation, {
            [p]: Math.PI * 2,
            duration: 1,
            ease: 'power2.inOut',
            onComplete: () => {
              mesh.rotation[p] = 0
            },
          })
        }
      }
    },
    ({ scene, camera, renderer, controls }) => {
      controls.update()

      renderer.render(scene, camera)
    },
    ({ subscription, clock, controls, gui }) => {
      subscription.unsubscribe()
      clock.stop()
      controls.dispose()
      gui.destroy()
    },
  )
}
