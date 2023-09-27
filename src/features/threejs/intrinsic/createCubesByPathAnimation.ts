import gsap from 'gsap'
import GUI from 'lil-gui'
import { BehaviorSubject, fromEvent, map } from 'rxjs'
import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import { createApp } from '~/packages/interactive-app'

function addCubesAlongCurve(
  curve: THREE.CatmullRomCurve3,
  cubesNumber: number,
  scene: THREE.Scene,
): { dispose(): void; meshes: THREE.Object3D[]; animate(time: number): void } {
  const cubes: THREE.LineSegments[] = []

  const geometry = new THREE.BoxGeometry(0.2, 0.2, 0.2)
  const edgeMaterial = new THREE.LineBasicMaterial({
    color: 0x000000,
    linewidth: 3,
  })
  const edgeGeometry = new THREE.EdgesGeometry(geometry)
  // const material = new THREE.MeshStandardMaterial({
  //   color: 0x000000,
  //   transparent: true,
  //   opacity: 0.75,
  // })

  function updateMesh(
    mesh: { position: THREE.Vector3; lookAt(vec: THREE.Vector3): void },
    ind: number,
    time: number,
  ) {
    const ratio = ind / cubesNumber
    let actualRatio = ratio + time
    while (actualRatio > 1) {
      actualRatio -= 1
    }
    mesh.position.copy(curve.getPoint(actualRatio))
    mesh.lookAt(curve.getTangent(actualRatio))
  }

  for (let i = 0; i < cubesNumber; i++) {
    const edges = new THREE.LineSegments(edgeGeometry, edgeMaterial)

    updateMesh(edges, i, 0)

    cubes.push(edges)
    scene.add(edges)
  }
  return {
    dispose: () => {
      scene.remove(...cubes)
      for (const cube of cubes) {
        cube.material
      }
    },
    meshes: cubes,
    animate(time: number) {
      for (let i = 0; i < cubes.length; i++) {
        updateMesh(cubes[i], i, time)
      }
    },
  }
}

export default function createIntrinsicApp(
  canvas: HTMLCanvasElement,
  size$: BehaviorSubject<THREE.Vector2>,
) {
  return createApp(
    () => {
      const gui = new GUI()
      const settings = {
        bgColor: 0xd9d9d9,
        cubesNumber: 20,
        animationTime: 0,
        play() {
          gsap.fromTo(
            this,
            {
              animationTime: 0,
            },
            {
              animationTime: 1,
              onUpdate: () => {
                cubes.animate(this.animationTime)
              },
              duration: 10,
              ease: 'power2.inOut',
            },
          )
        },
      }

      // Building Scene
      const scene = new THREE.Scene()

      const clock = new THREE.Clock()

      // const axesHelper = new THREE.AxesHelper()
      // scene.add(axesHelper)

      const curve = new THREE.CatmullRomCurve3(
        [
          new THREE.Vector3(-0.5, 0, 0),
          new THREE.Vector3(-0.5, 0.5, -0.5),
          new THREE.Vector3(0.5, -0.5, 0.5),
          new THREE.Vector3(0.5, 0, 1),
        ],
        true,
      )

      let cubes = addCubesAlongCurve(curve, settings.cubesNumber, scene)

      gui
        .add(settings, 'cubesNumber')
        .min(1)
        .max(50)
        .step(1)
        .name('Cubes Number')
        .onChange(() => {
          cubes.dispose()
          cubes = addCubesAlongCurve(curve, settings.cubesNumber, scene)
        })

      gui
        .add(settings, 'animationTime')
        .min(0)
        .max(1)
        .step(0.001)
        .onChange(() => {
          cubes.animate(settings.animationTime)
        })

      gui.add(settings, 'play')

      // Camera
      const camera = new THREE.PerspectiveCamera(
        55,
        size$.getValue().x / size$.getValue().y,
      )

      camera.position.set(0, 0, 2)
      camera.lookAt(new THREE.Vector3())

      scene.add(camera)

      scene.add(new THREE.AmbientLight(0xffffff, 0.5))
      const pointLight = new THREE.PointLight(0xffffff, 15)
      pointLight.position.set(1, 2, 3)
      scene.add(pointLight)

      // Renderer
      const renderer = new THREE.WebGLRenderer({
        canvas,
        alpha: true,
      })

      renderer.setPixelRatio(Math.min(2, window.devicePixelRatio))
      renderer.setClearColor(settings.bgColor, 1)
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

      return {
        renderer,
        scene,
        camera,
        controls,
        subscription,
        mousePosition$,
        clock,
        gui,
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
