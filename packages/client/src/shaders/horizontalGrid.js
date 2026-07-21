// Inlined as JS strings so brahma-xr imports cleanly in any app,
// with no glsl bundler plugin required.

export const horizontalGridVertexShader = /* glsl */ `
varying vec3 vPosition;

void main() {

    vec4 modelPosition = modelMatrix * vec4(position, 1.0);
    vec4 viewPosition = viewMatrix * modelPosition;
    vec4 projectedPosition = projectionMatrix * viewPosition;
    gl_Position = projectedPosition;
    vPosition = position;
}
`;

export const horizontalGridFragmentShader = /* glsl */ `
varying vec3 vPosition;

void main() {
    vec3 color = vec3(1.0);
    float thickness = 0.01;
    float opacity = smoothstep(1.0-thickness ,1.0,(vPosition.x - thickness/2.0) - floor(vPosition.x-thickness/2.0));
    opacity += smoothstep(1.0-thickness ,1.0,(vPosition.y - thickness/2.0) - floor(vPosition.y-thickness/2.0));opacity = opacity/2.0;
    opacity = step(0.01,opacity);
    opacity = opacity/4.0;
    gl_FragColor = vec4(color,opacity);
}
`;
