import fragmentShader from './fragment.glsl'
import vertexShader from './vertex.glsl'

export function createComposeShader(): THREE.ShaderMaterialParameters {
  return {
    transparent: true,
    uniforms: {
      uMainTexture: { value: null },
      uSecondaryTexture: { value: null },
      uBgColor: { value: null },
    },
    vertexShader,
    fragmentShader,
  }
}
