uniform sampler2D uMainTexture;
uniform sampler2D uSecondaryTexture;
uniform vec3 uBgColor;

varying vec2 vUv;

void main() {
    vec4 mainColor = texture2D(uMainTexture, vUv);
    vec4 secondaryColor = texture2D(uSecondaryTexture, vUv);
    gl_FragColor = mainColor * mainColor.a + secondaryColor * (1. - mainColor.a);
    gl_FragColor += vec4(uBgColor, 1.) * (1. - gl_FragColor.a);
}