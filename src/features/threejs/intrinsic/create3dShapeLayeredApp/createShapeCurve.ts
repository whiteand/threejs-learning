import * as THREE from 'three'

export function createShapeCurve(): THREE.CurvePath<THREE.Vector3> {
  const shapeCurve = new THREE.CurvePath<THREE.Vector3>()
  const a = new THREE.Vector3(0, 0.5)
  const b = new THREE.Vector3(-0.5, 0)
  const c = new THREE.Vector3(0, -0.5)
  const d = new THREE.Vector3(0.5, 0)

  const edges = [
    [b, c],
    [c, d],
    [d, a],
    [a, b],
  ]

  for (const [from, to] of edges) {
    shapeCurve.add(new THREE.LineCurve3(from, to))
  }

  return shapeCurve
}
