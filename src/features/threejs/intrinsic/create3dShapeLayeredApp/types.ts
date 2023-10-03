import { Object3DEventMap } from 'three'

/* eslint-disable @typescript-eslint/no-explicit-any */
export type FigureMesh = THREE.Group<Object3DEventMap> & {
  material: THREE.MeshBasicMaterial
}
export interface IGlobalSettings {
  time: number
  bgColor: THREE.Color
  duration: number
  yoyo: boolean
  play(): void
  stop(): void
}
