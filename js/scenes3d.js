/* ============================================================
   TIMOTHÉE SOULEZ BARSELO — TACTILE ORGANIC 3D ENGINE
   1. Hero Organic Ink & Contour Topography Shader
   2. Realistic Sculpted 3D Hardcover Books (Curved Spine, Raised Bands,
      Beveled Thick Boards, Overhang, Linen BumpMap, Recessed Paper Block)
   3. Sculpted 3D Anatomical Brain (OASIS-1 MRI + Attention MIL)
   4. Anki 3D Physical Fieldnote Paper Deck (Zero rings/chains — pure tactile cards
      explaining all 5 projects, flip 180° + slide under deck animation!)
   5. Churn MLOps 3D Kubernetes Cluster + Click Center Pod -> Inside XGBoost
      3D Decision Tree & Churn vs Loyal Customer Separation Space!
   6. Parkinson MDS-UPDRS 3D Regression Space
   7. SRGAN HD Pixel Comparator (32x32 -> 64x64 -> 128x128)
   ============================================================ */

window.TSB3D = (() => {
  'use strict';

  function attachOrbit(canvas, state, onClick) {
    let dragging = false, moved = 0, lx = 0, ly = 0;
    canvas.addEventListener('pointerdown', (e) => {
      dragging = true; moved = 0; lx = e.clientX; ly = e.clientY;
      try { canvas.setPointerCapture(e.pointerId); } catch {}
    });
    canvas.addEventListener('pointermove', (e) => {
      if (!dragging) return;
      const dx = e.clientX - lx, dy = e.clientY - ly;
      moved += Math.abs(dx) + Math.abs(dy);
      state.vy = dx * 0.0085;
      state.vx = dy * 0.0065;
      state.ry += state.vy;
      state.rx = Math.max(-1.1, Math.min(1.1, state.rx + state.vx));
      lx = e.clientX; ly = e.clientY;
    });
    const stop = (e) => {
      if (dragging && moved < 6 && typeof onClick === 'function') onClick(e);
      dragging = false;
    };
    canvas.addEventListener('pointerup', stop);
    canvas.addEventListener('pointercancel', () => { dragging = false; });
    canvas._tsbDrag = (dx, dy) => {
      state.vy = dx * 0.009;
      state.vx = dy * 0.007;
      state.ry += state.vy;
      state.rx = Math.max(-1.1, Math.min(1.1, state.rx + state.vx));
    };
    canvas._tsbClick = (normEvent) => {
      if (typeof onClick === 'function') onClick(normEvent);
    };
    return () => dragging;
  }

  function hash3(x, y, z) {
    const n = Math.sin(x * 127.1 + y * 311.7 + z * 74.7) * 43758.5453123;
    return n - Math.floor(n);
  }
  function smoothNoise3(x, y, z) {
    const ix = Math.floor(x), iy = Math.floor(y), iz = Math.floor(z);
    const fx = x - ix, fy = y - iy, fz = z - iz;
    const ux = fx * fx * (3 - 2 * fx), uy = fy * fy * (3 - 2 * fy), uz = fz * fz * (3 - 2 * fz);
    const lerp = (a, b, t) => a + (b - a) * t;
    const n000 = hash3(ix, iy, iz), n100 = hash3(ix + 1, iy, iz);
    const n010 = hash3(ix, iy + 1, iz), n110 = hash3(ix + 1, iy + 1, iz);
    const n001 = hash3(ix, iy, iz + 1), n101 = hash3(ix + 1, iy, iz + 1);
    const n011 = hash3(ix, iy + 1, iz + 1), n111 = hash3(ix + 1, iy + 1, iz + 1);
    return lerp(
      lerp(lerp(n000, n100, ux), lerp(n010, n110, ux), uy),
      lerp(lerp(n001, n101, ux), lerp(n011, n111, ux), uy),
      uz
    );
  }
  function ridgeFBM(x, y, z) {
    let sum = 0, amp = 0.55, freq = 1.0;
    for (let i = 0; i < 4; i++) {
      const n = smoothNoise3(x * freq, y * freq, z * freq);
      const ridge = 1.0 - Math.abs(n * 2.0 - 1.0);
      sum += ridge * ridge * amp;
      freq *= 2.05; amp *= 0.48;
    }
    return sum;
  }

  /* Clean subtle fine paper/cloth micro-grain bump texture */
  function makeLinenBumpTexture() {
    const c = document.createElement('canvas');
    c.width = 256; c.height = 256;
    const g = c.getContext('2d');
    g.fillStyle = '#808080';
    g.fillRect(0, 0, 256, 256);
    for (let y = 0; y < 256; y += 2) {
      for (let x = 0; x < 256; x += 2) {
        const v = 122 + ((x + y) % 4 === 0 ? 10 : 0) + Math.floor(Math.random() * 10);
        g.fillStyle = `rgb(${v},${v},${v})`;
        g.fillRect(x, y, 2, 2);
      }
    }
    const tex = new THREE.CanvasTexture(c);
    tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
    tex.repeat.set(3, 4);
    return tex;
  }
  /* ==================== 1. HERO: ORGANIC INK CONTOUR TOPOGRAPHY (NOT SCI-FI CHROME!) ==================== */
  function createHeroScene(canvas, stageEl, getTheme) {
    if (typeof THREE === 'undefined' || !canvas) return { syncTheme() {} };

    const scene = new THREE.Scene();
    const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);

    const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true, preserveDrawingBuffer: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));

    const uniforms = {
      uTime: { value: 0 },
      uRes: { value: new THREE.Vector2(1, 1) },
      uMouse: { value: new THREE.Vector2(0.5, 0.5) },
      uPulse: { value: 0 },
      uBg: { value: new THREE.Color(0x141312) },
      uInk: { value: new THREE.Color(0xd99b58) },
      uAccent: { value: new THREE.Color(0xe05336) }
    };

    function resize() {
      const w = stageEl.clientWidth || window.innerWidth;
      const h = stageEl.clientHeight || window.innerHeight;
      renderer.setSize(w, h, false);
      uniforms.uRes.value.set(w, h);
    }
    resize();
    window.addEventListener('resize', resize);

    // Organic drifting topographic ink contours (like architectural relief map drawn on cotton paper / warm charcoal)
    const frag = `
      precision highp float;
      uniform float uTime;
      uniform vec2 uRes;
      uniform vec2 uMouse;
      uniform float uPulse;
      uniform vec3 uBg;
      uniform vec3 uInk;
      uniform vec3 uAccent;

      float hash(vec2 p) {
        return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453);
      }
      float noise(vec2 p) {
        vec2 i = floor(p); vec2 f = fract(p);
        vec2 u = f * f * (3.0 - 2.0 * f);
        return mix(
          mix(hash(i), hash(i + vec2(1.0, 0.0)), u.x),
          mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), u.x),
          u.y
        );
      }
      float fbm(vec2 p) {
        float v = 0.0; float a = 0.52;
        mat2 rot = mat2(0.8, 0.6, -0.6, 0.8);
        for (int i = 0; i < 5; i++) {
          v += a * noise(p);
          p = rot * p * 2.02 + vec2(1.3, -0.7);
          a *= 0.5;
        }
        return v;
      }

      void main() {
        vec2 uv = gl_FragCoord.xy / uRes;
        vec2 p = (gl_FragCoord.xy - 0.5 * uRes) / min(uRes.x, uRes.y);
        vec2 m = (uMouse - 0.5) * vec2(uRes.x / min(uRes.x, uRes.y), uRes.y / min(uRes.x, uRes.y));

        float t = uTime * 0.075;
        // Domain-warped organic ink elevation
        vec2 q = vec2(fbm(p * 1.4 + vec2(t, -t * 0.6)), fbm(p * 1.4 + vec2(-t * 0.5, t * 0.8) + 4.2));
        float distM = length(p - m);
        float mouseWarp = exp(-distM * distM * 2.8) * 0.34;
        float ripple = sin(distM * 18.0 - (1.0 - uPulse) * 16.0) * exp(-distM * 2.5) * uPulse * 0.14;

        float h = fbm(p * 1.65 + q * 1.35 + vec2(t * 0.4)) + mouseWarp + ripple;

        // Crisp organic contour lines (topographic ink lines)
        float lines = abs(fract(h * 14.0 - 0.5) - 0.5) / fwidth(h * 14.0);
        float contour = 1.0 - smoothstep(0.0, 1.35, lines);

        // Soft warm atmospheric wash near the right side
        float wash = smoothstep(0.25, 0.95, h) * 0.14;
        float accentBand = smoothstep(0.76, 0.96, h) * contour;

        vec3 col = uBg;
        col = mix(col, uInk, wash);
        col = mix(col, uInk, contour * 0.24);
        col = mix(col, uAccent, accentBand * 0.72);

        gl_FragColor = vec4(col, 1.0);
      }
    `;

    const quad = new THREE.Mesh(
      new THREE.PlaneGeometry(2, 2),
      new THREE.ShaderMaterial({
        vertexShader: `void main() { gl_Position = vec4(position.xy, 0.0, 1.0); }`,
        fragmentShader: frag,
        uniforms
      })
    );
    scene.add(quad);

    const targetM = { x: 0.62, y: 0.52 };
    window.addEventListener('pointermove', (e) => {
      targetM.x = e.clientX / window.innerWidth;
      targetM.y = 1.0 - e.clientY / window.innerHeight;
    }, { passive: true });
    stageEl.addEventListener('pointerdown', (e) => {
      if (!e.target.closest('a,button')) uniforms.uPulse.value = 1.0;
    });

    function syncTheme() {
      const light = getTheme() === 'light';
      uniforms.uBg.value.set(light ? 0xf3efe6 : 0x141312);
      uniforms.uInk.value.set(light ? 0x8a7052 : 0xd99b58);
      uniforms.uAccent.value.set(light ? 0xc93f24 : 0xe05336);
    }
    syncTheme();

    let visible = true;
    new IntersectionObserver((e) => { visible = e[0].isIntersecting; }, { threshold: 0.01 }).observe(stageEl);

    const clock = new THREE.Clock();
    function animate() {
      requestAnimationFrame(animate);
      if (!visible) return;
      uniforms.uTime.value = clock.getElapsedTime();
      uniforms.uPulse.value *= 0.95;
      uniforms.uMouse.value.x += (targetM.x - uniforms.uMouse.value.x) * 0.05;
      uniforms.uMouse.value.y += (targetM.y - uniforms.uMouse.value.y) * 0.05;
      renderer.render(scene, camera);
    }
    animate();

    return { syncTheme };
  }

  /* ==================== 2. PHOTOREALISTIC 3D DESK: CLEAN HARDCOVER BOOKS + MACBOOK PRO M3 WITH NATIVE IN-MESH SCREEN OS ==================== */
  /* MacBook Pro M3 16-inch 2024 3D model by jackbaeten (CC-BY 4.0), rigged via rigged-macbook-3d (MIT). */
  function createBookshelf3D(canvas, booksData, onSelect, onHoverChange, getTheme, osCfg) {
    if (typeof THREE === 'undefined' || !canvas) {
      return { syncTheme() {}, highlightBook() {}, openProjectOnLaptop() {}, returnToDesk() {}, stepProject() {}, refreshScreen() {} };
    }

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(32, 1, 0.08, 50);
    const HOME_POS = new THREE.Vector3(-0.06, 2.55, 8.15);
    const HOME_LOOK = new THREE.Vector3(-0.02, -0.06, 0.0);
    camera.position.copy(HOME_POS);
    camera.lookAt(HOME_LOOK);

    const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.08;
    if ('outputColorSpace' in renderer && THREE.SRGBColorSpace) {
      renderer.outputColorSpace = THREE.SRGBColorSpace;
    }

    let vpW = 960, vpH = 560;
    function resize() {
      vpW = canvas.clientWidth || 960;
      vpH = canvas.clientHeight || 560;
      camera.aspect = vpW / vpH;
      camera.updateProjectionMatrix();
      renderer.setSize(vpW, vpH, false);
    }
    resize();
    window.addEventListener('resize', resize);

    /* ---------- APPLE STUDIO IBL ENVIRONMENT (PMREM Softboxes) ---------- */
    const pmrem = new THREE.PMREMGenerator(renderer);
    pmrem.compileEquirectangularShader();

    function buildStudioEnv(isLight) {
      const envScene = new THREE.Scene();
      envScene.background = new THREE.Color(isLight ? 0x262422 : 0x060608);
      const addSoftbox = (colorHex, intensity, pos, rot, scale) => {
        const c = new THREE.Color(colorHex).multiplyScalar(intensity);
        const m = new THREE.Mesh(
          new THREE.PlaneGeometry(scale[0], scale[1]),
          new THREE.MeshBasicMaterial({ color: c, side: THREE.DoubleSide })
        );
        m.position.set(pos[0], pos[1], pos[2]);
        if (rot) m.rotation.set(rot[0], rot[1], rot[2]);
        envScene.add(m);
      };
      const k = isLight ? 1.25 : 1.0;
      addSoftbox(0xffe7d2, 1.8 * k, [1, 3, 6], [-0.3, 0, 0], [8, 5]);
      addSoftbox(0xdde7ff, 2.8 * k, [0, 6, -3], [Math.PI / 2.2, 0, 0], [14, 1.8]);
      addSoftbox(0xffffff, 2.4 * k, [-3.4, 1, 6.5], [0, 0, 0], [1.4, 9]);
      addSoftbox(0xe6edff, 1.8 * k, [3.6, 0, 6.5], [0, 0, 0], [1.1, 9]);
      addSoftbox(0x9fb0e0, 0.25 * k, [0, -1, 8], [0, 0, 0], [18, 12]);
      addSoftbox(0xffffff, 1.1 * k, [8, 1, 2], [0, -Math.PI / 2, 0], [5, 7]);
      addSoftbox(0xc4d2ff, 0.75 * k, [-8, 1, 2], [0, Math.PI / 2, 0], [5, 7]);
      const tex = pmrem.fromScene(envScene, 0.035).texture;
      envScene.traverse((o) => { if (o.geometry) o.geometry.dispose(); if (o.material) o.material.dispose(); });
      return tex;
    }

    const envDark = buildStudioEnv(false);
    const envLight = buildStudioEnv(true);
    scene.environment = envDark;

    const ambLight = new THREE.AmbientLight(0xfff5e8, 0.30);
    scene.add(ambLight);

    const lampSpot = new THREE.SpotLight(0xffdfb8, 2.8, 24, Math.PI * 0.44, 0.82, 0);
    lampSpot.position.set(-1.3, 5.6, 3.6);
    lampSpot.castShadow = true;
    lampSpot.shadow.mapSize.set(2048, 2048);
    lampSpot.shadow.bias = -0.00035;
    scene.add(lampSpot);

    const keyDir = new THREE.DirectionalLight(0xffeeda, 1.25);
    keyDir.position.set(5, 8, 6);
    scene.add(keyDir);

    const rimDir = new THREE.DirectionalLight(0xe6eeff, 1.1);
    rimDir.position.set(-2, 6, -7);
    scene.add(rimDir);

    const fillDir = new THREE.DirectionalLight(0xc4d2ff, 0.35);
    fillDir.position.set(-7, 3, 4);
    scene.add(fillDir);

    const deskGroup = new THREE.Group();
    scene.add(deskGroup);

    const linenBump = makeLinenBumpTexture();

    // Rich walnut architect's desk tabletop
    function makeDeskTexture(isLight) {
      const c = document.createElement('canvas'); c.width = 1024; c.height = 512;
      const g = c.getContext('2d');
      g.fillStyle = isLight ? '#cbb89c' : '#261d16';
      g.fillRect(0, 0, 1024, 512);
      for (let i = 0; i < 240; i++) {
        g.fillStyle = isLight ? 'rgba(84,56,32,0.065)' : 'rgba(255,214,172,0.038)';
        g.fillRect(0, Math.random() * 512, 1024, 1 + Math.random() * 2.4);
      }
      const vg = g.createRadialGradient(512, 256, 200, 512, 256, 565);
      vg.addColorStop(0, 'rgba(0,0,0,0)');
      vg.addColorStop(1, isLight ? 'rgba(243,239,230,0.55)' : 'rgba(20,19,18,0.68)');
      g.fillStyle = vg; g.fillRect(0, 0, 1024, 512);
      const tex = new THREE.CanvasTexture(c);
      tex.anisotropy = 4;
      if (THREE.SRGBColorSpace) tex.colorSpace = THREE.SRGBColorSpace;
      return tex;
    }

    const deskMat = new THREE.MeshStandardMaterial({
      map: makeDeskTexture(false),
      bumpMap: linenBump,
      bumpScale: 0.008,
      roughness: 0.58,
      metalness: 0.08,
      envMapIntensity: 0.55
    });
    const deskTop = new THREE.Mesh(new THREE.BoxGeometry(13.2, 0.24, 5.4), deskMat);
    deskTop.position.set(0, -1.04, 0.05);
    deskTop.receiveShadow = true; deskTop.castShadow = true;
    deskGroup.add(deskTop);

    const matMesh = new THREE.Mesh(
      new THREE.BoxGeometry(3.85, 0.018, 2.60),
      new THREE.MeshStandardMaterial({ color: 0x151414, bumpMap: linenBump, bumpScale: 0.006, roughness: 0.86, metalness: 0.05, envMapIntensity: 0.35 })
    );
    matMesh.position.set(1.48, -0.91, -0.02);
    matMesh.rotation.y = -0.24;
    matMesh.receiveShadow = true;
    deskGroup.add(matMesh);

    const wallMat = new THREE.ShadowMaterial({ opacity: 0.30 });
    const backWall = new THREE.Mesh(new THREE.PlaneGeometry(26, 15), wallMat);
    backWall.position.set(0, 1.2, -2.8);
    backWall.receiveShadow = true;
    deskGroup.add(backWall);

    /* ---------- 5 CLEAN, SCULPTED HARDCOVER BOOKS LYING ON THE LEFT OF THE DESK ---------- */
    const pagesC = document.createElement('canvas'); pagesC.width = 128; pagesC.height = 512;
    const pg = pagesC.getContext('2d');
    pg.fillStyle = '#eae2d2'; pg.fillRect(0, 0, 128, 512);
    for (let x = 2; x < 128; x += 3) {
      pg.fillStyle = x % 6 === 0 ? 'rgba(65,48,30,0.18)' : 'rgba(255,255,255,0.22)';
      pg.fillRect(x, 0, 1, 512);
    }
    const pagesTex = new THREE.CanvasTexture(pagesC);
    if (THREE.SRGBColorSpace) pagesTex.colorSpace = THREE.SRGBColorSpace;

    function makeSpineCanvas(b) {
      const c = document.createElement('canvas'); c.width = 320; c.height = 1024;
      const ctx = c.getContext('2d');
      ctx.fillStyle = b.coverColor; ctx.fillRect(0, 0, 320, 1024);
      ctx.fillStyle = b.accent;
      ctx.fillRect(22, 118, 276, 8);
      ctx.fillRect(22, 896, 276, 8);
      ctx.save(); ctx.translate(160, 185); ctx.rotate(Math.PI / 2);
      ctx.fillStyle = b.textColor; ctx.font = '600 44px "JetBrains Mono", monospace';
      ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(b.num, 0, 0); ctx.restore();
      ctx.save(); ctx.translate(160, 520); ctx.rotate(Math.PI / 2);
      ctx.font = '600 48px "Space Grotesk", sans-serif'; ctx.fillStyle = b.textColor;
      ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(b.spineTitle, 0, 0); ctx.restore();
      ctx.save(); ctx.translate(160, 840); ctx.rotate(Math.PI / 2);
      ctx.fillStyle = b.subColor; ctx.font = '500 28px "JetBrains Mono", monospace';
      ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(b.yearShort, 0, 0); ctx.restore();
      const tex = new THREE.CanvasTexture(c); tex.anisotropy = 4;
      if (THREE.SRGBColorSpace) tex.colorSpace = THREE.SRGBColorSpace;
      return tex;
    }

    function makeCoverCanvas(b) {
      const c = document.createElement('canvas'); c.width = 512; c.height = 768;
      const ctx = c.getContext('2d');
      ctx.fillStyle = b.coverColor; ctx.fillRect(0, 0, 512, 768);
      ctx.strokeStyle = 'rgba(255,255,255,0.16)'; ctx.lineWidth = 2; ctx.strokeRect(32, 32, 448, 704);
      ctx.fillStyle = b.accent; ctx.fillRect(54, 62, 76, 8);
      ctx.font = '600 26px "JetBrains Mono", monospace'; ctx.fillText(b.num, 54, 118);
      ctx.fillStyle = b.textColor; ctx.font = '600 50px "Space Grotesk", sans-serif';
      b.coverLines.forEach((line, i) => ctx.fillText(line, 54, 248 + i * 64));
      ctx.fillStyle = b.subColor; ctx.font = '500 21px "JetBrains Mono", monospace';
      ctx.fillText(b.metricTag, 54, 672);
      const tex = new THREE.CanvasTexture(c); tex.anisotropy = 4;
      if (THREE.SRGBColorSpace) tex.colorSpace = THREE.SRGBColorSpace;
      return tex;
    }

    function buildLyingBook(b, idx) {
      const wrapper = new THREE.Group();
      const g = new THREE.Group();
      g.rotation.z = Math.PI / 2;
      wrapper.add(g);

      const W = (b.thickness || 0.36) * 0.86;
      const H = (b.height || 2.16) * 0.96;
      const D = 1.44;
      const boardT = 0.04;
      const overhang = 0.05;

      // Clean smooth matte-satin hardcover binding (no noisy Voronoi blotches!)
      const clothMat = new THREE.MeshStandardMaterial({ color: b.coverColor, bumpMap: linenBump, bumpScale: 0.012, roughness: 0.72, metalness: 0.06, envMapIntensity: 0.42 });
      const coverFrontMat = new THREE.MeshStandardMaterial({ map: makeCoverCanvas(b), bumpMap: linenBump, bumpScale: 0.010, roughness: 0.66, metalness: 0.07, envMapIntensity: 0.42 });
      const spineMat = new THREE.MeshStandardMaterial({ map: makeSpineCanvas(b), bumpMap: linenBump, bumpScale: 0.012, roughness: 0.64, metalness: 0.07, envMapIntensity: 0.42 });
      const pagesMat = new THREE.MeshStandardMaterial({ map: pagesTex, bumpMap: pagesTex, bumpScale: 0.012, roughness: 0.88, metalness: 0.0, envMapIntensity: 0.25 });

      const boardShape = new THREE.Shape();
      boardShape.moveTo(-D / 2, -H / 2); boardShape.lineTo(D / 2 - 0.02, -H / 2);
      boardShape.lineTo(D / 2 - 0.02, H / 2); boardShape.lineTo(-D / 2, H / 2); boardShape.closePath();

      const boardGeo = new THREE.ExtrudeGeometry(boardShape, { depth: boardT, bevelEnabled: true, bevelThickness: 0.008, bevelSize: 0.008, bevelSegments: 2 });
      boardGeo.rotateY(Math.PI / 2);

      const rightBoard = new THREE.Mesh(boardGeo, clothMat);
      rightBoard.position.set(W / 2 - boardT, 0, 0);
      rightBoard.castShadow = true; rightBoard.receiveShadow = true;
      g.add(rightBoard);

      const coverFace = new THREE.Mesh(new THREE.PlaneGeometry(D - 0.06, H - 0.04), coverFrontMat);
      coverFace.rotation.y = Math.PI / 2;
      coverFace.position.set(W / 2 + 0.011, 0, -0.01);
      coverFace.receiveShadow = true;
      g.add(coverFace);

      const leftBoard = new THREE.Mesh(boardGeo, clothMat);
      leftBoard.position.set(-W / 2, 0, 0);
      leftBoard.castShadow = true; leftBoard.receiveShadow = true;
      g.add(leftBoard);

      const spineRadius = W / 2;
      const spineCyl = new THREE.CylinderGeometry(spineRadius, spineRadius, H + 0.014, 24, 1, true, -Math.PI / 2, Math.PI);
      spineCyl.scale(1.0, 1.0, 0.48);
      const spineMesh = new THREE.Mesh(spineCyl, spineMat);
      spineMesh.position.set(0, 0, D / 2 - 0.018);
      spineMesh.castShadow = true; spineMesh.receiveShadow = true;
      g.add(spineMesh);

      const grooveMat = new THREE.MeshStandardMaterial({ color: 0x0c0b0a, roughness: 0.9 });
      [-W / 2 + 0.01, W / 2 - 0.01].forEach((gx) => {
        const gr = new THREE.Mesh(new THREE.CylinderGeometry(0.009, 0.009, H, 8), grooveMat);
        gr.position.set(gx, 0, D / 2 - 0.02); g.add(gr);
      });

      const bandYs = [-H * 0.38, -H * 0.24, H * 0.24, H * 0.38];
      const bandMat = new THREE.MeshStandardMaterial({ color: b.coverColor, bumpMap: linenBump, bumpScale: 0.01, roughness: 0.56, metalness: 0.14 });
      bandYs.forEach((by, bi) => {
        const rib = new THREE.Mesh(
          new THREE.TorusGeometry(spineRadius * 0.99, 0.013, 10, 20, Math.PI),
          bi === 0 || bi === 3 ? new THREE.MeshStandardMaterial({ color: b.accent, roughness: 0.42, metalness: 0.35 }) : bandMat
        );
        rib.rotation.x = Math.PI / 2; rib.scale.set(1.0, 0.52, 1.0);
        rib.position.set(0, by, D / 2 - 0.014); rib.castShadow = true; g.add(rib);
      });

      const pageW = W - boardT * 2 - 0.01, pageH = H - overhang * 2, pageD = D - overhang;
      const pagesBlock = new THREE.Mesh(new THREE.BoxGeometry(pageW, pageH, pageD), pagesMat);
      pagesBlock.position.set(0, 0, -overhang * 0.35);
      pagesBlock.castShadow = true; pagesBlock.receiveShadow = true; g.add(pagesBlock);

      const hbMat = new THREE.MeshStandardMaterial({ color: b.accent, roughness: 0.7 });
      [pageH / 2 - 0.01, -pageH / 2 + 0.01].forEach((hy) => {
        const hb = new THREE.Mesh(new THREE.CylinderGeometry(pageW * 0.48, pageW * 0.48, 0.024, 16, 1, false, -Math.PI / 2, Math.PI), hbMat);
        hb.scale.set(1, 1, 0.45); hb.position.set(0, hy, D / 2 - 0.05); g.add(hb);
      });

      const ribCurve = new THREE.CatmullRomCurve3([
        new THREE.Vector3(0, pageH / 2 - 0.06, 0.2),
        new THREE.Vector3(0.02, H / 2 + 0.12, 0.32),
        new THREE.Vector3(-0.04, H / 2 + 0.24, 0.46)
      ]);
      g.add(new THREE.Mesh(new THREE.TubeGeometry(ribCurve, 14, 0.013, 6, false), new THREE.MeshStandardMaterial({ color: b.accent, roughness: 0.55 })));

      const hitbox = new THREE.Mesh(new THREE.BoxGeometry(H + 0.12, W + 0.06, D + 0.22), new THREE.MeshBasicMaterial({ visible: false }));
      hitbox.userData.bookIndex = idx;
      wrapper.add(hitbox);

      return { group: wrapper, hitbox, thickness: W };
    }

    const bookGroups = [], hitMeshes = [];
    const builtBooks = booksData.map((b, idx) => buildLyingBook(b, idx));
    const stackOrder = [4, 3, 2, 1, 0];
    const yawOffsets = [0.06, -0.05, 0.04, -0.07, 0.03];
    const xOffsets = [0.04, -0.06, 0.05, -0.03, 0.02];
    const zOffsets = [-0.04, 0.05, -0.02, 0.06, 0.02];

    let curStackY = -0.92;
    stackOrder.forEach((idx, rank) => {
      const built = builtBooks[idx];
      const baseY = curStackY + built.thickness / 2;
      curStackY += built.thickness + 0.012;
      const baseX = -2.08 + xOffsets[rank];
      const baseZ = 0.28 + zOffsets[rank];
      const baseRotY = yawOffsets[rank];

      built.group.position.set(baseX, baseY, baseZ);
      built.group.rotation.y = baseRotY;
      deskGroup.add(built.group);
      hitMeshes.push(built.hitbox);

      bookGroups[idx] = {
        group: built.group, rank, baseX, baseY, baseZ, baseRotY,
        curX: baseX, curY: baseY, curZ: baseZ, curRotX: 0, curRotY: baseRotY
      };
    });

    /* ---------- NATIVE IN-MESH MACBOOK PRO SCREEN OS (1600x1000 RENDERED DIRECTLY ONTO 3D SCREEN MESH!) ---------- */
    const SCR_W = 1600, SCR_H = 1000;
    const screenCanvas = document.createElement('canvas');
    screenCanvas.width = SCR_W; screenCanvas.height = SCR_H;
    const sCtx = screenCanvas.getContext('2d');

    // Offscreen composition buffer so the vintage B&W CRT TV filter & clip-path operate cleanly
    const uiCanvas = document.createElement('canvas');
    uiCanvas.width = SCR_W; uiCanvas.height = SCR_H;
    const uCtx = uiCanvas.getContext('2d');

    const screenTex = new THREE.CanvasTexture(screenCanvas);
    if (THREE.SRGBColorSpace) screenTex.colorSpace = THREE.SRGBColorSpace;
    screenTex.minFilter = THREE.LinearFilter;
    screenTex.magFilter = THREE.LinearFilter;
    screenTex.generateMipmaps = false;
    screenTex.anisotropy = Math.min(16, renderer.capabilities.getMaxAnisotropy());

    // Live offscreen demo canvas (980x740) rendered into the left stage of the 3D MacBook screen!
    const STAGE_RECT = { x: 24, y: 88, w: 980, h: 796 };
    let demoCanvas = null;
    let demoCtrl = null;
    let activeKey = null;
    let hoveredBtnId = null;
    let uiButtons = [];
    let demoHudLeft = '', demoHudRight = '';
    let brainSliceVal = 132, brainAuto = true;
    let srganScale = 4, srganSplit = 0.58;
    let bobDebiased = true;
    let churnView = 'cluster';

    function wrapLines(ctx, text, maxW) {
      const words = String(text || '').split(/\s+/);
      const out = [];
      let cur = '';
      words.forEach((w) => {
        const test = cur ? `${cur} ${w}` : w;
        if (ctx.measureText(test).width > maxW && cur) { out.push(cur); cur = w; }
        else cur = test;
      });
      if (cur) out.push(cur);
      return out;
    }

    function disposeDemo() {
      if (demoCtrl?.dispose) demoCtrl.dispose();
      demoCtrl = null;
      demoCanvas = null;
    }

    function mountProjectInScreen(key) {
      disposeDemo();
      activeKey = key;
      const lang = osCfg?.getLang ? osCfg.getLang() : 'fr';

      demoCanvas = document.createElement('canvas');
      demoCanvas.width = STAGE_RECT.w;
      demoCanvas.height = STAGE_RECT.h;

      if (key === 'anki') {
        demoHudLeft = '01 / 05 · ANKICARDSGENERATOR';
        demoHudRight = lang === 'fr' ? 'Cliquer / glisser' : 'Click / drag';
        demoCtrl = createAnki3D(demoCanvas, () => (osCfg?.getLang ? osCfg.getLang() : 'fr'), (idx, tag) => {
          demoHudLeft = `${idx} · ${tag}`;
        });
      } else if (key === 'alzheimer') {
        brainSliceVal = 132; brainAuto = true;
        demoHudLeft = 'OASIS-1 · 3D CORTEX';
        demoHudRight = 'SLICE 132';
        demoCtrl = createBrain3D(demoCanvas, (s, attn) => {
          brainSliceVal = s;
          demoHudRight = `SLICE ${s} · MIL ${(attn * 100).toFixed(1)}%`;
        });
      } else if (key === 'srgan') {
        srganScale = 4; srganSplit = 0.58;
        demoHudLeft = 'WASSERSTEIN SRGAN';
        demoHudRight = 'LR ×1  |  HR ×4';
        demoCtrl = createSrganLab(demoCanvas);
      } else if (key === 'bobslay') {
        bobDebiased = true;
        demoHudLeft = 'OFF × ON × UPDRS';
        demoHudRight = 'DEBIASED';
        demoCtrl = createBobslay3D(demoCanvas);
      } else if (key === 'churn') {
        churnView = 'cluster';
        demoHudLeft = lang === 'fr' ? 'KUBERNETES · CLIQUER AU CENTRE POUR XGBOOST' : 'KUBERNETES · CLICK CENTER FOR XGBOOST';
        demoHudRight = 'ROC AUC 0.865 · RAPPEL 78%';
        demoCtrl = createChurn3D(
          demoCanvas,
          (m) => {
            churnView = m;
            const l = osCfg?.getLang ? osCfg.getLang() : 'fr';
            demoHudLeft = m === 'algo'
              ? (l === 'fr' ? 'XGBOOST · ARBRE DE DÉCISION & RELIEF DE CHURN' : 'XGBOOST · DECISION TREE & CHURN LANDSCAPE')
              : (l === 'fr' ? 'KUBERNETES · CLIQUER AU CENTRE POUR XGBOOST' : 'KUBERNETES · CLICK CENTER FOR XGBOOST');
          },
          (ruleStr) => { if (churnView === 'algo') demoHudLeft = ruleStr; }
        );
      }
    }

    function paintScreenOS(crtV) {
      // Sleeping pure obsidian glass
      if (crtV <= 0.002 || !activeKey || !osCfg?.projects?.[activeKey]) {
        sCtx.fillStyle = '#050608';
        sCtx.fillRect(0, 0, SCR_W, SCR_H);
        screenTex.needsUpdate = true;
        return;
      }

      const d = osCfg.projects[activeKey];
      const lang = osCfg.getLang ? osCfg.getLang() : 'fr';
      const isLight = getTheme() === 'light';

      const BG = isLight ? '#f3efe6' : '#141312';
      const BG2 = isLight ? '#eae4d8' : '#1c1a18';
      const INK = isLight ? '#1b1917' : '#efeae0';
      const INK2 = isLight ? '#5d574e' : '#a39c90';
      const INK3 = isLight ? '#8c8478' : '#6c665d';
      const LINE = isLight ? 'rgba(27,25,23,0.14)' : 'rgba(239,234,224,0.14)';
      const ACC = isLight ? '#c93f24' : '#e05336';
      const ACC_INK = isLight ? '#f8f5ee' : '#141312';

      // 1. Paint full crisp OS layout into uiCanvas
      uCtx.fillStyle = BG;
      uCtx.fillRect(0, 0, SCR_W, SCR_H);

      // Left stage background
      uCtx.fillStyle = BG2;
      uCtx.fillRect(0, 74, 1028, 836);

      // Structural hairlines
      uCtx.strokeStyle = LINE; uCtx.lineWidth = 1.5;
      uCtx.beginPath();
      uCtx.moveTo(0, 74); uCtx.lineTo(SCR_W, 74);
      uCtx.moveTo(1028, 74); uCtx.lineTo(1028, SCR_H);
      uCtx.moveTo(0, 910); uCtx.lineTo(1028, 910);
      uCtx.stroke();

      uiButtons = [];
      function drawBtn(id, x, y, w, h, label, accent, active, action) {
        const isHov = hoveredBtnId === id;
        uiButtons.push({ id, x, y, w, h, action });
        uCtx.fillStyle = (accent && (isHov || active)) || active ? ACC : (isHov ? (isLight ? 'rgba(27,25,23,0.08)' : 'rgba(239,234,224,0.09)') : 'transparent');
        uCtx.strokeStyle = accent || active ? ACC : (isHov ? INK : LINE);
        uCtx.lineWidth = 1.6;
        uCtx.beginPath(); uCtx.roundRect(x, y, w, h, 5);
        uCtx.fill(); uCtx.stroke();
        uCtx.fillStyle = (accent && (isHov || active)) || active ? ACC_INK : (accent ? ACC : (isHov ? INK : INK2));
        uCtx.font = '600 17px "JetBrains Mono", monospace';
        uCtx.textAlign = 'center'; uCtx.textBaseline = 'middle';
        uCtx.fillText(label, x + w / 2, y + h / 2 + 1);
        uCtx.textAlign = 'left'; uCtx.textBaseline = 'alphabetic';
      }

      // Top OS bar
      uCtx.fillStyle = ACC;
      uCtx.beginPath(); uCtx.arc(36, 37, 6, 0, Math.PI * 2); uCtx.fill();
      uCtx.font = '600 18px "JetBrains Mono", monospace';
      uCtx.fillStyle = INK2; uCtx.fillText('TIMOTHEE.OS  /', 54, 43);
      uCtx.fillStyle = ACC; uCtx.fillText(d.num, 224, 43);
      uCtx.fillStyle = INK2; uCtx.fillText(`—  ${d.cat[lang].toUpperCase()}`, 264, 43);

      drawBtn('prev', 1304, 17, 50, 40, '←', false, false, () => stepProject(-1));
      drawBtn('next', 1364, 17, 50, 40, '→', false, false, () => stepProject(1));
      drawBtn('close', 1426, 17, 146, 40, lang === 'fr' ? '← BUREAU' : '← DESK', true, false, () => returnToDesk());

      // Composite LIVE 3D project canvas directly onto the MacBook screen!
      if (demoCanvas) {
        uCtx.drawImage(demoCanvas, STAGE_RECT.x, STAGE_RECT.y, STAGE_RECT.w, STAGE_RECT.h);
      }

      // Stage HUD chips
      function drawChip(x, y, txt, alignRight) {
        uCtx.font = '500 15px "JetBrains Mono", monospace';
        const tw = uCtx.measureText(txt).width + 26;
        const rx = alignRight ? x - tw : x;
        uCtx.fillStyle = isLight ? 'rgba(243,239,230,0.86)' : 'rgba(20,19,18,0.82)';
        uCtx.strokeStyle = LINE; uCtx.lineWidth = 1.2;
        uCtx.beginPath(); uCtx.roundRect(rx, y, tw, 34, 5); uCtx.fill(); uCtx.stroke();
        uCtx.fillStyle = INK; uCtx.fillText(txt, rx + 13, y + 22);
      }
      if (demoHudLeft) drawChip(24, 96, demoHudLeft, false);
      if (demoHudRight) drawChip(1004, 96, demoHudRight, true);

      // Left Bottom Controls Bar (y = 910..1000)
      if (activeKey === 'anki') {
        drawBtn('ankiFlip', 26, 933, 250, 44, lang === 'fr' ? 'RETOURNER LA CARTE' : 'FLIP CARD', true, false, () => demoCtrl?.flipCard());
        drawBtn('ankiNext', 290, 933, 224, 44, lang === 'fr' ? 'CARTE SUIVANTE →' : 'NEXT CARD →', false, false, () => demoCtrl?.nextCard());
        uCtx.fillStyle = INK3; uCtx.font = '500 16px "JetBrains Mono", monospace';
        uCtx.textAlign = 'right'; uCtx.fillText('FIELDNOTE · STUDIO UI', 1002, 961); uCtx.textAlign = 'left';
      } else if (activeKey === 'alzheimer') {
        uCtx.fillStyle = INK2; uCtx.font = '500 16px "JetBrains Mono", monospace';
        uCtx.fillText(`SLICE  ${brainSliceVal}`, 28, 961);
        const sx = 160, sw = 340, sy = 954;
        uiButtons.push({ id: 'brainBar', x: sx, y: 932, w: sw, h: 46, isSlider: true, action: (px) => {
          brainAuto = false;
          const s = 100 + Math.round(Math.max(0, Math.min(1, (px - sx) / sw)) * 60);
          brainSliceVal = s; demoCtrl?.setSlice(s);
        }});
        uCtx.fillStyle = LINE; uCtx.fillRect(sx, sy - 3, sw, 6);
        const frac = (brainSliceVal - 100) / 60;
        uCtx.fillStyle = ACC; uCtx.fillRect(sx, sy - 3, sw * frac, 6);
        uCtx.beginPath(); uCtx.arc(sx + sw * frac, sy, 9, 0, Math.PI * 2); uCtx.fill();
        drawBtn('brainAuto', 836, 933, 166, 44, 'AUTO SCAN', true, brainAuto, () => { brainAuto = true; demoCtrl?.setAuto(true); });
      } else if (activeKey === 'srgan') {
        [1, 2, 4].forEach((sc, i) => {
          drawBtn(`sr${sc}`, 26 + i * 74, 933, 62, 44, `×${sc}`, true, srganScale === sc, () => { srganScale = sc; demoCtrl?.setScale(sc); demoHudRight = `LR ×1  |  HR ×${sc}`; });
        });
        uCtx.fillStyle = INK2; uCtx.font = '500 16px "JetBrains Mono", monospace';
        uCtx.fillText('LR | HR', 606, 961);
        const sx = 696, sw = 304, sy = 954;
        uiButtons.push({ id: 'srBar', x: sx, y: 932, w: sw, h: 46, isSlider: true, action: (px) => {
          srganSplit = Math.max(0.06, Math.min(0.94, (px - sx) / sw));
          demoCtrl?.setSplit(srganSplit);
        }});
        uCtx.fillStyle = LINE; uCtx.fillRect(sx, sy - 3, sw, 6);
        uCtx.fillStyle = ACC; uCtx.fillRect(sx, sy - 3, sw * srganSplit, 6);
        uCtx.beginPath(); uCtx.arc(sx + sw * srganSplit, sy, 9, 0, Math.PI * 2); uCtx.fill();
      } else if (activeKey === 'bobslay') {
        drawBtn('bobRaw', 26, 933, 128, 44, lang === 'fr' ? 'BRUT' : 'RAW', true, !bobDebiased, () => { bobDebiased = false; demoCtrl?.setMode(false); demoHudRight = 'RAW'; });
        drawBtn('bobFix', 166, 933, 152, 44, lang === 'fr' ? 'CORRIGÉ' : 'DEBIASED', true, bobDebiased, () => { bobDebiased = true; demoCtrl?.setMode(true); demoHudRight = 'DEBIASED'; });
        uCtx.fillStyle = INK3; uCtx.font = '500 16px "JetBrains Mono", monospace';
        uCtx.textAlign = 'right'; uCtx.fillText('44 590 VISITS · GROUPKFOLD', 1002, 961); uCtx.textAlign = 'left';
      } else if (activeKey === 'churn') {
        const lbl = churnView === 'algo'
          ? (lang === 'fr' ? '← RETOUR CLUSTER K8S' : '← BACK TO K8S CLUSTER')
          : (lang === 'fr' ? 'VOIR L’ALGO XGBOOST ▸' : 'INSPECT XGBOOST ▸');
        drawBtn('churnToggle', 26, 933, 294, 44, lbl, true, false, () => demoCtrl?.toggleView());
        uCtx.fillStyle = INK3; uCtx.font = '500 15px "JetBrains Mono", monospace';
        uCtx.textAlign = 'right'; uCtx.fillText('GRADIO MCP · FASTAPI · GITLAB CI', 1002, 961); uCtx.textAlign = 'left';
      }

      // Right Info Column (x = 1028..1600)
      const rx = 1068, rw = 496;
      uCtx.fillStyle = INK3; uCtx.font = '500 18px "JetBrains Mono", monospace';
      uCtx.fillText(d.date[lang], rx, 132);

      uCtx.fillStyle = INK; uCtx.font = '600 44px "Space Grotesk", sans-serif';
      const titleLines = wrapLines(uCtx, d.title, rw);
      let cy = 192;
      titleLines.forEach((l) => { uCtx.fillText(l, rx, cy); cy += 52; });

      cy += 10;
      uCtx.fillStyle = INK2; uCtx.font = '400 22px "Inter", sans-serif';
      const descLines = wrapLines(uCtx, d.desc[lang], rw);
      descLines.forEach((l) => { uCtx.fillText(l, rx, cy); cy += 34; });

      // 3-column metrics strip
      cy += 22;
      const mw = rw / d.metrics.length;
      uCtx.strokeStyle = LINE; uCtx.lineWidth = 1.4;
      uCtx.strokeRect(rx, cy, rw, 108);
      d.metrics.forEach((m, i) => {
        const mx = rx + i * mw;
        if (i > 0) { uCtx.beginPath(); uCtx.moveTo(mx, cy); uCtx.lineTo(mx, cy + 108); uCtx.stroke(); }
        uCtx.fillStyle = ACC; uCtx.font = '600 28px "Space Grotesk", sans-serif';
        uCtx.fillText(m.val, mx + 16, cy + 48);
        uCtx.fillStyle = INK3; uCtx.font = '500 15px "JetBrains Mono", monospace';
        uCtx.fillText(m.lbl[lang], mx + 16, cy + 82);
      });

      // Stack chips
      cy += 138;
      let sx = rx, sy = cy;
      uCtx.font = '500 16px "JetBrains Mono", monospace';
      d.stack.forEach((st) => {
        const sw = uCtx.measureText(st).width + 24;
        if (sx + sw > rx + rw) { sx = rx; sy += 44; }
        uCtx.strokeStyle = LINE; uCtx.lineWidth = 1.2;
        uCtx.beginPath(); uCtx.roundRect(sx, sy, sw, 34, 5); uCtx.stroke();
        uCtx.fillStyle = INK2; uCtx.fillText(st, sx + 12, sy + 22);
        sx += sw + 10;
      });

      // Repo solid button at bottom of right column
      const repoHov = hoveredBtnId === 'repo';
      const repoRect = { id: 'repo', x: rx, y: 892, w: 284, h: 60, action: () => window.open(d.repo, '_blank', 'noopener,noreferrer') };
      uiButtons.push(repoRect);
      uCtx.fillStyle = repoHov ? ACC : INK;
      uCtx.beginPath(); uCtx.roundRect(repoRect.x, repoRect.y, repoRect.w, repoRect.h, 6); uCtx.fill();
      uCtx.fillStyle = repoHov ? ACC_INK : BG;
      uCtx.font = '600 18px "JetBrains Mono", monospace';
      uCtx.textAlign = 'center'; uCtx.textBaseline = 'middle';
      uCtx.fillText(`${lang === 'fr' ? 'VOIR LE DÉPÔT' : 'OPEN REPOSITORY'}  ↗`, repoRect.x + repoRect.w / 2, repoRect.y + repoRect.h / 2 + 1);
      uCtx.textAlign = 'left'; uCtx.textBaseline = 'alphabetic';

      // 2. Apply VINTAGE B&W CRT TV POWER-ON / POWER-OFF EFFECT directly into screenCanvas!
      sCtx.save();
      sCtx.fillStyle = '#050608';
      sCtx.fillRect(0, 0, SCR_W, SCR_H);

      if (crtV < 0.28) {
        // Pure white horizontal CRT line shooting out from center (or pinching down to center dot on shutoff!)
        const u = crtV / 0.28;
        const easeW = 1 - Math.pow(1 - u, 3);
        const lineW = Math.max(12, SCR_W * easeW);
        const lx = (SCR_W - lineW) * 0.5;
        sCtx.shadowColor = '#ffffff';
        sCtx.shadowBlur = 28;
        sCtx.fillStyle = `rgba(255,255,255,${Math.min(1, u * 3.2).toFixed(3)})`;
        sCtx.fillRect(lx, SCR_H * 0.5 - 3, lineW, 6);
        sCtx.shadowBlur = 0;
      } else {
        const u = Math.min(1, (crtV - 0.28) / 0.72);
        const e = 1 - Math.pow(1 - u, 2.5);
        const halfH = Math.max(3, (SCR_H * 0.5) * e);
        const gray = Math.max(0, 1 - Math.max(0, (u - 0.56) / 0.44));

        // Symmetric vertical clip opening up & down from the exact horizontal center!
        sCtx.save();
        sCtx.beginPath();
        sCtx.rect(0, SCR_H * 0.5 - halfH, SCR_W, halfH * 2);
        sCtx.clip();
        if (gray > 0.01) {
          sCtx.filter = `grayscale(${gray.toFixed(2)}) brightness(${(1 + gray * 0.32).toFixed(2)}) contrast(${(1 + gray * 0.16).toFixed(2)})`;
        }
        sCtx.drawImage(uiCanvas, 0, 0);
        sCtx.filter = 'none';
        sCtx.restore();

        // Residual bright white horizontal scan line fading as the CRT curtain opens
        const lineA = Math.max(0, 1 - e * 1.85);
        if (lineA > 0.01) {
          sCtx.shadowColor = '#ffffff'; sCtx.shadowBlur = 22;
          sCtx.fillStyle = `rgba(255,255,255,${lineA.toFixed(3)})`;
          sCtx.fillRect(0, SCR_H * 0.5 - 2.5, SCR_W, 5);
          sCtx.shadowBlur = 0;
        }
      }
      sCtx.restore();
      screenTex.needsUpdate = true;
    }

    /* ---------- PHOTOREALISTIC SPACE BLACK MACBOOK PRO M3 (REAL GLB MODEL) ---------- */
    const laptopRoot = new THREE.Group();
    laptopRoot.position.set(1.48, -0.90, -0.02);
    laptopRoot.rotation.y = -0.24;
    deskGroup.add(laptopRoot);

    const screenAnchor = new THREE.Object3D();
    screenAnchor.position.set(0, 1.05, -0.95);
    laptopRoot.add(screenAnchor);

    let screenWWorld = 2.90, screenHWorld = 1.82;
    let realScreenMesh = null;
    let macScreenMat = null;
    const laptopHitMeshes = [];

    const screenLight = new THREE.PointLight(0xffdfb8, 0, 7.5, 0.6);
    screenLight.position.set(0, 0, 1.05);
    screenAnchor.add(screenLight);

    if (typeof window.THREE_GLTFLoader !== 'undefined') {
      const loader = new window.THREE_GLTFLoader();
      if (typeof window.THREE_MeshoptDecoder !== 'undefined') {
        loader.setMeshoptDecoder(window.THREE_MeshoptDecoder);
      }
      loader.load('assets/models/macbook.glb', (gltf) => {
        const model = gltf.scene;

        model.traverse((o) => {
          if (!o.isMesh) return;
          const mats = Array.isArray(o.material) ? o.material : [o.material];
          if (mats.some((m) => m && m.name === 'JvMFZolVCdpPqjj')) {
            o.visible = false;
            return;
          }
          o.castShadow = true;
          o.receiveShadow = true;
          mats.forEach((m) => {
            if (!m) return;
            if ('envMapIntensity' in m) {
              m.envMapIntensity = m.userData?.spaceBlack ? 0.92 : 0.78;
            }
          });
        });

        model.updateMatrixWorld(true);
        const fullBox = new THREE.Box3().setFromObject(model);
        const fullSize = fullBox.getSize(new THREE.Vector3());
        const fitScale = 3.12 / Math.max(0.001, fullSize.x);
        model.scale.setScalar(fitScale);
        model.updateMatrixWorld(true);

        const scaledBox = new THREE.Box3().setFromObject(model);
        const scaledCenter = scaledBox.getCenter(new THREE.Vector3());
        model.position.set(-scaledCenter.x, -scaledBox.min.y, -scaledCenter.z);
        laptopRoot.add(model);
        laptopRoot.updateMatrixWorld(true);

        const realScreen = model.getObjectByName('Screen');
        if (realScreen && realScreen.isMesh) {
          realScreenMesh = realScreen;
          // THE ACTUAL 3D SCREEN MESH OF THE MACBOOK PRO IS THE INTERFACE!
          // Glossy dark glass reflections when sleeping -> 100% pure zero-haze full-contrast emissive display when awake!
          macScreenMat = new THREE.MeshPhysicalMaterial({
            map: screenTex,
            color: new THREE.Color(0x000000),
            emissive: new THREE.Color(0xffffff),
            emissiveMap: screenTex,
            emissiveIntensity: 0.0,
            roughness: 0.16,
            metalness: 0.0,
            clearcoat: 0.85,
            clearcoatRoughness: 0.12,
            envMapIntensity: 0.85,
            specularIntensity: 0.65,
            toneMapped: false
          });
          realScreen.material = macScreenMat;
          realScreen.castShadow = false;
          laptopHitMeshes.push(realScreen);

          // Exact zero-roll camera target frame for the real Screen mesh
          realScreen.updateMatrixWorld(true);
          const posAttr = realScreen.geometry.attributes.position;
          const v = new THREE.Vector3();
          const xAxis = new THREE.Vector3(1, 0, 0).applyQuaternion(laptopRoot.quaternion).normalize();
          const lapForward = new THREE.Vector3(0, 0, 1).applyQuaternion(laptopRoot.quaternion).normalize();
          const worldUp = new THREE.Vector3(0, 1, 0);

          let minY = Infinity, maxY = -Infinity, topZ = 0, botZ = 0, topCnt = 0, botCnt = 0;
          const yCoords = new Float32Array(posAttr.count);
          const zCoords = new Float32Array(posAttr.count);
          for (let i = 0; i < posAttr.count; i++) {
            v.fromBufferAttribute(posAttr, i).applyMatrix4(realScreen.matrixWorld);
            const py = v.dot(worldUp), pz = v.dot(lapForward);
            yCoords[i] = py; zCoords[i] = pz;
            if (py < minY) minY = py; if (py > maxY) maxY = py;
          }
          const spanY = maxY - minY;
          for (let i = 0; i < posAttr.count; i++) {
            if (yCoords[i] > maxY - spanY * 0.04) { topZ += zCoords[i]; topCnt++; }
            if (yCoords[i] < minY + spanY * 0.04) { botZ += zCoords[i]; botCnt++; }
          }
          const dz = (topZ / Math.max(1, topCnt)) - (botZ / Math.max(1, botCnt));
          const yAxis = new THREE.Vector3().addScaledVector(worldUp, spanY).addScaledVector(lapForward, dz).normalize();
          const nWorld = new THREE.Vector3().crossVectors(xAxis, yAxis).normalize();
          if (nWorld.dot(lapForward) < 0) nWorld.negate();

          let sMinX = Infinity, sMaxX = -Infinity, sMinY = Infinity, sMaxY = -Infinity, sMaxZ = -Infinity;
          for (let i = 0; i < posAttr.count; i++) {
            v.fromBufferAttribute(posAttr, i).applyMatrix4(realScreen.matrixWorld);
            const px = v.dot(xAxis), py = v.dot(yAxis), pz = v.dot(nWorld);
            if (px < sMinX) sMinX = px; if (px > sMaxX) sMaxX = px;
            if (py < sMinY) sMinY = py; if (py > sMaxY) sMaxY = py;
            if (pz > sMaxZ) sMaxZ = pz;
          }
          screenWWorld = sMaxX - sMinX;
          screenHWorld = sMaxY - sMinY;

          const worldCenter = new THREE.Vector3()
            .addScaledVector(xAxis, (sMinX + sMaxX) * 0.5)
            .addScaledVector(yAxis, (sMinY + sMaxY) * 0.5)
            .addScaledVector(nWorld, sMaxZ);

          const basisMat = new THREE.Matrix4().makeBasis(xAxis, yAxis, nWorld);
          laptopRoot.remove(screenAnchor);
          screenAnchor.position.copy(worldCenter);
          screenAnchor.quaternion.setFromRotationMatrix(basisMat);
          screenAnchor.scale.set(1, 1, 1);
          deskGroup.add(screenAnchor);
          screenAnchor.updateMatrixWorld(true);
        }

        const lidNode = model.getObjectByName('Lid');
        if (lidNode) lidNode.traverse((o) => { if (o.isMesh) laptopHitMeshes.push(o); });
      });
    }

    /* ---------- INTERACTION, RAYCASTING ON 3D SCREEN & ZOOM TRAVELLING ---------- */
    const raycaster = new THREE.Raycaster();
    const pointer = new THREE.Vector2(-10, -10);
    let hoveredIdx = -1;
    let parallaxX = 0, parallaxY = 0;

    let camMode = 'desk'; // 'desk' | 'booting' | 'open' | 'returning'
    let bootProgress = 0;
    let zoomProgress = 0;

    let screenDragging = false;
    let activeSliderBtn = null;
    let dragMoved = 0, lastScrX = 0, lastScrY = 0;

    const curLook = HOME_LOOK.clone();
    const targetCamPos = new THREE.Vector3();
    const targetLookAt = new THREE.Vector3();
    const scrWorldPos = new THREE.Vector3();
    const scrWorldQuat = new THREE.Quaternion();
    const scrNormal = new THREE.Vector3();

    function computeLaptopZoomTarget() {
      screenAnchor.updateWorldMatrix(true, false);
      screenAnchor.getWorldPosition(scrWorldPos);
      screenAnchor.getWorldQuaternion(scrWorldQuat);
      scrNormal.set(0, 0, 1).applyQuaternion(scrWorldQuat).normalize();
      const fovRad = THREE.MathUtils.degToRad(camera.fov);
      // Zoom cleanly onto the real 3D MacBook Pro screen so it fills ~90% of viewport with its slim bezel framing it!
      const dH = (screenHWorld / 0.89) / (2 * Math.tan(fovRad * 0.5));
      const dW = (screenWWorld / 0.91) / (2 * Math.tan(fovRad * 0.5) * camera.aspect);
      const dist = Math.max(dH, dW);
      targetCamPos.copy(scrWorldPos).addScaledVector(scrNormal, dist);
      targetLookAt.copy(scrWorldPos);
    }

    function openProjectOnLaptop(key, notifyParent = false) {
      const idx = booksData.findIndex((b) => b.key === key);
      const targetKey = idx >= 0 ? booksData[idx].key : booksData[0].key;
      if (idx >= 0) hoveredIdx = idx;
      if (notifyParent && onSelect) onSelect(targetKey);

      mountProjectInScreen(targetKey);
      if (camMode === 'open') {
        paintScreenOS(1);
        return;
      }
      camMode = 'booting';
      bootProgress = 0.01;
      zoomProgress = 0;
      computeLaptopZoomTarget();
    }

    function stepProject(delta) {
      const keys = osCfg?.projectKeys || booksData.map((b) => b.key);
      const i = keys.indexOf(activeKey);
      const nextKey = keys[(i + delta + keys.length) % keys.length];
      mountProjectInScreen(nextKey);
    }

    function returnToDesk() {
      if (camMode === 'desk') return;
      camMode = 'returning';
      hoveredIdx = -1;
      hoveredBtnId = null;
      if (onHoverChange) onHoverChange(null, -1);
      if (osCfg?.onClose) osCfg.onClose();
    }

    function screenHitCoords(e) {
      if (!realScreenMesh) return null;
      const r = canvas.getBoundingClientRect();
      pointer.x = ((e.clientX - r.left) / r.width) * 2 - 1;
      pointer.y = -((e.clientY - r.top) / r.height) * 2 + 1;
      raycaster.setFromCamera(pointer, camera);
      const hits = raycaster.intersectObject(realScreenMesh, false);
      if (!hits.length || !hits[0].uv) return null;
      return { x: hits[0].uv.x * SCR_W, y: (1 - hits[0].uv.y) * SCR_H };
    }

    function findBtnAt(pt) {
      if (!pt) return null;
      return uiButtons.find((b) => pt.x >= b.x && pt.x <= b.x + b.w && pt.y >= b.y && pt.y <= b.y + b.h) || null;
    }

    function inStage(pt) {
      return pt && pt.x >= STAGE_RECT.x && pt.x <= STAGE_RECT.x + STAGE_RECT.w && pt.y >= STAGE_RECT.y && pt.y <= STAGE_RECT.y + STAGE_RECT.h;
    }

    canvas.addEventListener('pointerdown', (e) => {
      if (camMode !== 'open') return;
      const pt = screenHitCoords(e);
      if (!pt) return;
      const btn = findBtnAt(pt);
      if (btn?.isSlider) {
        activeSliderBtn = btn;
        btn.action(pt.x);
        return;
      }
      if (inStage(pt)) {
        screenDragging = true; dragMoved = 0;
        lastScrX = pt.x; lastScrY = pt.y;
        if (activeKey === 'srgan') {
          srganSplit = Math.max(0.06, Math.min(0.94, 1 - (pt.x - STAGE_RECT.x) / STAGE_RECT.w));
          demoCtrl?.setSplit(srganSplit);
        }
      }
    });

    canvas.addEventListener('pointermove', (e) => {
      if (camMode === 'open') {
        const pt = screenHitCoords(e);
        if (activeSliderBtn && pt) {
          activeSliderBtn.action(pt.x);
          canvas.style.cursor = 'ew-resize';
          return;
        }
        if (screenDragging && pt) {
          const dx = pt.x - lastScrX, dy = pt.y - lastScrY;
          dragMoved += Math.abs(dx) + Math.abs(dy);
          lastScrX = pt.x; lastScrY = pt.y;
          if (activeKey === 'srgan') {
            srganSplit = Math.max(0.06, Math.min(0.94, 1 - (pt.x - STAGE_RECT.x) / STAGE_RECT.w));
            demoCtrl?.setSplit(srganSplit);
          } else if (demoCanvas?._tsbDrag) {
            demoCanvas._tsbDrag(dx * 0.72, dy * 0.72);
          }
          canvas.style.cursor = activeKey === 'srgan' ? 'ew-resize' : 'grabbing';
          return;
        }
        const btn = findBtnAt(pt);
        hoveredBtnId = btn ? btn.id : null;
        canvas.style.cursor = btn ? (btn.isSlider ? 'ew-resize' : 'pointer') : (inStage(pt) ? (activeKey === 'srgan' ? 'ew-resize' : 'grab') : 'default');
        return;
      }

      if (camMode !== 'desk') return;
      const r = canvas.getBoundingClientRect();
      pointer.x = ((e.clientX - r.left) / r.width) * 2 - 1;
      pointer.y = -((e.clientY - r.top) / r.height) * 2 + 1;
      parallaxX = pointer.x * 0.42;
      parallaxY = pointer.y * 0.16;

      raycaster.setFromCamera(pointer, camera);
      const bookHits = raycaster.intersectObjects(hitMeshes, false);
      const next = bookHits.length ? bookHits[0].object.userData.bookIndex : -1;
      if (next !== hoveredIdx) {
        hoveredIdx = next;
        if (onHoverChange) onHoverChange(hoveredIdx >= 0 ? booksData[hoveredIdx] : null, hoveredIdx);
      }
      const lapHits = laptopHitMeshes.length ? raycaster.intersectObjects(laptopHitMeshes, false) : [];
      canvas.style.cursor = (hoveredIdx >= 0 || lapHits.length > 0) ? 'pointer' : 'default';
    });

    window.addEventListener('pointerup', () => {
      activeSliderBtn = null;
      screenDragging = false;
    });

    canvas.addEventListener('pointerleave', () => {
      parallaxX = 0; parallaxY = 0;
      hoveredBtnId = null;
      if (camMode === 'desk' && hoveredIdx !== -1) {
        hoveredIdx = -1;
        if (onHoverChange) onHoverChange(null, -1);
      }
    });

    canvas.addEventListener('click', (e) => {
      if (camMode === 'open') {
        if (dragMoved > 12) { dragMoved = 0; return; }
        const pt = screenHitCoords(e);
        if (!pt) { returnToDesk(); return; } // Clicking outside the MacBook screen cleanly returns to the desk!
        const btn = findBtnAt(pt);
        if (btn && !btn.isSlider) { btn.action(pt.x); return; }
        if (inStage(pt) && demoCanvas?._tsbClick) {
          demoCanvas._tsbClick({
            normX: (pt.x - STAGE_RECT.x) / STAGE_RECT.w,
            normY: (pt.y - STAGE_RECT.y) / STAGE_RECT.h
          });
        }
        return;
      }

      if (camMode !== 'desk') return;
      if (hoveredIdx >= 0) {
        openProjectOnLaptop(booksData[hoveredIdx].key, true);
        return;
      }
      raycaster.setFromCamera(pointer, camera);
      if (laptopHitMeshes.length && raycaster.intersectObjects(laptopHitMeshes, false).length > 0) {
        openProjectOnLaptop(booksData[0].key, true);
      }
    });

    function syncTheme() {
      const light = getTheme() === 'light';
      scene.environment = light ? envLight : envDark;
      wallMat.opacity = light ? 0.14 : 0.30;
      deskMat.map = makeDeskTexture(light); deskMat.needsUpdate = true;
      ambLight.intensity = light ? 0.65 : 0.30;
      lampSpot.intensity = light ? 2.1 : 2.8;
    }
    syncTheme();

    let visible = true;
    new IntersectionObserver((e) => { visible = e[0].isIntersecting; }, { threshold: 0.02 }).observe(canvas);

    const clock = new THREE.Clock();
    function animate() {
      requestAnimationFrame(animate);
      if (!visible && camMode === 'desk') return;
      const dt = Math.min(0.05, clock.getDelta());

      if (camMode === 'booting') {
        bootProgress = Math.min(1, bootProgress + dt * 1.45);
        if (bootProgress > 0.18) zoomProgress = Math.min(1, zoomProgress + dt * 1.45);
        paintScreenOS(bootProgress);
        if (macScreenMat) {
          const awake = Math.min(1, bootProgress * 1.25);
          macScreenMat.emissiveIntensity = awake;
          macScreenMat.envMapIntensity = (1 - awake) * 0.85;
          macScreenMat.clearcoat = (1 - awake) * 0.85;
          macScreenMat.specularIntensity = (1 - awake) * 0.65;
        }
        screenLight.intensity = Math.min(1, bootProgress) * 2.0;

        computeLaptopZoomTarget();
        const ez = 1 - Math.pow(1 - zoomProgress, 3);
        camera.position.lerpVectors(HOME_POS, targetCamPos, ez);
        curLook.lerpVectors(HOME_LOOK, targetLookAt, ez);
        camera.lookAt(curLook);

        if (zoomProgress >= 0.995 && bootProgress >= 0.995) {
          camMode = 'open';
          camera.position.copy(targetCamPos);
          curLook.copy(targetLookAt);
          camera.lookAt(curLook);
        }
      } else if (camMode === 'open') {
        paintScreenOS(1);
        if (macScreenMat) {
          macScreenMat.emissiveIntensity = 1.0;
          macScreenMat.envMapIntensity = 0.0;
          macScreenMat.clearcoat = 0.0;
          macScreenMat.specularIntensity = 0.0;
        }
        computeLaptopZoomTarget();
        camera.position.lerp(targetCamPos, 0.25);
        curLook.lerp(targetLookAt, 0.25);
        camera.lookAt(curLook);
      } else if (camMode === 'returning') {
        bootProgress = Math.max(0, bootProgress - dt * 1.55);
        zoomProgress = Math.max(0, zoomProgress - dt * 1.45);
        paintScreenOS(bootProgress);
        if (macScreenMat) {
          const awake = Math.max(0, bootProgress);
          macScreenMat.emissiveIntensity = awake;
          macScreenMat.envMapIntensity = (1 - awake) * 0.85;
          macScreenMat.clearcoat = (1 - awake) * 0.85;
          macScreenMat.specularIntensity = (1 - awake) * 0.65;
        }
        screenLight.intensity = Math.max(0, bootProgress) * 2.0;

        computeLaptopZoomTarget();
        const ez = 1 - Math.pow(1 - zoomProgress, 3);
        camera.position.lerpVectors(HOME_POS, targetCamPos, ez);
        curLook.lerpVectors(HOME_LOOK, targetLookAt, ez);
        camera.lookAt(curLook);

        if (zoomProgress <= 0.01 && bootProgress <= 0.005) {
          camMode = 'desk';
          paintScreenOS(0);
          if (macScreenMat) {
            macScreenMat.emissiveIntensity = 0;
            macScreenMat.envMapIntensity = 0.85;
            macScreenMat.clearcoat = 0.85;
            macScreenMat.specularIntensity = 0.65;
          }
          screenLight.intensity = 0;
          disposeDemo();
        }
      } else if (camMode === 'desk') {
        camera.position.x += (HOME_POS.x + parallaxX - camera.position.x) * 0.055;
        camera.position.y += (HOME_POS.y + parallaxY - camera.position.y) * 0.055;
        camera.position.z += (HOME_POS.z - camera.position.z) * 0.055;
        curLook.lerp(HOME_LOOK, 0.06);
        camera.lookAt(curLook);
      }

      const hovRank = hoveredIdx >= 0 ? bookGroups[hoveredIdx].rank : -1;
      bookGroups.forEach((bg, idx) => {
        const isHov = idx === hoveredIdx;
        const isAbove = hovRank >= 0 && bg.rank > hovRank;
        const tX = isHov ? bg.baseX + 0.14 : bg.baseX;
        const tY = isHov ? bg.baseY + 0.12 : (isAbove ? bg.baseY + 0.10 : bg.baseY);
        const tZ = isHov ? bg.baseZ + 0.72 : bg.baseZ;
        const tRX = isHov ? 0.16 : 0;
        const tRY = isHov ? bg.baseRotY + 0.16 : bg.baseRotY;

        bg.curX += (tX - bg.curX) * 0.11;
        bg.curY += (tY - bg.curY) * 0.11;
        bg.curZ += (tZ - bg.curZ) * 0.11;
        bg.curRotX += (tRX - bg.curRotX) * 0.11;
        bg.curRotY += (tRY - bg.curRotY) * 0.11;

        bg.group.position.set(bg.curX, bg.curY, bg.curZ);
        bg.group.rotation.set(bg.curRotX, bg.curRotY, 0);
      });

      renderer.render(scene, camera);
    }
    animate();

    return {
      syncTheme,
      highlightBook(idx) { if (camMode === 'desk') hoveredIdx = idx; },
      openProjectOnLaptop,
      returnToDesk,
      stepProject,
      refreshScreen() { if (camMode === 'open' && activeKey) mountProjectInScreen(activeKey); }
    };
  }
  /* ==================== 3. CONCEPTUAL POINT-CLOUD 3D BRAIN (OASIS-1 MRI + ATTENTION MIL) ==================== */
  function createBrain3D(canvas, onSliceUpdate) {
    if (typeof THREE === 'undefined' || !canvas) return { setSlice() {}, setAuto() {}, dispose() {} };

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(40, 1, 0.1, 40);
    camera.position.set(0, 0.75, 5.1); camera.lookAt(0, 0, 0);

    const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true, preserveDrawingBuffer: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));

    function resize() {
      const w = canvas.clientWidth || canvas.width || 960, h = canvas.clientHeight || canvas.height || 760;
      camera.aspect = w / h; camera.updateProjectionMatrix(); renderer.setSize(w, h, false);
    }
    resize(); window.addEventListener('resize', resize);

    const brainRoot = new THREE.Group();
    scene.add(brainRoot);

    // High-density anatomical cortical point cloud (2 hemispheres with gyri/sulci + cerebellum + brainstem + hippocampi)
    const ptsList = [];
    const baseColors = [];
    const isHippo = [];

    const cCortex = new THREE.Color(0xcfc7ba);
    const cDeep = new THREE.Color(0x6d675f);
    const cSliceHi = new THREE.Color(0xe05336);
    const cAmber = new THREE.Color(0xd99b58);

    function sampleHemisphere(side, count) {
      for (let i = 0; i < count; i++) {
        const phi = Math.acos(1 - 2 * ((i + 0.5) / count));
        const theta = Math.PI * (1 + Math.sqrt(5)) * i;
        let x = Math.sin(phi) * Math.cos(theta);
        let y = Math.cos(phi);
        let z = Math.sin(phi) * Math.sin(theta);

        if (x * side < 0) x *= 0.14;
        x *= 0.92; y *= 0.98; z *= 1.48;
        const tempBulge = Math.exp(-Math.pow((y + 0.28) * 2.4, 2) - Math.pow((z - 0.12) * 1.5, 2)) * 0.22;
        x += side * tempBulge * (x * side > 0 ? 1 : 0);
        if (z > 0) x *= 1.0 - z * 0.14;
        if (y < -0.35) y += 0.16 * Math.exp(-z * z * 0.9);

        const g = ridgeFBM(x * 2.5 + side * 0.35, y * 2.5, z * 2.5);
        const fold = (g - 0.42) * 0.165;
        const len = Math.hypot(x, y, z) || 1;
        x += (x / len) * fold + side * 0.11;
        y += (y / len) * fold + 0.14;
        z += (z / len) * fold;

        ptsList.push(x, y, z);
        const col = cDeep.clone().lerp(cCortex, Math.max(0, Math.min(1, g * 1.2)));
        baseColors.push(col.r, col.g, col.b);
        isHippo.push(0);
      }
    }

    sampleHemisphere(-1, 2400);
    sampleHemisphere(1, 2400);

    // Cerebellum point cloud
    for (let i = 0; i < 750; i++) {
      const phi = Math.acos(1 - 2 * ((i + 0.5) / 750));
      const theta = Math.PI * (1 + Math.sqrt(5)) * i;
      const x = Math.sin(phi) * Math.cos(theta) * 0.68;
      const y = Math.cos(phi) * 0.38 - 0.56;
      const z = Math.sin(phi) * Math.sin(theta) * 0.46 - 0.82;
      ptsList.push(x, y + Math.sin(y * 34) * 0.02, z);
      baseColors.push(0.62, 0.58, 0.54);
      isHippo.push(0);
    }

    // Brainstem points
    for (let i = 0; i < 240; i++) {
      const a = (i / 240) * Math.PI * 24;
      const u = i / 240;
      const r = 0.13 + (1 - u) * 0.05;
      ptsList.push(Math.cos(a) * r, -1.24 + u * 0.86, Math.sin(a) * r - 0.32 + u * 0.12);
      baseColors.push(0.55, 0.52, 0.49);
      isHippo.push(0);
    }

    // Internal Hippocampi point clusters (Attention MIL focal zones)
    [-1, 1].forEach((side) => {
      for (let i = 0; i < 220; i++) {
        const u = (i / 220) * Math.PI * 1.15;
        const jitter = 0.045;
        const x = side * (0.34 + Math.cos(u) * 0.14) + (Math.random() - 0.5) * jitter;
        const y = -0.04 + Math.sin(u) * 0.18 + (Math.random() - 0.5) * jitter;
        const z = -0.08 + (u / Math.PI - 0.5) * 0.42 + (Math.random() - 0.5) * jitter;
        ptsList.push(x, y, z);
        baseColors.push(cAmber.r, cAmber.g, cAmber.b);
        isHippo.push(1);
      }
    });

    const totalPts = ptsList.length / 3;
    const basePosArr = new Float32Array(ptsList);
    const posArr = new Float32Array(ptsList);
    const colArr = new Float32Array(baseColors);
    const baseColArr = new Float32Array(baseColors);
    const phases = new Float32Array(totalPts);
    for (let i = 0; i < totalPts; i++) {
      phases[i] = (basePosArr[i * 3] * 2.7 + basePosArr[i * 3 + 1] * 3.1 + basePosArr[i * 3 + 2] * 2.3);
    }

    const bGeo = new THREE.BufferGeometry();
    bGeo.setAttribute('position', new THREE.BufferAttribute(posArr, 3));
    bGeo.setAttribute('color', new THREE.BufferAttribute(colArr, 3));
    const brainCloud = new THREE.Points(
      bGeo,
      new THREE.PointsMaterial({ size: 0.042, vertexColors: true, transparent: true, opacity: 0.92, depthWrite: false })
    );
    brainRoot.add(brainCloud);

    // Dotted Axial Slice Ring (100% points, zero solid planes!)
    const ringN = 140;
    const ringPos = new Float32Array(ringN * 3);
    for (let i = 0; i < ringN; i++) {
      const a = (i / ringN) * Math.PI * 2;
      ringPos[i * 3] = Math.cos(a) * 1.48;
      ringPos[i * 3 + 1] = 0;
      ringPos[i * 3 + 2] = Math.sin(a) * 1.82;
    }
    const rGeo = new THREE.BufferGeometry();
    rGeo.setAttribute('position', new THREE.BufferAttribute(ringPos, 3));
    const sliceRing = new THREE.Points(
      rGeo,
      new THREE.PointsMaterial({ color: 0xe05336, size: 0.045, transparent: true, opacity: 0.85, depthWrite: false })
    );
    brainRoot.add(sliceRing);

    let slice = 132, autoScan = true;
    const state = { rx: 0.24, ry: 0.55, vx: 0, vy: 0 };
    const isDragging = attachOrbit(canvas, state);
    const attnWeight = (s) => 0.006 + 0.054 * Math.exp(-Math.pow((s - 132) / 9.2, 2));

    let rafId = null;
    const clock = new THREE.Clock();
    function animate() {
      rafId = requestAnimationFrame(animate);
      const t = clock.getElapsedTime();
      if (autoScan) slice = 100 + Math.round(((Math.sin(t * 0.7) + 1) * 0.5) * 60);

      const sliceY = -0.82 + ((slice - 100) / 60) * 1.92;
      sliceRing.position.y = sliceY;
      const wAttn = attnWeight(slice);
      const hippoBoost = Math.min(1, wAttn / 0.055);

      // Organic living point-cloud breathing + subtle cortical ripple + slice highlighting
      const pAttr = bGeo.attributes.position;
      const pa = pAttr.array;
      const cAttr = bGeo.attributes.color;
      const ca = cAttr.array;
      const breath = 1.0 + Math.sin(t * 1.15) * 0.016;
      for (let i = 0; i < totalPts; i++) {
        const ix = i * 3;
        const bx = basePosArr[ix], by = basePosArr[ix + 1], bz = basePosArr[ix + 2];
        const ph = phases[i];
        const wave = Math.sin(t * 1.9 + ph) * 0.014;
        const drift = Math.cos(t * 1.35 + ph * 0.7) * 0.011;
        const px = bx * breath + wave;
        const py = by * breath + drift;
        const pz = bz * breath + Math.sin(t * 1.6 - ph * 0.8) * 0.012;
        pa[ix] = px; pa[ix + 1] = py; pa[ix + 2] = pz;

        const distSlice = Math.abs(py - sliceY);
        if (isHippo[i]) {
          const pulse = 0.75 + 0.25 * Math.sin(t * 3.4 + ph);
          ca[ix] = (cAmber.r + (cSliceHi.r - cAmber.r) * hippoBoost) * pulse;
          ca[ix + 1] = (cAmber.g + (cSliceHi.g - cAmber.g) * hippoBoost) * pulse;
          ca[ix + 2] = (cAmber.b + (cSliceHi.b - cAmber.b) * hippoBoost) * pulse;
        } else if (distSlice < 0.095) {
          const f = 1 - distSlice / 0.095;
          ca[ix] = baseColArr[ix] + (cSliceHi.r - baseColArr[ix]) * f;
          ca[ix + 1] = baseColArr[ix + 1] + (cSliceHi.g - baseColArr[ix + 1]) * f;
          ca[ix + 2] = baseColArr[ix + 2] + (cSliceHi.b - baseColArr[ix + 2]) * f;
        } else {
          const syn = 0.82 + 0.14 * Math.sin(t * 2.2 + ph);
          ca[ix] = baseColArr[ix] * syn;
          ca[ix + 1] = baseColArr[ix + 1] * syn;
          ca[ix + 2] = baseColArr[ix + 2] * syn;
        }
      }
      pAttr.needsUpdate = true;
      cAttr.needsUpdate = true;

      if (onSliceUpdate) onSliceUpdate(slice, wAttn);
      if (!isDragging()) { state.vy *= 0.92; state.vx *= 0.92; state.ry += state.vy + 0.0042; state.rx += state.vx; }
      brainRoot.rotation.set(state.rx, state.ry, 0);
      renderer.render(scene, camera);
    }
    animate();

    return {
      setSlice(s) { autoScan = false; slice = s; },
      setAuto(v) { autoScan = v; },
      dispose() { if (rafId) cancelAnimationFrame(rafId); window.removeEventListener('resize', resize); renderer.dispose(); }
    };
  }

  /* ==================== 4. ANKI 3D: PURE TACTILE FIELDNOTE PAPER FLASHCARD DECK (ZERO RINGS/CHAINS!) ==================== */
  function createAnki3D(canvas, getLang, onCardChange) {
    if (typeof THREE === 'undefined' || !canvas) return { flipCard() {}, nextCard() {}, dispose() {} };

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(34, 1, 0.1, 40);
    camera.position.set(0, 0.35, 4.75);
    camera.lookAt(0, 0, 0);

    const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true, preserveDrawingBuffer: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.08;

    function resize() {
      const w = canvas.clientWidth || canvas.width || 960, h = canvas.clientHeight || canvas.height || 760;
      camera.aspect = w / h; camera.updateProjectionMatrix(); renderer.setSize(w, h, false);
    }
    resize(); window.addEventListener('resize', resize);

    // Warm desk lamp lighting for realistic paper stock feel
    scene.add(new THREE.AmbientLight(0xfff5e8, 0.68));
    const deskSpot = new THREE.SpotLight(0xffd7a3, 2.2, 16, Math.PI * 0.42, 0.7, 0);
    deskSpot.position.set(1.8, 4.2, 4.0);
    deskSpot.castShadow = true;
    scene.add(deskSpot);
    const softFill = new THREE.DirectionalLight(0x9ec4d8, 0.5);
    softFill.position.set(-3.5, -1.0, 3.0);
    scene.add(softFill);

    const paperBump = makeLinenBumpTexture();

    // 5 authentic "Fieldnote / Studio" flashcards explaining Timothée's own projects!
    const DECK_FR = [
      { idx: '01 / 05', tag: 'ANKICARDSGENERATOR', q: ['Comment le pipeline évite-t-il', 'd’oublier des notions du cours ?'], a: ['Le cours complet est structuré en graphe', 'puis vérifié par un agent correcteur', 'anti-lignes orphelines avant export .apkg.'], code: 'NetworkX · genanki', extra: 'Pipeline 4 agents séquentiels · Mistral Large 4 & OCR' },
      { idx: '02 / 05', tag: 'WASSERSTEIN SRGAN', q: ['Pourquoi un W-GAN non-conditionnel', 'surpasse le conditionnel (TIPE) ?'], a: ['Sans sur-contrainte de condition,', 'la distance de Wasserstein W₁ stabilise', 'l’entraînement sur les textures ×2 et ×4.'], code: 'PSNR 28,74 dB · SSIM 0,8667', extra: 'TensorFlow / Keras · 12,7 M paramètres · TIPE CPGE' },
      { idx: '03 / 05', tag: 'ALZHEIMER OASIS-1', q: ['Pourquoi un split strict par patient', 'sur les 86 437 coupes IRM ?'], a: ['Les 61 coupes d’un volume partagent la', 'même anatomie : splitter par patient évite', 'tout data leakage entre train et test.'], code: 'ROC-AUC 0,9115 · MIL 100% Recall', extra: '347 patients · 1 417 volumes MPR · Attention MIL' },
      { idx: '04 / 05', tag: 'PARKINSON BOB-SLAY', q: ['Comment gérer les 8 visites répétées', 'et 42 % de NaN sur MDS-UPDRS ?'], a: ['Validation croisée groupée par patient', 'avec régresseurs NaN-natifs suivis', 'collaborativement sur le benchmark.'], code: 'GroupKFold · Skore Hub', extra: 'Hackathon Probabl × IBM × ESILV · 44 590 visites' },
      { idx: '05 / 05', tag: 'CHURN MLOPS (ATOS)', q: ['Comment le modèle XGBoost passe-t-il', 'du notebook à Kubernetes ?'], a: ['Le pipeline CI/CD exécute lint, pytest et', 'build Docker vers Nexus, puis déploie', 'l’API et l’interface MCP sur Minikube.'], code: 'GitLab CI · Kustomize · FastAPI', extra: 'Stage Atos · 7 modèles comparés · ROC AUC 0,865' }
    ];
    const DECK_EN = [
      { idx: '01 / 05', tag: 'ANKICARDSGENERATOR', q: ['How does the pipeline ensure', 'no course concept is missed?'], a: ['The full lecture is built into a knowledge', 'graph and verified by a completeness', 'checker agent before .apkg generation.'], code: 'NetworkX · genanki', extra: '4-agent sequential pipeline · Mistral Large 4 & OCR' },
      { idx: '02 / 05', tag: 'WASSERSTEIN SRGAN', q: ['Why did unconditional W-SRGAN', 'outperform conditional (TIPE)?'], a: ['Less rigid conditioning plus W₁ distance', 'stabilizes adversarial training and yields', 'sharper ×2 and ×4 reconstructions.'], code: 'PSNR 28.74 dB · SSIM 0.8667', extra: 'TensorFlow / Keras · 12.7M parameters · Prep School TIPE' },
      { idx: '03 / 05', tag: 'ALZHEIMER OASIS-1', q: ['Why enforce strict patient-level', 'splits across 86,437 MRI slices?'], a: ['All 61 slices per volume share identical', 'patient anatomy: patient-level splitting', 'guarantees zero data leakage at test time.'], code: 'ROC-AUC 0.9115 · MIL 100% Recall', extra: '347 patients · 1,417 MPR volumes · Gated Attention MIL' },
      { idx: '04 / 05', tag: 'PARKINSON BOB-SLAY', q: ['How to handle ~8 visits/patient', 'and 42% missing OFF scores?'], a: ['Patient-grouped cross-validation paired', 'with NaN-native regressors tracked', 'collaboratively across the team.'], code: 'GroupKFold · Skore Hub', extra: 'Probabl × IBM × ESILV Hackathon · 44,590 visits' },
      { idx: '05 / 05', tag: 'CHURN MLOPS (ATOS)', q: ['How does XGBoostPipeline2 ship', 'from notebook to Kubernetes?'], a: ['GitLab CI runs lint, pytest and Docker', 'build to Nexus, then deploys FastAPI and', 'Gradio MCP microservices on Minikube.'], code: 'GitLab CI · Kustomize · FastAPI', extra: 'Atos Internship · 7 models benchmarked · 0.865 ROC AUC' }
    ];

    // Exact "Fieldnote / Studio" Anki card renderer (matching scholar_design.py tokens & geometry!)
    function makePaperFace(card, isBack) {
      const c = document.createElement('canvas'); c.width = 1024; c.height = 660;
      const g = c.getContext('2d');
      const isFr = getLang() === 'fr';

      // Exact Fieldnote tokens
      const PAPER = '#FDFBF7';
      const INK = '#1B2233';
      const INK_SOFT = '#4B5266';
      const HAIRLINE = '#DDD5C4';
      const PRIMARY = '#263A5F';
      const PRIMARY_INK = '#FDFBF7';
      const PRIMARY_SOFT = '#DCE2EC';
      const ACCENT = '#B24A2E';
      const ACCENT_INK = '#FBF1EC';
      const SECONDARY = '#7C8965';
      const SECONDARY_INK = '#F2F4EC';

      // Warm off-white Fieldnote paper stock
      g.fillStyle = PAPER;
      g.fillRect(0, 0, 1024, 660);

      // Subtle hairline inner card margin
      g.strokeStyle = HAIRLINE;
      g.lineWidth = 2;
      g.beginPath(); g.roundRect(14, 14, 996, 632, 24); g.stroke();

      function drawChip(x, y, label, bgCol, fgCol) {
        g.font = '600 19px "Space Grotesk", sans-serif';
        const tw = g.measureText(label).width;
        const pw = tw + 58;
        const ph = 42;
        g.fillStyle = bgCol;
        g.beginPath(); g.roundRect(x, y, pw, ph, 999); g.fill();
        // Translucent status dot inside chip (.chip .dot)
        g.save();
        g.globalAlpha = 0.55;
        g.fillStyle = fgCol;
        g.beginPath(); g.arc(x + 22, y + ph / 2, 4.5, 0, Math.PI * 2); g.fill();
        g.restore();
        g.fillStyle = fgCol;
        g.textBaseline = 'middle';
        g.fillText(label, x + 36, y + ph / 2 + 1);
        g.textBaseline = 'alphabetic';
        return pw;
      }

      // Top .tag-row
      drawChip(56, 48, isFr ? 'QUESTION' : 'QUESTION', PRIMARY, PRIMARY_INK);
      g.fillStyle = INK_SOFT;
      g.font = '600 18px "Space Grotesk", sans-serif';
      g.textAlign = 'right';
      g.fillText(`${card.tag}   ·   ${card.idx}`, 968, 76);
      g.textAlign = 'left';

      if (!isBack) {
        // FRONT (BASIC_FRONT): Generous Source Serif 4 prompt + Fieldnote .extra footer badge
        g.fillStyle = INK;
        g.font = '500 46px "Source Serif 4", Georgia, serif';
        card.q.forEach((line, i) => g.fillText(line, 56, 224 + i * 68));

        // Subtle inline code/metric chip preview
        g.font = '500 22px "JetBrains Mono", monospace';
        const cw = g.measureText(card.code).width + 28;
        g.fillStyle = PRIMARY_SOFT;
        g.beginPath(); g.roundRect(56, 390, cw, 44, 10); g.fill();
        g.fillStyle = PRIMARY;
        g.fillText(card.code, 70, 419);

        // Exact Fieldnote .extra footer with olive-sage rounded-square .mark
        g.strokeStyle = HAIRLINE;
        g.lineWidth = 1.5;
        g.beginPath(); g.moveTo(56, 536); g.lineTo(968, 536); g.stroke();

        g.fillStyle = SECONDARY;
        g.beginPath(); g.roundRect(56, 560, 34, 34, 9); g.fill();
        g.fillStyle = SECONDARY_INK;
        g.font = '700 20px "Space Grotesk", sans-serif';
        g.textAlign = 'center'; g.textBaseline = 'middle';
        g.fillText('i', 73, 578);
        g.textAlign = 'left'; g.textBaseline = 'alphabetic';

        g.fillStyle = INK_SOFT;
        g.font = '500 22px "Space Grotesk", sans-serif';
        g.fillText(card.extra, 106, 585);
      } else {
        // BACK (BASIC_BACK): Compact prompt -> iconic organic terracotta .divider (-2deg) -> Answer chip -> .answer-block with 4px terracotta left bar!
        g.fillStyle = INK_SOFT;
        g.font = '400 28px "Source Serif 4", Georgia, serif';
        g.fillText(card.q.join(' '), 56, 134, 912);

        // Iconic Fieldnote hand-drawn terracotta brush divider (rotated -2deg!)
        g.save();
        g.translate(512, 186);
        g.rotate(-2 * Math.PI / 180);
        g.fillStyle = ACCENT;
        g.beginPath();
        g.moveTo(-110, -2);
        g.bezierCurveTo(-55, -11, 55, -7, 110, -1);
        g.bezierCurveTo(60, 9, -48, 10, -110, -2);
        g.closePath();
        g.fill();
        g.restore();

        // Terracotta Answer chip (.chip.chip--accent)
        drawChip(56, 224, isFr ? 'RÉPONSE' : 'ANSWER', ACCENT, ACCENT_INK);

        // .answer-block with 4px rounded terracotta vertical left bar
        g.fillStyle = ACCENT;
        g.beginPath(); g.roundRect(56, 294, 7, 198, 4); g.fill();

        g.fillStyle = INK;
        g.font = '400 36px "Source Serif 4", Georgia, serif';
        card.a.forEach((line, i) => g.fillText(line, 90, 336 + i * 54));

        // Inline code badge (.content code)
        g.font = '500 22px "JetBrains Mono", monospace';
        const cw = g.measureText(card.code).width + 28;
        g.fillStyle = PRIMARY_SOFT;
        g.beginPath(); g.roundRect(90, 526, cw, 42, 9); g.fill();
        g.fillStyle = PRIMARY;
        g.fillText(card.code, 104, 554);

        // Subtle Fieldnote footer signature
        g.fillStyle = INK_SOFT;
        g.font = '500 18px "Space Grotesk", sans-serif';
        g.textAlign = 'right';
        g.fillText('Studio · Fieldnote UI', 968, 554);
        g.textAlign = 'left';
      }

      const tex = new THREE.CanvasTexture(c);
      tex.anisotropy = 4;
      if (THREE.SRGBColorSpace) tex.colorSpace = THREE.SRGBColorSpace;
      return tex;
    }

    const root = new THREE.Group();
    scene.add(root);

    // Physical stack of 4 lower Fieldnote paper cards underneath
    const stackCardMat = new THREE.MeshStandardMaterial({ color: 0xFAF6ED, bumpMap: paperBump, bumpScale: 0.005, roughness: 0.84 });
    const stackEdgeMat = new THREE.MeshStandardMaterial({ color: 0xDDD5C4, roughness: 0.88 });
    for (let k = 1; k <= 4; k++) {
      const under = new THREE.Mesh(
        new THREE.BoxGeometry(2.74, 1.78, 0.028),
        [stackEdgeMat, stackEdgeMat, stackEdgeMat, stackEdgeMat, stackCardMat, stackCardMat]
      );
      under.position.set(k * 0.032 - 0.04, -k * 0.032, -k * 0.068);
      under.rotation.z = (k % 2 === 0 ? 1 : -1) * k * 0.012;
      under.receiveShadow = true;
      root.add(under);
    }

    // Active top physical Fieldnote card (warm #FDFBF7 stock)
    const frontMat = new THREE.MeshStandardMaterial({ bumpMap: paperBump, bumpScale: 0.004, roughness: 0.74 });
    const backMat = new THREE.MeshStandardMaterial({ bumpMap: paperBump, bumpScale: 0.004, roughness: 0.74 });
    const topCard = new THREE.Mesh(
      new THREE.BoxGeometry(2.78, 1.80, 0.036),
      [stackEdgeMat, stackEdgeMat, stackEdgeMat, stackEdgeMat, frontMat, backMat]
    );
    topCard.castShadow = true;
    root.add(topCard);

    let cardIdx = 0, flipped = false, flipAngle = 0;
    let slidePhase = 0; // >0 while animating card-swap

    function loadCard() {
      const deck = getLang() === 'fr' ? DECK_FR : DECK_EN;
      const c = deck[cardIdx % deck.length];
      if (frontMat.map) frontMat.map.dispose();
      if (backMat.map) backMat.map.dispose();
      frontMat.map = makePaperFace(c, false);
      backMat.map = makePaperFace(c, true);
      frontMat.needsUpdate = true; backMat.needsUpdate = true;
      if (onCardChange) onCardChange(c.idx, c.tag);
    }
    loadCard();

    const state = { rx: 0.1, ry: -0.1, vx: 0, vy: 0 };
    const isDragging = attachOrbit(canvas, state, () => { flipped = !flipped; });

    let rafId = null;
    const clock = new THREE.Clock();
    function animate() {
      rafId = requestAnimationFrame(animate);
      const t = clock.getElapsedTime();

      let slideArc = 0;
      if (slidePhase > 0) {
        slidePhase = Math.max(0, slidePhase - 0.065);
        slideArc = Math.sin(slidePhase * Math.PI);
        topCard.position.x = slideArc * 1.45;
        topCard.rotation.z = -slideArc * 0.14;
      } else {
        topCard.position.x *= 0.85;
        topCard.rotation.z *= 0.85;
      }

      flipAngle += ((flipped ? Math.PI : 0) - flipAngle) * 0.11;
      topCard.rotation.y = flipAngle;
      // Full geometric clearance: half-width is 1.39, so lifting by sin(angle) * 1.54 guarantees ZERO clipping with the deck underneath (even during card swap from verso)!
      const clearance = Math.sin(Math.min(Math.PI, Math.abs(flipAngle))) * 1.54;
      topCard.position.y = Math.sin(t * 1.4) * 0.025 + clearance * 0.14;
      topCard.position.z = 0.06 + clearance + slideArc * 0.42;

      if (!isDragging()) {
        state.vy *= 0.92; state.vx *= 0.92;
        state.ry = state.ry * 0.98 + state.vy + Math.sin(t * 0.45) * 0.0005;
        state.rx += (0.1 - state.rx) * 0.03 + state.vx;
      }
      root.rotation.set(state.rx, state.ry, 0);
      renderer.render(scene, camera);
    }
    animate();

    return {
      flipCard() { flipped = !flipped; },
      nextCard() {
        slidePhase = 1.0;
        flipped = false;
        setTimeout(() => { cardIdx = (cardIdx + 1) % 5; loadCard(); }, 180);
      },
      dispose() { if (rafId) cancelAnimationFrame(rafId); window.removeEventListener('resize', resize); renderer.dispose(); }
    };
  }

  /* ==================== 5. CHURN MLOPS: CONCEPTUAL MORPHING POINT-CLOUD (K8S CLUSTER <-> XGBOOST TREE & LANDSCAPE) ==================== */
  function createChurn3D(canvas, onViewChange, onRuleChange) {
    if (typeof THREE === 'undefined' || !canvas) return { setParams() {}, toggleView() {}, dispose() {} };

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(38, 1, 0.1, 45);
    camera.position.set(0, 1.55, 6.2); camera.lookAt(0, 0, 0);

    const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true, preserveDrawingBuffer: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));

    function resize() {
      const w = canvas.clientWidth || canvas.width || 960, h = canvas.clientHeight || canvas.height || 760;
      camera.aspect = w / h; camera.updateProjectionMatrix(); renderer.setSize(w, h, false);
    }
    resize(); window.addEventListener('resize', resize);

    const root = new THREE.Group();
    scene.add(root);

    // 3,600 unified conceptual points that smoothly morph between:
    // MODE 'cluster': Gradio MCP -> FastAPI + XGBoost Core (clickable) -> GitLab CI / Nexus
    // MODE 'algo':    Organic XGBoost Decision Tree + Logistic Churn Risk Surface (Loyal sage <-> Churn vermillon)
    const N = 3600;
    const posCluster = new Float32Array(N * 3);
    const colCluster = new Float32Array(N * 3);
    const posAlgo = new Float32Array(N * 3);
    const colAlgo = new Float32Array(N * 3);
    const curPos = new Float32Array(N * 3);
    const curCol = new Float32Array(N * 3);

    const cInk = new THREE.Color(0xdad2c4);
    const cBlue = new THREE.Color(0x5ea8cc);
    const cAmber = new THREE.Color(0xd99b58);
    const cSage = new THREE.Color(0x52b788);
    const cRed = new THREE.Color(0xe05336);

    function fillBoxPts(arr, colArr, start, count, cx, cy, cz, sx, sy, sz, color) {
      const hx = sx / 2, hy = sy / 2, hz = sz / 2;
      const edges = [
        [cx - hx, cy - hy, cz - hz, cx + hx, cy - hy, cz - hz], [cx + hx, cy - hy, cz - hz, cx + hx, cy + hy, cz - hz],
        [cx + hx, cy + hy, cz - hz, cx - hx, cy + hy, cz - hz], [cx - hx, cy + hy, cz - hz, cx - hx, cy - hy, cz - hz],
        [cx - hx, cy - hy, cz + hz, cx + hx, cy - hy, cz + hz], [cx + hx, cy - hy, cz + hz, cx + hx, cy + hy, cz + hz],
        [cx + hx, cy + hy, cz + hz, cx - hx, cy + hy, cz + hz], [cx - hx, cy + hy, cz + hz, cx - hx, cy - hy, cz + hz],
        [cx - hx, cy - hy, cz - hz, cx - hx, cy - hy, cz + hz], [cx + hx, cy - hy, cz - hz, cx + hx, cy - hy, cz + hz],
        [cx + hx, cy + hy, cz - hz, cx + hx, cy + hy, cz + hz], [cx - hx, cy + hy, cz - hz, cx - hx, cy + hy, cz + hz]
      ];
      for (let k = 0; k < count; k++) {
        const idx = (start + k) * 3;
        if (k < count * 0.72) {
          const e = edges[k % 12];
          const u = ((k * 17) % 100) / 100;
          arr[idx] = e[0] + (e[3] - e[0]) * u;
          arr[idx + 1] = e[1] + (e[4] - e[1]) * u;
          arr[idx + 2] = e[2] + (e[5] - e[2]) * u;
        } else {
          // Subtle interior volumetric dots
          arr[idx] = cx + (Math.random() - 0.5) * sx * 0.85;
          arr[idx + 1] = cy + (Math.random() - 0.5) * sy * 0.85;
          arr[idx + 2] = cz + (Math.random() - 0.5) * sz * 0.85;
        }
        colArr[idx] = color.r; colArr[idx + 1] = color.g; colArr[idx + 2] = color.b;
      }
    }

    function fillSpherePts(arr, colArr, start, count, cx, cy, cz, r, color) {
      for (let k = 0; k < count; k++) {
        const phi = Math.acos(1 - 2 * ((k + 0.5) / count));
        const theta = Math.PI * (1 + Math.sqrt(5)) * k;
        const idx = (start + k) * 3;
        arr[idx] = cx + r * Math.sin(phi) * Math.cos(theta);
        arr[idx + 1] = cy + r * Math.cos(phi);
        arr[idx + 2] = cz + r * Math.sin(phi) * Math.sin(theta);
        colArr[idx] = color.r; colArr[idx + 1] = color.g; colArr[idx + 2] = color.b;
      }
    }

    function fillCurvePts(arr, colArr, start, count, curve, spread, color) {
      for (let k = 0; k < count; k++) {
        const u = k / Math.max(1, count - 1);
        const pt = curve.getPoint(u);
        const idx = (start + k) * 3;
        arr[idx] = pt.x + (Math.random() - 0.5) * spread;
        arr[idx + 1] = pt.y + (Math.random() - 0.5) * spread;
        arr[idx + 2] = pt.z + (Math.random() - 0.5) * spread;
        colArr[idx] = color.r; colArr[idx + 1] = color.g; colArr[idx + 2] = color.b;
      }
    }

    // --- BUILD CLUSTER POINT CLOUD (0..3599) ---
    // Left pod: Gradio MCP (0..899)
    fillBoxPts(posCluster, colCluster, 0, 900, -2.05, 0, 0, 1.15, 0.92, 0.86, cBlue);
    // Center pod: FastAPI + XGBoost (clickable!) — outer dotted cylinder + inner tree core (900..2199)
    fillBoxPts(posCluster, colCluster, 900, 900, 0, 0, 0, 1.30, 1.16, 1.05, cRed);
    fillSpherePts(posCluster, colCluster, 1800, 400, 0, 0, 0, 0.36, cAmber);
    // Right pod: GitLab CI -> Nexus (2200..3099)
    fillBoxPts(posCluster, colCluster, 2200, 300, 2.05, -0.34, 0, 1.12, 0.28, 0.86, cSage);
    fillBoxPts(posCluster, colCluster, 2500, 300, 2.05, 0.0, 0, 1.12, 0.28, 0.86, cAmber);
    fillBoxPts(posCluster, colCluster, 2800, 300, 2.05, 0.34, 0, 1.12, 0.28, 0.86, cRed);
    // Curved conduits between pods (3100..3599)
    const pipeL = new THREE.QuadraticBezierCurve3(new THREE.Vector3(-1.45, 0, 0), new THREE.Vector3(-1.05, -0.22, 0.15), new THREE.Vector3(-0.68, 0, 0));
    const pipeR = new THREE.QuadraticBezierCurve3(new THREE.Vector3(0.68, 0, 0), new THREE.Vector3(1.05, -0.22, 0.15), new THREE.Vector3(1.45, 0, 0));
    fillCurvePts(posCluster, colCluster, 3100, 250, pipeL, 0.03, cInk);
    fillCurvePts(posCluster, colCluster, 3350, 250, pipeR, 0.03, cInk);

    // --- BUILD ALGO POINT CLOUD (XGBoost Decision Tree + Logistic Risk Landscape, 0..3599) ---
    // Part 1: Logistic Risk Topography (48 x 45 = 2160 points, indices 0..2159)
    const landW = 4.6, landD = 3.2;
    function churnSurf(x, z) {
      const tenN = x / landW + 0.5, tktN = z / landD + 0.5;
      const prob = 1 / (1 + Math.exp(-(-1.2 - tenN * 2.8 + tktN * 4.0)));
      return { prob, y: -1.15 + prob * 0.72 + Math.sin(x * 1.9) * Math.cos(z * 2.1) * 0.04 };
    }
    let idxA = 0;
    for (let ix = 0; ix < 48; ix++) {
      for (let iz = 0; iz < 45; iz++) {
        const x = (ix / 47 - 0.5) * landW;
        const z = (iz / 44 - 0.5) * landD;
        const { prob, y } = churnSurf(x, z);
        const col = prob < 0.5 ? cSage.clone().lerp(cAmber, prob * 2) : cAmber.clone().lerp(cRed, (prob - 0.5) * 2);
        posAlgo[idxA * 3] = x; posAlgo[idxA * 3 + 1] = y; posAlgo[idxA * 3 + 2] = z;
        colAlgo[idxA * 3] = col.r; colAlgo[idxA * 3 + 1] = col.g; colAlgo[idxA * 3 + 2] = col.b;
        idxA++;
      }
    }

    // Part 2: Curved XGBoost Decision Tree in Points (indices 2160..3599 = 1440 points)
    const N0 = new THREE.Vector3(0, -0.58, 0), N1 = new THREE.Vector3(0, 0.22, 0);
    const N2 = new THREE.Vector3(-1.02, 0.78, 0.14), N3 = new THREE.Vector3(1.02, 0.78, -0.14);
    const leaves = [
      new THREE.Vector3(-1.62, 1.42, -0.18), new THREE.Vector3(-0.46, 1.48, 0.36),
      new THREE.Vector3(0.46, 1.48, -0.32), new THREE.Vector3(1.62, 1.42, 0.18)
    ];
    const mkCurve = (a, b, arch) => new THREE.QuadraticBezierCurve3(a, a.clone().lerp(b, 0.5).add(new THREE.Vector3(0, arch, 0)), b);
    const curves = [
      { id: 'trunk', c: mkCurve(N0, N1, 0), range: [2160, 2360] },
      { id: 'bL', c: mkCurve(N1, N2, 0.16), range: [2360, 2560] },
      { id: 'bR', c: mkCurve(N1, N3, 0.16), range: [2560, 2760] },
      { id: 't0', c: mkCurve(N2, leaves[0], 0.12), range: [2760, 2900] },
      { id: 't1', c: mkCurve(N2, leaves[1], 0.12), range: [2900, 3040] },
      { id: 't2', c: mkCurve(N3, leaves[2], 0.12), range: [3040, 3180] },
      { id: 't3', c: mkCurve(N3, leaves[3], 0.12), range: [3180, 3320] }
    ];
    curves.forEach((br) => fillCurvePts(posAlgo, colAlgo, br.range[0], br.range[1] - br.range[0], br.c, 0.045, cInk));
    const leafRanges = [[3320, 3390, cAmber], [3390, 3460, cRed], [3460, 3530, cSage], [3530, 3600, cRed]];
    leafRanges.forEach(([s, e, col], li) => fillSpherePts(posAlgo, colAlgo, s, e - s, leaves[li].x, leaves[li].y, leaves[li].z, 0.18, col));

    // Init current state = Cluster
    curPos.set(posCluster); curCol.set(colCluster);
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(curPos, 3));
    geo.setAttribute('color', new THREE.BufferAttribute(curCol, 3));
    const cloud = new THREE.Points(geo, new THREE.PointsMaterial({ size: 0.046, vertexColors: true, transparent: true, opacity: 0.92, depthWrite: false }));
    root.add(cloud);

    // Subtle glowing marker point (request in cluster / active customer in algo)
    const activeDot = new THREE.Mesh(new THREE.SphereGeometry(0.085, 14, 14), new THREE.MeshBasicMaterial({ color: 0xf4efe4 }));
    root.add(activeDot);

    // Invisible hitbox on center FastAPI+XGB pod
    const centerHit = new THREE.Mesh(new THREE.BoxGeometry(1.45, 1.3, 1.2), new THREE.MeshBasicMaterial({ visible: false }));
    root.add(centerHit);

    let mode = 'cluster', tenure = 24, tickets = 1, flow = 0, lastCycle = -1;

    function refreshAlgoColors() {
      const shortTen = tenure < 18;
      const leafIdx = shortTen ? (tickets >= 3 ? 1 : 0) : (tickets >= 4 ? 3 : 2);
      const activeIds = new Set(['trunk', shortTen ? 'bL' : 'bR', `t${leafIdx}`]);

      curves.forEach((br) => {
        const hit = activeIds.has(br.id);
        const col = hit ? cRed : cInk;
        const dim = hit ? 1.0 : 0.34;
        for (let i = br.range[0]; i < br.range[1]; i++) {
          colAlgo[i * 3] = col.r * dim; colAlgo[i * 3 + 1] = col.g * dim; colAlgo[i * 3 + 2] = col.b * dim;
        }
      });

      if (onRuleChange) {
        const ruleStr = shortTen
          ? `Tenure ${tenure}m < 18m → Tickets ${tickets} ${tickets >= 3 ? '≥ 3 → CHURN' : '< 3 → MOD.'}`
          : `Tenure ${tenure}m ≥ 18m → Tickets ${tickets} ${tickets >= 4 ? '≥ 4 → RISK' : '< 4 → LOYAL'}`;
        onRuleChange(ruleStr);
      }
    }
    refreshAlgoColors();

    function setView(next) {
      mode = next;
      if (onViewChange) onViewChange(mode);
    }

    const raycaster = new THREE.Raycaster();
    const ptr = new THREE.Vector2();
    const state = { rx: 0.18, ry: -0.1, vx: 0, vy: 0 };

    const isDragging = attachOrbit(canvas, state, (e) => {
      if (mode === 'cluster' && e) {
        if (typeof e.normX === 'number') {
          ptr.x = e.normX * 2 - 1;
          ptr.y = -(e.normY * 2 - 1);
        } else {
          const r = canvas.getBoundingClientRect();
          ptr.x = ((e.clientX - r.left) / r.width) * 2 - 1;
          ptr.y = -((e.clientY - r.top) / r.height) * 2 + 1;
        }
        raycaster.setFromCamera(ptr, camera);
        if (raycaster.intersectObject(centerHit, false).length > 0) {
          setView('algo');
          return;
        }
      }
    });

    canvas.addEventListener('pointermove', (e) => {
      if (mode !== 'cluster') { canvas.style.cursor = 'grab'; return; }
      const r = canvas.getBoundingClientRect();
      ptr.x = ((e.clientX - r.left) / r.width) * 2 - 1;
      ptr.y = -((e.clientY - r.top) / r.height) * 2 + 1;
      raycaster.setFromCamera(ptr, camera);
      canvas.style.cursor = raycaster.intersectObject(centerHit, false).length > 0 ? 'pointer' : 'grab';
    });

    let rafId = null;
    const clock = new THREE.Clock();
    function animate() {
      rafId = requestAnimationFrame(animate);
      const t = clock.getElapsedTime();
      flow = (flow + 0.008) % 1;

      const tPos = mode === 'cluster' ? posCluster : posAlgo;
      const tCol = mode === 'cluster' ? colCluster : colAlgo;
      const pAttr = geo.attributes.position, cAttr = geo.attributes.color;
      const pa = pAttr.array, ca = cAttr.array;

      // Fluid point-cloud morphing between Kubernetes cluster & XGBoost algorithm!
      for (let i = 0; i < N * 3; i++) {
        pa[i] += (tPos[i] - pa[i]) * 0.085;
        ca[i] += (tCol[i] - ca[i]) * 0.09;
      }
      pAttr.needsUpdate = true; cAttr.needsUpdate = true;

      if (mode === 'cluster') {
        activeDot.visible = true;
        const u = (flow * 2) % 1;
        const p = flow < 0.5 ? pipeL.getPoint(u) : pipeR.getPoint(u);
        activeDot.position.copy(p);
        activeDot.scale.setScalar(0.85);
      } else {
        activeDot.visible = false;
        // Gently cycle through XGBoost decision branches every 2.8s so the tree lives organically
        const cycle = Math.floor(t / 2.8) % 4;
        if (cycle !== lastCycle) {
          lastCycle = cycle;
          const presets = [[8, 5], [10, 1], [48, 0], [36, 6]];
          tenure = presets[cycle][0]; tickets = presets[cycle][1];
          refreshAlgoColors();
        }
      }

      if (!isDragging()) {
        state.vy *= 0.92; state.vx *= 0.92;
        state.ry += state.vy + (mode === 'algo' ? 0.003 : Math.sin(t * 0.4) * 0.0006);
        state.rx += state.vx;
      }
      root.rotation.set(state.rx, state.ry, 0);
      renderer.render(scene, camera);
    }
    animate();

    return {
      setParams(ten, tkt) { tenure = ten; tickets = tkt; refreshAlgoColors(); },
      toggleView() { setView(mode === 'cluster' ? 'algo' : 'cluster'); },
      dispose() { if (rafId) cancelAnimationFrame(rafId); window.removeEventListener('resize', resize); renderer.dispose(); }
    };
  }

  /* ==================== 6. PARKINSON MDS-UPDRS: PURE CONCEPTUAL POINT-CLOUD REGRESSION MANIFOLD ==================== */
  function createBobslay3D(canvas) {
    if (typeof THREE === 'undefined' || !canvas) return { setMode() {}, dispose() {} };
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(40, 1, 0.1, 40);
    camera.position.set(3.1, 2.2, 4.3); camera.lookAt(0, 0, 0);
    const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true, preserveDrawingBuffer: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    function resize() {
      const w = canvas.clientWidth || canvas.width || 960, h = canvas.clientHeight || canvas.height || 760;
      camera.aspect = w / h; camera.updateProjectionMatrix(); renderer.setSize(w, h, false);
    }
    resize(); window.addEventListener('resize', resize);

    const root = new THREE.Group(); scene.add(root);

    // 1. Conceptual Point-Mesh Regression Manifold (30x30 fine points instead of rigid wireframe!)
    const gN = 30;
    const mPos = new Float32Array(gN * gN * 3);
    let k = 0;
    for (let ix = 0; ix < gN; ix++) {
      for (let iz = 0; iz < gN; iz++) {
        const x = (ix / (gN - 1) - 0.5) * 3.0;
        const z = (iz / (gN - 1) - 0.5) * 3.0;
        const y = Math.max(-1.05, Math.min(1.05, x * 0.48 + z * 0.28));
        mPos[k * 3] = x; mPos[k * 3 + 1] = y; mPos[k * 3 + 2] = z;
        k++;
      }
    }
    const mGeo = new THREE.BufferGeometry();
    mGeo.setAttribute('position', new THREE.BufferAttribute(mPos, 3));
    root.add(new THREE.Points(mGeo, new THREE.PointsMaterial({ color: 0xa39c90, size: 0.028, transparent: true, opacity: 0.45, depthWrite: false })));

    // 2. 520 Patient-Grouped Points morphing between Raw Biased & Debiased OFF MDS-UPDRS
    const N = 520;
    const rawPos = new Float32Array(N * 3), fixPos = new Float32Array(N * 3), curPos = new Float32Array(N * 3), colors = new Float32Array(N * 3);
    const c1 = new THREE.Color(0x5ea8cc), c2 = new THREE.Color(0xe05336), c3 = new THREE.Color(0xd99b58);
    for (let i = 0; i < N; i++) {
      const s1 = Math.sin(i * 12.9898) * 43758.5453; const r1 = s1 - Math.floor(s1);
      const s2 = Math.sin(i * 78.233) * 43758.5453; const r2 = s2 - Math.floor(s2);
      const s3 = Math.sin(i * 39.425) * 43758.5453; const r3 = s3 - Math.floor(s3);
      const x = (r1 - 0.5) * 2.9, z = (r2 - 0.5) * 2.9;
      const idealY = Math.max(-1.05, Math.min(1.05, x * 0.48 + z * 0.28));
      rawPos[i * 3] = x; rawPos[i * 3 + 1] = Math.max(-1.15, Math.min(1.15, idealY * 0.7 + (r3 - 0.5) * 1.25)); rawPos[i * 3 + 2] = z;
      fixPos[i * 3] = x; fixPos[i * 3 + 1] = Math.max(-1.15, Math.min(1.15, idealY + (r3 - 0.5) * 0.18)); fixPos[i * 3 + 2] = z;
      curPos[i * 3] = fixPos[i * 3]; curPos[i * 3 + 1] = fixPos[i * 3 + 1]; curPos[i * 3 + 2] = fixPos[i * 3 + 2];
      const col = i % 3 === 0 ? c1 : (i % 3 === 1 ? c2 : c3);
      colors[i * 3] = col.r; colors[i * 3 + 1] = col.g; colors[i * 3 + 2] = col.b;
    }
    const pGeo = new THREE.BufferGeometry();
    pGeo.setAttribute('position', new THREE.BufferAttribute(curPos, 3));
    pGeo.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    root.add(new THREE.Points(pGeo, new THREE.PointsMaterial({ size: 0.068, vertexColors: true, transparent: true, opacity: 0.92, depthWrite: false })));

    let debiased = true;
    const state = { rx: 0.14, ry: 0.4, vx: 0, vy: 0 };
    const isDragging = attachOrbit(canvas, state, () => { debiased = !debiased; });
    let rafId = null;
    function animate() {
      rafId = requestAnimationFrame(animate);
      const target = debiased ? fixPos : rawPos;
      const arr = pGeo.attributes.position.array;
      for (let i = 0; i < N * 3; i++) arr[i] += (target[i] - arr[i]) * 0.09;
      pGeo.attributes.position.needsUpdate = true;
      if (!isDragging()) { state.vy *= 0.92; state.vx *= 0.92; state.ry += state.vy + 0.0038; state.rx += state.vx; }
      root.rotation.set(state.rx, state.ry, 0);
      renderer.render(scene, camera);
    }
    animate();
    return { setMode(isFix) { debiased = isFix; }, dispose() { if (rafId) cancelAnimationFrame(rafId); window.removeEventListener('resize', resize); renderer.dispose(); } };
  }

  /* ==================== 7. SRGAN HD 2D PIXEL COMPARATOR ==================== */
  function createSrganLab(canvas) {
    const ctx = canvas.getContext('2d');
    const BASE = 16;
    function sampleRGB(u, v) {
      const dx = (u - 0.65) * 1.35, dy = v - 0.34;
      const orb = Math.hypot(dx, dy);
      const m1 = 0.56 + Math.sin(u * 6.5 + 0.5) * 0.12 + Math.cos(u * 15) * 0.035;
      const m2 = 0.72 + Math.sin(u * 9.5 + 2.2) * 0.075;
      if (v > m2) return [20, 19, 18];
      if (v > m1) {
        const rim = Math.max(0, 1 - Math.abs(v - m1) * 18) * Math.max(0, 1 - Math.abs(u - 0.65) * 2.0);
        return [48 + rim * 185, 56 + rim * 60, 62 + rim * 18];
      }
      if (orb < 0.15) return [224, 83, 54];
      const halo = Math.exp(-orb * orb * 7.5);
      return [Math.min(255, 24 + v * 28 + halo * 168), Math.min(255, 30 + v * 38 + halo * 72), Math.min(255, 42 + v * 46 + halo * 34)];
    }
    function buildGrid(mult) {
      const cols = BASE * mult, rows = Math.round(BASE * 0.65) * mult;
      const off = document.createElement('canvas'); off.width = cols; off.height = rows;
      const g = off.getContext('2d'); const img = g.createImageData(cols, rows);
      for (let y = 0; y < rows; y++) {
        for (let x = 0; x < cols; x++) {
          const [R, G, B] = sampleRGB((x + 0.5) / cols, (y + 0.5) / rows);
          const idx = (y * cols + x) * 4;
          img.data[idx] = R; img.data[idx + 1] = G; img.data[idx + 2] = B; img.data[idx + 3] = 255;
        }
      }
      g.putImageData(img, 0, 0); return off;
    }
    const grids = { 1: buildGrid(1), 2: buildGrid(2), 4: buildGrid(4) };
    let scale = 4, split = 0.58, rafId = null;

    canvas.addEventListener('pointermove', (e) => {
      if (e.buttons !== 1 && e.pointerType === 'mouse') return;
      const r = canvas.getBoundingClientRect();
      split = Math.max(0.05, Math.min(0.95, 1 - (e.clientX - r.left) / r.width));
    });

    function drawLayer(mult, x, y, dw, dh) {
      ctx.imageSmoothingEnabled = false;
      ctx.drawImage(grids[mult], x, y, dw, dh);
      const cols = grids[mult].width, rows = grids[mult].height;
      ctx.strokeStyle = mult === 4 ? 'rgba(0,0,0,0.12)' : 'rgba(0,0,0,0.34)';
      ctx.lineWidth = mult === 4 ? 0.5 : 1;
      ctx.beginPath();
      for (let i = 0; i <= cols; i++) { const gx = x + (dw * i) / cols; ctx.moveTo(gx, y); ctx.lineTo(gx, y + dh); }
      for (let j = 0; j <= rows; j++) { const gy = y + (dh * j) / rows; ctx.moveTo(x, gy); ctx.lineTo(x + dw, gy); }
      ctx.stroke();
    }

    function render() {
      rafId = requestAnimationFrame(render);
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const w = canvas.clientWidth || canvas.width || 960, h = canvas.clientHeight || canvas.height || 760;
      if (canvas.width !== Math.round(w * dpr) || canvas.height !== Math.round(h * dpr)) {
        canvas.width = Math.round(w * dpr); canvas.height = Math.round(h * dpr);
      }
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, w, h);
      const dw = Math.min(w - 44, 480), dh = dw * 0.65;
      const x = (w - dw) / 2, y = (h - dh) / 2;

      drawLayer(1, x, y, dw, dh);
      const cutX = x + dw * (1 - split);
      ctx.save();
      ctx.beginPath(); ctx.rect(cutX, y, x + dw - cutX, dh); ctx.clip();
      drawLayer(scale, x, y, dw, dh);
      ctx.restore();

      ctx.strokeStyle = '#e05336'; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.moveTo(cutX, y - 6); ctx.lineTo(cutX, y + dh + 6); ctx.stroke();
      ctx.fillStyle = '#efeae0'; ctx.font = '600 11px "JetBrains Mono", monospace';
      ctx.fillText('LR ×1', x + 10, y + 20);
      ctx.textAlign = 'right'; ctx.fillText(`SRGAN ×${scale}`, x + dw - 10, y + 20); ctx.textAlign = 'left';
    }
    render();
    return { setScale(s) { scale = s; }, setSplit(v) { split = v; }, dispose() { if (rafId) cancelAnimationFrame(rafId); } };
  }

  return { createHeroScene, createBookshelf3D, createBrain3D, createAnki3D, createChurn3D, createBobslay3D, createSrganLab };
})();
