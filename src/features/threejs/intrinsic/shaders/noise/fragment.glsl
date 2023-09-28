float random(vec2 st) {
    return fract(sin(dot(st.xy, vec2(12.9898, 78.233))) *
        43758.5453123);
}
uniform float uFraction;
uniform vec3 uColor;
varying vec2 vUv;

float getNoiseValue() {
    if(uFraction <= 0.0)
        return 0.0;
    if(uFraction >= 1.0)
        return 1.0;
    float randPos = random(vUv);
    return randPos <= uFraction ? 1.0 : 0.0;
}

float getMatCapValue() {
    return 1.0;
}

void main() {
    float visible = getNoiseValue();
    float matCapValue = getMatCapValue();

    gl_FragColor = vec4(uColor, matCapValue * visible);
}