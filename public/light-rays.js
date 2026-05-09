// Vanilla WebGL port of the React-Bits LightRays component.
// Renders animated volumetric light rays from `raysOrigin` over a fullscreen
// quad. Mirrors the parameter set used by the React version so values from the
// component spec map 1:1 here.
(function () {
  const PARAMS = {
    raysOrigin:    'top-center', // 'top-center' | 'top-left' | 'top-right' | 'left' | 'right' | 'bottom-center'
    raysColor:     '#ffffff',
    raysSpeed:     1,
    lightSpread:   0.5,
    rayLength:     3,
    followMouse:   true,
    mouseInfluence:0,
    noiseAmount:   0,
    distortion:    0,
    pulsating:     false,
    fadeDistance:  1,
    saturation:    1,
  };

  function originToVec(origin) {
    if (Array.isArray(origin)) return [origin[0], origin[1]];
    switch (origin) {
      case 'top-left':      return [0.0, 0.0];
      case 'top-right':     return [1.0, 0.0];
      case 'left':          return [0.0, 0.5];
      case 'right':         return [1.0, 0.5];
      case 'bottom-center': return [0.5, 1.0];
      case 'top-center':
      default:              return [0.5, 0.0];
    }
  }

  function hexToRgb(hex) {
    const m = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    if (!m) return [1, 1, 1];
    return [parseInt(m[1], 16) / 255, parseInt(m[2], 16) / 255, parseInt(m[3], 16) / 255];
  }

  const VS = `
    attribute vec2 aPos;
    void main() { gl_Position = vec4(aPos, 0.0, 1.0); }
  `;

  const FS = `
    precision highp float;
    uniform float uTime;
    uniform vec2  uResolution;
    uniform vec2  uOrigin;
    uniform vec3  uColor;
    uniform float uSpread;
    uniform float uLength;
    uniform float uSpeed;
    uniform vec2  uMouse;
    uniform float uMouseInfl;
    uniform float uSaturation;
    uniform float uFadeDistance;
    uniform float uNoise;
    uniform float uDistortion;
    uniform float uPulsating;

    float hash21(vec2 p) {
      p = fract(p * vec2(123.34, 456.21));
      p += dot(p, p + 45.32);
      return fract(p.x * p.y);
    }

    void main() {
      vec2 uv = gl_FragCoord.xy / uResolution;
      uv.y = 1.0 - uv.y;
      float aspect = uResolution.x / uResolution.y;
      vec2 uvA  = vec2(uv.x * aspect, uv.y);
      vec2 origA = vec2(uOrigin.x * aspect, uOrigin.y);
      vec2 mShift = (uMouse - vec2(0.5)) * uMouseInfl * 0.3;
      origA += vec2(mShift.x * aspect, mShift.y);

      vec2 d = uvA - origA;
      float dist = length(d);

      // Apply optional distortion to the angle
      float distort = uDistortion * 0.5 * sin(uvA.y * 8.0 + uTime * 0.6);
      float ang = atan(d.x, d.y) + distort;

      float t = uTime * uSpeed * 0.35;
      float spread = clamp(uSpread, 0.0, 1.0);

      // A handful of distinct rays fanning down
      float f1 = mix(2.5, 4.5, 1.0 - spread);
      float f2 = mix(4.0, 7.0, 1.0 - spread);
      float f3 = mix(6.0, 10.0, 1.0 - spread);
      float r =  sin(ang * f1 + t * 0.7);
            r += sin(ang * f2 - t * 0.5) * 0.7;
            r += sin(ang * f3 + t * 0.3) * 0.4;
      r = (r / 2.1) * 0.5 + 0.5; // 0..1

      // Moderate sharpness — defined edges without collapsing to a single beam
      float sharpness = mix(2.2, 4.5, 1.0 - spread);
      r = pow(r, sharpness);

      // Wider cone so multiple rays are visible across the top
      float coneExp = mix(1.0, 2.5, 1.0 - spread);
      float cone = pow(max(0.0, cos(ang)), coneExp);

      // Distance falloff
      float fall = exp(-dist * (1.0 / max(uLength, 0.01)));
      fall *= smoothstep(0.0, uFadeDistance * 0.3, dist);

      float intensity = r * cone * fall * 1.1;

      // Optional pulsation
      if (uPulsating > 0.5) {
        intensity *= 0.85 + 0.15 * sin(uTime * 1.6);
      }

      // Optional grain
      if (uNoise > 0.0) {
        float n = hash21(gl_FragCoord.xy + vec2(uTime * 60.0, -uTime * 47.0));
        intensity *= mix(1.0, n, uNoise);
      }

      intensity = clamp(intensity, 0.0, 1.0);

      // Premultiplied output: rgb already scaled by intensity, alpha = intensity.
      // The canvas uses premultipliedAlpha:true so the DOM compositor blends
      // this additively over the dark body background.
      vec3 base = mix(vec3(1.0), uColor, clamp(uSaturation, 0.0, 1.0));
      gl_FragColor = vec4(base * intensity, intensity);
    }
  `;

  function init(canvas, opts) {
    const params = Object.assign({}, PARAMS, opts || {});
    const gl = canvas.getContext('webgl', {
      alpha: true,
      premultipliedAlpha: true,
      antialias: true,
    });
    if (!gl) {
      console.warn('[light-rays] WebGL unavailable; skipping');
      return null;
    }

    function compile(type, src) {
      const s = gl.createShader(type);
      gl.shaderSource(s, src);
      gl.compileShader(s);
      if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) {
        console.error('[light-rays] shader compile:', gl.getShaderInfoLog(s));
      }
      return s;
    }

    const prog = gl.createProgram();
    gl.attachShader(prog, compile(gl.VERTEX_SHADER, VS));
    gl.attachShader(prog, compile(gl.FRAGMENT_SHADER, FS));
    gl.linkProgram(prog);
    if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) {
      console.error('[light-rays] link:', gl.getProgramInfoLog(prog));
      return null;
    }
    gl.useProgram(prog);

    const buf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1,-1, 1,-1, -1,1, 1,1]), gl.STATIC_DRAW);
    const aPos = gl.getAttribLocation(prog, 'aPos');
    gl.enableVertexAttribArray(aPos);
    gl.vertexAttribPointer(aPos, 2, gl.FLOAT, false, 0, 0);

    const u = {
      uTime:         gl.getUniformLocation(prog, 'uTime'),
      uResolution:   gl.getUniformLocation(prog, 'uResolution'),
      uOrigin:       gl.getUniformLocation(prog, 'uOrigin'),
      uColor:        gl.getUniformLocation(prog, 'uColor'),
      uSpread:       gl.getUniformLocation(prog, 'uSpread'),
      uLength:       gl.getUniformLocation(prog, 'uLength'),
      uSpeed:        gl.getUniformLocation(prog, 'uSpeed'),
      uMouse:        gl.getUniformLocation(prog, 'uMouse'),
      uMouseInfl:    gl.getUniformLocation(prog, 'uMouseInfl'),
      uSaturation:   gl.getUniformLocation(prog, 'uSaturation'),
      uFadeDistance: gl.getUniformLocation(prog, 'uFadeDistance'),
      uNoise:        gl.getUniformLocation(prog, 'uNoise'),
      uDistortion:   gl.getUniformLocation(prog, 'uDistortion'),
      uPulsating:    gl.getUniformLocation(prog, 'uPulsating'),
    };

    gl.uniform2fv(u.uOrigin,       originToVec(params.raysOrigin));
    gl.uniform3fv(u.uColor,        hexToRgb(params.raysColor));
    gl.uniform1f (u.uSpread,       params.lightSpread);
    gl.uniform1f (u.uLength,       params.rayLength);
    gl.uniform1f (u.uSpeed,        params.raysSpeed);
    gl.uniform1f (u.uMouseInfl,    params.followMouse ? params.mouseInfluence : 0);
    gl.uniform1f (u.uSaturation,   params.saturation);
    gl.uniform1f (u.uFadeDistance, params.fadeDistance);
    gl.uniform1f (u.uNoise,        params.noiseAmount);
    gl.uniform1f (u.uDistortion,   params.distortion);
    gl.uniform1f (u.uPulsating,    params.pulsating ? 1 : 0);

    let mouse = [0.5, 0.5];
    function onMouseMove(e) {
      mouse[0] = e.clientX / window.innerWidth;
      mouse[1] = e.clientY / window.innerHeight;
    }
    if (params.followMouse) window.addEventListener('mousemove', onMouseMove);

    function resize() {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const w   = Math.max(1, Math.floor(window.innerWidth  * dpr));
      const h   = Math.max(1, Math.floor(window.innerHeight * dpr));
      if (canvas.width !== w || canvas.height !== h) {
        canvas.width  = w;
        canvas.height = h;
        gl.viewport(0, 0, w, h);
        gl.uniform2f(u.uResolution, w, h);
      }
    }
    window.addEventListener('resize', resize);
    resize();

    // Single full-screen draw — no blending needed. The shader writes
    // premultiplied (color * intensity, intensity), and the DOM compositor
    // additively layers it over the dark body background.
    gl.disable(gl.BLEND);

    const start = performance.now();
    function frame() {
      const t = (performance.now() - start) / 1000;
      gl.uniform1f(u.uTime, t);
      gl.uniform2fv(u.uMouse, mouse);
      gl.clearColor(0, 0, 0, 0);
      gl.clear(gl.COLOR_BUFFER_BIT);
      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
      requestAnimationFrame(frame);
    }
    frame();
  }

  function start() {
    const canvas = document.getElementById('light-rays');
    if (!canvas) return;
    init(canvas, {
      // Push the convergence point above the viewport so the focal point
      // isn't visible — only the wider part of the rays shows on screen.
      raysOrigin:     [0.5, -0.4],
      raysColor:      '#ffffff',
      raysSpeed:      1,
      lightSpread:    0.5,
      rayLength:      3,
      followMouse:    false,
      mouseInfluence: 0,
      noiseAmount:    0,
      distortion:     0,
      pulsating:      false,
      fadeDistance:   1,
      saturation:     1,
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', start);
  } else {
    start();
  }
})();
