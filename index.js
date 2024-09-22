// @ts-check

const vertexShaderGLSL = `
#version 100
void main() {
  gl_Position = vec4(0.0, 0.0, 0.0, 1.0);
  gl_PointSize = 64.0;
}
`;

const fragmentShaderGLSL = `
#version 100
void main() {
  gl_FragColor = vec4(0.18, 0.54, 0.34, 1.0);
}
`;

var gl = getRenderingContext();

var vertexShader = /** @type {WebGLShader} */(gl.createShader(gl.VERTEX_SHADER));
gl.shaderSource(vertexShader, vertexShaderGLSL);
gl.compileShader(vertexShader);
var fragmentShader = /** @type {WebGLShader} */(gl.createShader(gl.FRAGMENT_SHADER));
gl.shaderSource(fragmentShader, fragmentShaderGLSL);
gl.compileShader(fragmentShader);
var program = /** @type {WebGLProgram} */(gl.createProgram());
gl.attachShader(program, vertexShader);
gl.attachShader(program, fragmentShader);
gl.linkProgram(program);
gl.detachShader(program, vertexShader);
gl.detachShader(program, fragmentShader);
gl.deleteShader(vertexShader);
gl.deleteShader(fragmentShader);
if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
  var linkErrLog = gl.getProgramInfoLog(program);
  cleanup();
  throw new Error(
    'Shader program did not link successfully. ' +
    linkErrLog);
}

initBuffer();

gl.useProgram(program);
gl.drawArrays(gl.POINTS, 0, 1);

console.log(
  'success',
  {
    gl,
    vertexShader,
    fragmentShader,
    program
  });

cleanup();

var buffer;
function initBuffer() {
  gl.enableVertexAttribArray(0);
  buffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
  gl.vertexAttribPointer(0, 1, gl.FLOAT, false, 0, 0);
}

function cleanup() {
  gl.useProgram(null);
  if (buffer) gl.deleteBuffer(buffer);
  if (program) gl.deleteProgram(program);
}

function getRenderingContext() {
  var canvas = document.createElement("canvas");
  canvas.style.cssText =
    'position: absolute; left: 0; top: 0; width: 100%; height: 100%;';
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
  document.body.appendChild(canvas);
  var gl = /** @type {WebGLRenderingContext} */(canvas.getContext("webgl"));
  if (!gl) gl = /** @type {WebGLRenderingContext} */(canvas.getContext("experimental-webgl"));

  gl.viewport(0, 0,
    gl.drawingBufferWidth, gl.drawingBufferHeight);
  gl.clearColor(0.0, 0.0, 0.0, 1.0);
  gl.clear(gl.COLOR_BUFFER_BIT);
  return gl;
}

/**
 * @typedef {{
 *  x: number,
 *  y: number,
 *  vx: number,
 *  vy: number,
 *  mass: number,
 *  hue: number,
 *  charge: number
 * }} Particle
 */

/**
 * 
 * @param {{
 *  canvas?: HTMLCanvasElement | string
 * }} [options] 
 */
function particleRenderer({ canvas } = {}) {
  const canvasElem =
    /** @type {HTMLCanvasElement} */(typeof canvas == 'string' ? document.querySelector(canvas) : canvas) ||
    createBodyCanvas();

  const gl = canvasElem.getContext('webgl');
  if (!gl) throw new Error('WebGL not supported');

  /**
   * @param {Particle} particles
   */
  function bulk(particles) {
  }

  /**
   * @param {Particle} particles
   */
  function append(particles) {
  }

  /**
   * @param {Particle} particles
   */
  function remove(particles) {
  }

  function createBodyCanvas() {
    /** @type {HTMLCanvasElement & {created?: boolean}} */
    const canvas = document.createElement('canvas');
    canvas.style.cssText = 'position: absolute; left: 0; top: 0; width: 100%; height: 100%;';
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    document.body.appendChild(canvas);
    canvas.created = true;
    return canvas;
  }
}
