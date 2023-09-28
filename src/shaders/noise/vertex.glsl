varying vec2 vUv;
uniform float uScale;

void main() {
    vUv = uv;
    vec3 scaledPosition = position * uScale;
    gl_Position = projectionMatrix * viewMatrix * modelMatrix * vec4(scaledPosition, 1.0);
}