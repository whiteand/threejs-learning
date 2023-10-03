import * as THREE from 'three'

export function createGeometries(): Array<THREE.CapsuleGeometry> {
  const EDGE1 = 1
  const EDGE2 = 1.2
  const EDGE3 = 1.8
  const EDGE4 = 3.7
  const EDGE4_Z = Math.cos(Math.PI / 4) * EDGE4
  const EDGE4_Y = -Math.sin(Math.PI / 4) * EDGE4
  const A = new THREE.Vector3(0, EDGE2, 0)
  const B = new THREE.Vector3(EDGE1, EDGE2, 0)
  const C = new THREE.Vector3(EDGE1, 0, 0)
  const D = new THREE.Vector3(0, 0, 0)
  const E = new THREE.Vector3(0, EDGE2, EDGE3)
  const F = new THREE.Vector3(EDGE1, EDGE2, EDGE3)
  const G = new THREE.Vector3(EDGE1, 0, EDGE3)
  const H = new THREE.Vector3(0, 0, EDGE3)
  const I = new THREE.Vector3(0, EDGE2 + EDGE4_Y, EDGE3 + EDGE4_Z)
  const J = new THREE.Vector3(EDGE1, EDGE2 + EDGE4_Y, EDGE3 + EDGE4_Z)
  const K = new THREE.Vector3(EDGE1, EDGE4_Y, EDGE3 + EDGE4_Z)
  const L = new THREE.Vector3(0, EDGE4_Y, EDGE3 + EDGE4_Z)
  const edges = [
    [A, B],
    [B, C],
    [C, D],
    [D, A],
    [A, E],
    [E, F],
    [F, B],
    [C, G],
    [G, F],
    [G, H],
    [D, H],
    [H, E],
    [E, I],
    [I, J],
    [J, F],
    [G, K],
    [K, J],
    [I, L],
    [L, H],
    [L, K],
  ]

  return edges.map(([from, to]) => createCapsuleGeometry(from, to))
}
function createCapsuleGeometry(from: THREE.Vector3, to: THREE.Vector3) {
  const distance = from.distanceTo(to)

  const diff = to.clone().sub(from).normalize()
  const quaternion = new THREE.Quaternion()
  quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), diff)

  const geometry = new THREE.CapsuleGeometry(0.03, distance, 1, 5)
  geometry.applyQuaternion(quaternion)
  geometry.translate(
    from.x + (diff.x * distance) / 2,
    from.y + (diff.y * distance) / 2,
    from.z + (diff.z * distance) / 2,
  )

  return geometry
}
