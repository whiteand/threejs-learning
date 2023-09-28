import * as THREE from 'three'

export interface ILayer {
  update(): void
  destroy(): void
  getTexture(): THREE.Texture
}
