import * as THREE from 'three'
import noiseFragmentShader from './noiseFragment.glsl'
import noiseVertexShader from './noiseVertex.glsl'

export function createNoiseShader(): THREE.ShaderMaterialParameters & {
  uniforms: {
    tDiffuse: THREE.IUniform
    uSize: THREE.IUniform
    uTime: THREE.IUniform
  }
} {
  return {
    uniforms: {
      tDiffuse: { value: null },
      uSize: { value: 125 },
      uTime: { value: 1 },
    },
    vertexShader: noiseVertexShader,
    fragmentShader: noiseFragmentShader,
  }
}
