import { Object3DEventMap } from 'three'
import { GLTF } from 'three/examples/jsm/loaders/GLTFLoader.js'

/* eslint-disable @typescript-eslint/no-explicit-any */
export type FigureMesh = THREE.Group<Object3DEventMap> & {
  material: THREE.MeshBasicMaterial
}
export interface IGlobalSettings {
  time: number
  bgColor: THREE.Color
  duration: number
  yoyo: boolean
  modelUrl: string
  defaultElementsNumber: number
  model: GLTF | null
  loadModel(): Promise<void>
  play(): void
  stop(): void
}
