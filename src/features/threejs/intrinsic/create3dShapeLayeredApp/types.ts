/* eslint-disable @typescript-eslint/no-explicit-any */
export type FigureMesh<M extends THREE.Material = THREE.Material> = THREE.Mesh<
  any,
  M
>
export interface IGlobalSettings {
  time: number
  bgColor: THREE.Color
  duration: number
  yoyo: boolean
  play(): void
  stop(): void
}
