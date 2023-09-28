import fragmentShader from './fragment.glsl'
import vertexShader from './vertex.glsl'

export function createShader(): THREE.ShaderMaterialParameters {
  return {
    transparent: true,
    uniforms: {
      uColor: { value: null },
      uFraction: { value: 1 },
      uCameraDirection: { value: null },
      uScale: { value: null },
    },
    vertexShader,
    fragmentShader,
  }
}
