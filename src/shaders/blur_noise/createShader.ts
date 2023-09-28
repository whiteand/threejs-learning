import fragmentShader from './fragment.glsl'
import vertexShader from './vertex.glsl'

export function createBlurNoiseShader(): THREE.ShaderMaterialParameters {
  return {
    transparent: true,
    uniforms: {
      tDiffuse: { value: null },
      uResolution: { value: null },
      uBlur: { value: 0.0 },
    },
    name: 'BlurSecondaryLayout',
    vertexShader,
    fragmentShader,
  }
}
