/* Fondo animado: arcos de luz rosa/magenta (shader WebGL, sin librerías) */
(function () {
  const canvas = document.getElementById('bg');
  if (!canvas) return;
  const gl = canvas.getContext('webgl', { antialias: false, alpha: false });
  if (!gl) { document.body.classList.add('no-webgl'); return; }

  // ---- Ajustes ----
  const SPEED = 0.8;                 // 0 = congelado
  const LINE_WIDTH = 0.0022;         // grosor del brillo
  const BRIGHTNESS = 1.05;
  const TINT = [1.0, 0.28, 0.66];    // rosa intenso (r, g, b de 0 a 1)
  const TINT2 = [0.62, 0.22, 1.0];   // morado, se mezcla con el rosa
  const RES_SCALE = 0.6;             // 1 = nitidez total; menor = más rápido

  const vs = 'attribute vec2 p; void main(){ gl_Position = vec4(p, 0.0, 1.0); }';
  const fs = `
    precision highp float;
    uniform vec2 resolution;
    uniform float time;
    uniform float uLine;
    uniform vec3 uTint;
    uniform vec3 uTint2;
    uniform float uBright;
    void main(void){
      vec2 uv = (gl_FragCoord.xy * 2.0 - resolution.xy) / min(resolution.x, resolution.y);
      float t = time * 0.05;
      vec3 color = vec3(0.0);
      for (int j = 0; j < 3; j++) {
        for (int i = 0; i < 5; i++) {
          color[j] += uLine * float(i * i) /
            abs(fract(t - 0.012 * float(j) + float(i) * 0.01) * 5.0
                - length(uv) + mod(uv.x + uv.y, 0.2));
        }
      }
      float mono = (color.r + color.g + color.b) / 3.0;
      float k = clamp(0.5 + 0.5 * sin(length(uv) * 1.6 - time * 0.02 + uv.x * 0.8), 0.0, 1.0);
      vec3 tint = mix(uTint, uTint2, k);
      vec3 c = mono * tint * uBright;
      gl_FragColor = vec4(1.0 - exp(-c * 1.6), 1.0);
    }`;

  function sh(type, src) {
    const s = gl.createShader(type);
    gl.shaderSource(s, src); gl.compileShader(s);
    if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) { console.warn(gl.getShaderInfoLog(s)); return null; }
    return s;
  }
  const v = sh(gl.VERTEX_SHADER, vs), f = sh(gl.FRAGMENT_SHADER, fs);
  if (!v || !f) { document.body.classList.add('no-webgl'); return; }
  const prog = gl.createProgram();
  gl.attachShader(prog, v); gl.attachShader(prog, f); gl.linkProgram(prog);
  gl.useProgram(prog);

  const buf = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, buf);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
  const loc = gl.getAttribLocation(prog, 'p');
  gl.enableVertexAttribArray(loc);
  gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);

  const U = n => gl.getUniformLocation(prog, n);
  const uRes = U('resolution'), uTime = U('time');
  gl.uniform1f(U('uLine'), LINE_WIDTH);
  gl.uniform3fv(U('uTint'), TINT);
  gl.uniform3fv(U('uTint2'), TINT2);
  gl.uniform1f(U('uBright'), BRIGHTNESS);

  function resize() {
    const dpr = Math.min(window.devicePixelRatio || 1, 1.5) * RES_SCALE;
    canvas.width = Math.max(2, Math.floor(window.innerWidth * dpr));
    canvas.height = Math.max(2, Math.floor(window.innerHeight * dpr));
    gl.viewport(0, 0, canvas.width, canvas.height);
    gl.uniform2f(uRes, canvas.width, canvas.height);
  }
  resize();
  window.addEventListener('resize', resize);

  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  let time = 1.0;
  function frame() {
    if (!reduce && !document.hidden) time += 0.05 * SPEED;
    gl.uniform1f(uTime, time);
    gl.drawArrays(gl.TRIANGLES, 0, 3);
    requestAnimationFrame(frame);
  }
  frame();
})();