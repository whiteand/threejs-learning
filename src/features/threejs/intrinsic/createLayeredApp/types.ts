export type FigureMesh<M extends THREE.Material = THREE.Material> = THREE.Mesh<
  THREE.TubeGeometry,
  M
>
export interface IGlobalSettings {
  time: number
  bgColor: THREE.Color
  duration: number
  play(): void
  stop(): void
}
