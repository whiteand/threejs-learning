import fragmentShader from './fragment.glsl'
import vertexShader from './vertex.glsl'

export function createShader(): THREE.ShaderMaterialParameters {
  return {
    transparent: true,
    uniforms: {
      uTime: { value: 0 },
      uColor: { value: null },
      uFraction: { value: 1 },
      uCameraPosition: { value: null },
    },
    vertexShader,
    fragmentShader,
  }
}
