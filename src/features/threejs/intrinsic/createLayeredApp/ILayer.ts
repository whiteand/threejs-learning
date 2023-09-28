import * as THREE from 'three'
import { IGlobalSettings } from './types'

export interface ILayer {
  update(globalSettings: IGlobalSettings): void
  destroy(): void
  getTexture(): THREE.Texture
}
