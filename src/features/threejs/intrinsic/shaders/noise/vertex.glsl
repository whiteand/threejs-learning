varying vec2 vUv;
varying vec3 vNormal;

void main() {
    vUv = uv;
    vNormal = normalize(normalMatrix * normal);

    gl_Position = projectionMatrix * viewMatrix * modelMatrix * vec4(position, 1.0);
}