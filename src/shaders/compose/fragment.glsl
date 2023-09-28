uniform sampler2D uMainTexture;
uniform sampler2D uSecondaryTexture;

varying vec2 vUv;

void main() {
    vec4 mainColor = texture2D(uMainTexture, vUv);
    vec4 secondaryColor = texture2D(uSecondaryTexture, vUv);

    gl_FragColor = mainColor * mainColor.a + secondaryColor * (1. - mainColor.a);
}