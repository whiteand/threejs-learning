uniform sampler2D tDiffuse;
uniform ivec2 uResolution;
uniform float uBlur;

varying vec2 vUv;

vec4 blur13(sampler2D image, vec2 uv, vec2 resolution, float blur) {
    vec4 color = vec4(0.0);

    float a1 = 0.7853981633974483;
    float a2 = 1.5707963267948966;
    float a3 = 2.356194490192345;

    vec2 dir1 = vec2(cos(a1), sin(a1));
    vec2 dir2 = vec2(cos(a2), sin(a2));
    vec2 dir3 = vec2(cos(a3), sin(a3));

    vec2 off1 = vec2(1.411764705882353) * blur * dir1;
    vec2 off2 = vec2(3.2941176470588234) * blur * dir2;
    vec2 off3 = vec2(5.176470588235294) * blur * dir3;
    color += texture2D(image, uv) * 0.1964825501511404;
    color += texture2D(image, uv + (off1 / resolution)) * 0.2969069646728344;
    color += texture2D(image, uv - (off1 / resolution)) * 0.2969069646728344;
    color += texture2D(image, uv + (off2 / resolution)) * 0.09447039785044732;
    color += texture2D(image, uv - (off2 / resolution)) * 0.09447039785044732;
    color += texture2D(image, uv + (off3 / resolution)) * 0.010381362401148057;
    color += texture2D(image, uv - (off3 / resolution)) * 0.010381362401148057;
    return color;
}

void main() {
    gl_FragColor = blur13(tDiffuse, vUv, vec2(float(uResolution.x), float(uResolution.y)), uBlur);
}