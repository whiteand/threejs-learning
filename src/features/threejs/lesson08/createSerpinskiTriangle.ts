import { BehaviorSubject, fromEvent, map } from 'rxjs'
import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import { createApp } from '~/packages/interactive-app'

interface ITriangle {
  a: THREE.Vector2
  b: THREE.Vector2
  c: THREE.Vector2
  level: number
  path: number[]
}
function generatePositions(maxLevel: number): Float32Array {
  const triangles: ITriangle[] = [
    {
      a: new THREE.Vector2(Math.cos(0), Math.sin(0)),
      b: new THREE.Vector2(
        Math.cos((Math.PI * 2) / 3),
        Math.sin((Math.PI * 2) / 3),
      ),
      c: new THREE.Vector2(
        Math.cos((2 * Math.PI * 2) / 3),
        Math.sin((2 * Math.PI * 2) / 3),
      ),
      level: 0,
      path: [],
    },
  ]

  for (let i = 0; i < maxLevel; i++) {
    while (triangles[0].level === i) {
      const triangle = triangles.shift()!
      const { a, b, c, path } = triangle
      const ab = a.clone().lerp(b, 0.5)
      const bc = b.clone().lerp(c, 0.5)
      const ca = c.clone().lerp(a, 0.5)
      const newTriangle1: ITriangle = {
        a: a.clone(),
        b: ab,
        c: ca,
        level: i + 1,
        path: [...path, 0],
      }
      const newTriangle2: ITriangle = {
        a: ab,
        b: b.clone(),
        c: bc,
        level: i + 1,
        path: [...path, 1],
      }
      const newTriangle3: ITriangle = {
        a: ca,
        b: bc,
        c: c.clone(),
        level: i + 1,
        path: [...path, 2],
      }
      triangles.push(newTriangle1, newTriangle2, newTriangle3)
    }
  }

  const positions = new Float32Array(triangles.length * 3 * 3)
  for (let i = 0; i < triangles.length; i++) {
    const { a, b, c } = triangles[i]

    const z = 0
    positions[i * 9 + 0] = a.x
    positions[i * 9 + 1] = a.y
    positions[i * 9 + 2] = z
    positions[i * 9 + 3] = b.x
    positions[i * 9 + 4] = b.y
    positions[i * 9 + 5] = z
    positions[i * 9 + 6] = c.x
    positions[i * 9 + 7] = c.y
    positions[i * 9 + 8] = z
  }
  return positions
}

export default function createSerpinskiTriangle(
  canvas: HTMLCanvasElement,
  size$: BehaviorSubject<THREE.Vector2>,
) {
  const positions = generatePositions(0)

  return createApp(
    () => {
      // Building Scene
      const scene = new THREE.Scene()

      const clock = new THREE.Clock()

      const axesHelper = new THREE.AxesHelper()
      scene.add(axesHelper)

      const positionsAttribute = new THREE.BufferAttribute(positions, 3)

      const geometry = new THREE.BufferGeometry()
      geometry.setAttribute('position', positionsAttribute)

      // CUBE
      const meshes = [
        new THREE.Mesh(
          geometry,
          new THREE.MeshBasicMaterial({
            color: 0xffffff,
            wireframe: true,
          }),
        ),
        new THREE.Mesh(
          geometry,
          new THREE.MeshBasicMaterial({
            color: 0x336699,
          }),
        ),
      ]
      scene.add(...meshes)

      // Camera
      const camera = new THREE.PerspectiveCamera(
        55,
        size$.getValue().x / size$.getValue().y,
      )

      camera.position.set(0, 0, 3)
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

      return {
        renderer,
        scene,
        camera,
        controls,
        meshes,
        subscription,
        mousePosition$,
        clock,
      }
    },
    ({ scene, camera, renderer, controls, meshes }, time) => {
      controls.update()
      const newGeometry = new THREE.BufferGeometry()
      const positions = generatePositions(
        Math.floor(Math.sin(time / 1000) * 4 + 4),
      )
      newGeometry.setAttribute(
        'position',
        new THREE.BufferAttribute(positions, 3),
      )

      for (const mesh of meshes) {
        mesh.geometry = newGeometry
        mesh.updateMatrix()
      }

      renderer.render(scene, camera)
    },
    ({ subscription, clock, controls }) => {
      subscription.unsubscribe()
      clock.stop()
      controls.dispose()
    },
  )
}
