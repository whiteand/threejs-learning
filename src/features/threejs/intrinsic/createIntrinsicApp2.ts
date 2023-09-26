import gsap from 'gsap'
import GUI from 'lil-gui'
import { MeshLineGeometry, MeshLineMaterial } from 'meshline'
import { BehaviorSubject, filter, fromEvent, map } from 'rxjs'
import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import { createApp } from '~/packages/interactive-app'

type Cube = THREE.Mesh
function addCubesAlongCurve(
  curve: THREE.CatmullRomCurve3,
  cubesNumber: number,
  scene: THREE.Scene,
  size$: BehaviorSubject<THREE.Vector2>,
): {
  dispose(): void
  meshes: Cube[]
  animate(time: number): void
} {
  const cubes: Cube[] = []

  const geometry = new MeshLineGeometry()

  geometry.setPoints([
    new THREE.Vector3(-0.5, -0.5, 0),
    new THREE.Vector3(0.5, -0.5, 0),
    new THREE.Vector3(0.5, 0.5, 0),
    new THREE.Vector3(-0.5, 0.5, 0),
    new THREE.Vector3(-0.5, -0.5, 0),
  ])

  geometry.scale(0.5, 0.5, 0.5)

  const materials = Array.from({ length: cubesNumber }, (_, ind) => {
    const res = new MeshLineMaterial({
      color: 0xffffff,
      lineWidth: 0.05,
      resolution: size$.getValue(),
      opacity: ind === 0 ? 1 : 0,
    })
    res.depthTest = ind === 0 ? false : true
    res.transparent = true
    return res
  })
  // const edgeGeometry = new THREE.EdgesGeometry(geometry)

  function updateMesh(mesh: Cube, ind: number, time: number) {
    const ratio = ind / cubesNumber

    if (ind === 0) {
      materials[ind].opacity = 1
      mesh.position.copy(curve.getPointAt(time))
      mesh.lookAt(curve.getTangentAt(time))
    } else {
      if (ratio < time) {
        scene.remove(mesh)
      } else if (!scene.children.includes(mesh)) {
        scene.add(mesh)
      }
      if (ratio < time) return
      const targetOpacity = Math.pow(1 - Math.abs(time - ratio), 2)
      const appearinAnimationTime = THREE.MathUtils.clamp(
        time / (0.1 + ratio * 0.4),
        0,
        1,
      )
      const easedAppearingTime = Math.pow(appearinAnimationTime, 2)
      materials[ind].opacity = targetOpacity * easedAppearingTime
      materials[ind].color.setHSL(ratio, 1, targetOpacity)
    }
  }

  for (let i = 0; i < cubesNumber; i++) {
    const cube = new THREE.Mesh(geometry, materials[i])

    const ratio = i / cubesNumber
    cube.position.copy(curve.getPointAt(ratio))
    cube.lookAt(curve.getTangentAt(ratio))
    cubes.push(cube)
    scene.add(cube)
  }

  return {
    dispose: () => {
      scene.remove(...cubes)
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
        cubesNumber: 40,
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

      const axesHelper = new THREE.AxesHelper()
      scene.add(axesHelper)

      const curve = new THREE.CatmullRomCurve3(
        [
          new THREE.Vector3(-1, 0, 0),
          new THREE.Vector3(-0.75, 0.5, 0.5),
          new THREE.Vector3(0.75, -0.5, -0.5),
          new THREE.Vector3(1, 0, 0),
        ],
        true,
      )

      let cubes = addCubesAlongCurve(curve, settings.cubesNumber, scene, size$)

      gui
        .add(settings, 'cubesNumber')
        .min(1)
        .max(50)
        .step(1)
        .name('Cubes Number')
        .onChange(() => {
          cubes.dispose()
          cubes = addCubesAlongCurve(curve, settings.cubesNumber, scene, size$)
        })

      gui
        .add(settings, 'animationTime')
        .min(0)
        .max(1)
        .step(1e-5)
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
      // renderer.setClearColor(settings.bgColor, 1)
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

      subscription.add(
        fromEvent<KeyboardEvent>(window, 'keydown', { passive: true })
          .pipe(filter((event) => event.key === ' '))
          .subscribe(() => {
            settings.play()
          }),
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
