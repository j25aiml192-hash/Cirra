"use client";

import React, { useEffect, useRef } from "react";

export interface VoxelArcProps {
  className?: string;
  theme?: "light" | "dark";
  speed?: number;
  waveHeight?: number;
  voxelDensity?: number;
  interactive?: boolean;
  transparentBackground?: boolean;
}

export function VoxelArc({
  className = "",
  theme = "light",
  speed = 1.0,
  waveHeight = 1.0,
  voxelDensity = 24.0,
  interactive = true,
  transparentBackground = true,
}: VoxelArcProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const mouseRef = useRef({ x: 0.5, y: 0.5, targetX: 0.5, targetY: 0.5 });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const gl =
      canvas.getContext("webgl", { antialias: true, alpha: true }) ||
      (canvas.getContext("experimental-webgl") as WebGLRenderingContext | null);

    if (!gl) return;

    const vsSource = `
      attribute vec2 a_position;
      varying vec2 v_uv;
      void main() {
        v_uv = (a_position + 1.0) * 0.5;
        gl_Position = vec4(a_position, 0.0, 1.0);
      }
    `;

    const isLight = theme === "light";

    const fsSource = `
      precision highp float;
      varying vec2 v_uv;
      uniform vec2 u_resolution;
      uniform float u_time;
      uniform vec2 u_mouse;
      uniform float u_speed;
      uniform float u_wave_height;
      uniform float u_density;
      uniform float u_is_light;
      uniform float u_transparent_bg;

      // Rolling voxel sea and planetary horizon curvature
      float map(vec2 p) {
        float t = u_time * 0.7 * u_speed;
        
        float h = sin(p.y * 1.8 - t) * 0.38 * u_wave_height;
        h += cos(p.y * 3.4 - t * 1.35 + sin(p.x * 1.3)) * 0.22 * u_wave_height;
        h += sin(p.x * 2.2 + t * 0.6) * 0.16 * u_wave_height;
        h += cos(p.x * 3.8 + p.y * 2.4 - t * 1.1) * 0.08 * u_wave_height;
        
        // Mouse wake ripple
        vec2 mPos = (u_mouse - 0.5) * vec2(6.0, 4.0) + vec2(0.0, 3.5);
        float mDist = length(p - mPos);
        h += exp(-mDist * mDist * 1.4) * 0.42;

        // Curved planetary dome/arc: slopes downward sharply on sides and horizon
        h -= pow(p.x * 0.32, 2.0) * 0.75;
        h -= pow(max(0.0, p.y - 1.2) * 0.4, 2.0) * 0.8;

        return h;
      }

      vec3 calcNormal(vec2 p) {
        vec2 eps = vec2(0.03, 0.0);
        float h = map(p);
        return normalize(vec3(
          map(p - eps.xy) - map(p + eps.xy),
          eps.x * 2.0,
          map(p - eps.yx) - map(p + eps.yx)
        ));
      }

      void main() {
        vec2 uv = (gl_FragCoord.xy - u_resolution * 0.5) / u_resolution.y;

        // Camera setup: low angled perspective viewing across the curved horizon
        vec3 ro = vec3(0.0, 1.35, -2.2);
        vec3 rd = normalize(vec3(uv.x, uv.y - 0.08, 1.55));

        // Background color
        vec3 bgColorDark = mix(
          vec3(0.02, 0.015, 0.05),
          vec3(0.06, 0.03, 0.14),
          smoothstep(-0.2, 0.3, uv.y)
        );

        // Bright theme: clean white fading to very soft sky tint near horizon
        vec3 bgColorLight = mix(
          vec3(1.0, 1.0, 1.0),
          vec3(0.94, 0.97, 1.0),
          smoothstep(-0.3, 0.4, uv.y)
        );

        vec3 bgColor = mix(bgColorDark, bgColorLight, u_is_light);

        // Raymarch
        float tRay = 0.0;
        float hitDist = -1.0;
        vec3 hitPos = vec3(0.0);

        for (int i = 0; i < 48; i++) {
          vec3 p = ro + rd * tRay;
          float h = map(p.xz);
          if (p.y < h) {
            hitDist = tRay;
            hitPos = p;
            break;
          }
          tRay += max(0.06, (p.y - h) * 0.45);
          if (tRay > 12.0) break;
        }

        vec3 col = bgColor;
        float alpha = 1.0;

        if (hitDist > 0.0) {
          vec2 gridCoords = hitPos.xz * u_density;
          vec2 localGrid = abs(fract(gridCoords) - 0.5);
          float squareVoxel = max(localGrid.x, localGrid.y);

          // Crisp square voxel tile with dark border seams
          float voxelMask = smoothstep(0.48, 0.38, squareVoxel);

          // Lighting calculations
          vec3 nor = calcNormal(hitPos.xz);
          vec3 lightDir = normalize(vec3(0.35, 1.25, 0.75));
          
          float diff = max(0.0, dot(nor, lightDir));
          vec3 ref = reflect(-lightDir, nor);
          float spec = pow(max(0.0, dot(ref, -rd)), 16.0);

          float elevation = hitPos.y;

          // DARK THEME PALETTE (Cosmic Violet)
          vec3 darkValley  = vec3(0.07, 0.03, 0.18);
          vec3 darkMid     = vec3(0.28, 0.12, 0.72);
          vec3 darkCrest   = vec3(0.78, 0.68, 0.98);
          vec3 darkSurface = mix(darkValley, darkMid, smoothstep(-0.3, 0.3, elevation));
          darkSurface = mix(darkSurface, darkCrest, smoothstep(0.2, 0.7, elevation) * 0.85);

          // BRIGHT THEME PALETTE (Cirra Electric Blue & Cyan on White)
          vec3 lightValley  = vec3(0.08, 0.38, 0.85);   // Lighter, luminous royal blue in troughs
          vec3 lightMid     = vec3(0.16, 0.54, 0.98);   // Vibrant electric sky blue
          vec3 lightCrest   = vec3(0.45, 0.85, 1.0);    // Luminous bright cyan on crests
          vec3 lightSurface = mix(lightValley, lightMid, smoothstep(-0.3, 0.25, elevation));
          lightSurface = mix(lightSurface, lightCrest, smoothstep(0.15, 0.65, elevation));

          vec3 surfaceCol = mix(darkSurface, lightSurface, u_is_light);

          // Voxel grid seam contrast - light, elegant soft seams instead of harsh black lines
          vec3 darkSeam  = surfaceCol * 0.15;
          vec3 lightSeam = mix(surfaceCol * 0.82, vec3(0.65, 0.88, 1.0), 0.45);
          vec3 seamBase  = mix(darkSeam, lightSeam, u_is_light);
          vec3 voxelCol  = mix(seamBase, surfaceCol, voxelMask);

          // Specular highlights
          vec3 specCol = mix(vec3(0.85, 0.80, 1.0), vec3(1.0, 1.0, 1.0), u_is_light);
          voxelCol += spec * specCol * voxelMask * (u_is_light > 0.5 ? 0.75 : 1.2);

          // Atmospheric depth haze fading into background
          float fog = smoothstep(1.5, 9.5, hitDist);
          col = mix(voxelCol, bgColor, fog);
          if (u_transparent_bg > 0.5) {
            alpha = 1.0 - smoothstep(7.0, 11.5, hitDist);
          }
        } else {
          if (u_transparent_bg > 0.5) {
            alpha = 0.0;
          }
        }

        // Horizon arc glow/bloom: luminous atmospheric light along the rim
        float horizonLine = smoothstep(0.22, -0.06, abs(uv.y + 0.06));
        vec3 glowCol = mix(vec3(0.35, 0.18, 0.75), vec3(0.0, 0.42, 0.95), u_is_light);
        col += glowCol * horizonLine * (u_is_light > 0.5 ? 0.08 : 0.18);
        if (u_transparent_bg > 0.5) {
          alpha = max(alpha, horizonLine * 0.15);
        }

        // Soft vignette
        float vig = 1.0 - dot(v_uv - 0.5, v_uv - 0.5) * (u_is_light > 0.5 ? 0.25 : 0.65);
        col *= vig;

        gl_FragColor = vec4(col * alpha, alpha);
      }
    `;

    function createShader(glCtx: WebGLRenderingContext, type: number, src: string) {
      const shader = glCtx.createShader(type);
      if (!shader) return null;
      glCtx.shaderSource(shader, src);
      glCtx.compileShader(shader);
      if (!glCtx.getShaderParameter(shader, glCtx.COMPILE_STATUS)) {
        console.error(glCtx.getShaderInfoLog(shader));
        glCtx.deleteShader(shader);
        return null;
      }
      return shader;
    }

    const vs = createShader(gl, gl.VERTEX_SHADER, vsSource);
    const fs = createShader(gl, gl.FRAGMENT_SHADER, fsSource);
    if (!vs || !fs) return;

    const program = gl.createProgram();
    if (!program) return;
    gl.attachShader(program, vs);
    gl.attachShader(program, fs);
    gl.linkProgram(program);

    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
      console.error(gl.getProgramInfoLog(program));
      return;
    }

    gl.useProgram(program);

    const quadBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, quadBuffer);
    gl.bufferData(
      gl.ARRAY_BUFFER,
      new Float32Array([-1, -1, 1, -1, -1, 1, -1, 1, 1, -1, 1, 1]),
      gl.STATIC_DRAW
    );

    const posAttr = gl.getAttribLocation(program, "a_position");
    gl.enableVertexAttribArray(posAttr);
    gl.vertexAttribPointer(posAttr, 2, gl.FLOAT, false, 0, 0);

    const uResolution = gl.getUniformLocation(program, "u_resolution");
    const uTime = gl.getUniformLocation(program, "u_time");
    const uMouse = gl.getUniformLocation(program, "u_mouse");
    const uSpeed = gl.getUniformLocation(program, "u_speed");
    const uWaveHeight = gl.getUniformLocation(program, "u_wave_height");
    const uDensity = gl.getUniformLocation(program, "u_density");
    const uIsLight = gl.getUniformLocation(program, "u_is_light");
    const uTransparentBg = gl.getUniformLocation(program, "u_transparent_bg");

    let animId: number;
    let startTimeMs = performance.now();

    const handleWindowMouseMove = (e: MouseEvent) => {
      if (!interactive) return;
      const rect = canvas.getBoundingClientRect();
      const x = (e.clientX - rect.left) / rect.width;
      const y = 1.0 - (e.clientY - rect.top) / rect.height;
      mouseRef.current.targetX = Math.max(0, Math.min(1, x));
      mouseRef.current.targetY = Math.max(0, Math.min(1, y));
    };

    window.addEventListener("mousemove", handleWindowMouseMove);

    const renderLoop = (now: number) => {
      mouseRef.current.x += (mouseRef.current.targetX - mouseRef.current.x) * 0.06;
      mouseRef.current.y += (mouseRef.current.targetY - mouseRef.current.y) * 0.06;

      const rect = canvas.getBoundingClientRect();
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const w = Math.floor(rect.width * dpr);
      const h = Math.floor(rect.height * dpr);

      if (canvas.width !== w || canvas.height !== h) {
        canvas.width = w;
        canvas.height = h;
        gl.viewport(0, 0, w, h);
      }

      gl.useProgram(program);

      const elapsed = (now - startTimeMs) * 0.001;
      gl.uniform2f(uResolution, canvas.width, canvas.height);
      gl.uniform1f(uTime, elapsed);
      gl.uniform2f(uMouse, mouseRef.current.x, mouseRef.current.y);
      gl.uniform1f(uSpeed, speed);
      gl.uniform1f(uWaveHeight, waveHeight);
      gl.uniform1f(uDensity, voxelDensity);
      gl.uniform1f(uIsLight, isLight ? 1.0 : 0.0);
      gl.uniform1f(uTransparentBg, transparentBackground ? 1.0 : 0.0);

      gl.drawArrays(gl.TRIANGLES, 0, 6);

      animId = requestAnimationFrame(renderLoop);
    };

    animId = requestAnimationFrame(renderLoop);

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener("mousemove", handleWindowMouseMove);
      if (quadBuffer) gl.deleteBuffer(quadBuffer);
      if (program) gl.deleteProgram(program);
      if (vs) gl.deleteShader(vs);
      if (fs) gl.deleteShader(fs);
    };
  }, [theme, speed, waveHeight, voxelDensity, interactive, transparentBackground]);

  return (
    <div
      className={`absolute inset-0 w-full h-full pointer-events-none select-none overflow-hidden ${className}`}
      aria-hidden="true"
    >
      <canvas
        ref={canvasRef}
        className="w-full h-full block"
        style={{ width: "100%", height: "100%" }}
      />
    </div>
  );
}

export default VoxelArc;
