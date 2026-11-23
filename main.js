/* ============================================================
   TIMOTHÉE SOULEZ BARSELO — SYNCED 3D MORPHING & INTERACTIVE UI
   Copper-Blue + Brushed Copper + Apple Glass
   ============================================================ */

(() => {
  'use strict';

  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const CBLUE = 0x4f95b8;
  const CBLUE_LIGHT = 0x7cc0e0;
  const COPPER = 0xcf824c;
  const COPPER_SOFT = 0xe2a478;
  const ICE_WHITE = 0xeef4f8;

  /* Helper: pointer drag-to-rotate with inertia + click callback */
  function attachDragRotation(canvas, targetState, onClick) {
    let dragging = false;
    let moved = 0;
    let lastX = 0;
    let lastY = 0;

    canvas.addEventListener('pointerdown', (e) => {
      dragging = true;
      moved = 0;
      lastX = e.clientX;
      lastY = e.clientY;
      canvas.setPointerCapture(e.pointerId);
    });

    canvas.addEventListener('pointermove', (e) => {
      if (!dragging) return;
      const dx = e.clientX - lastX;
      const dy = e.clientY - lastY;
      moved += Math.abs(dx) + Math.abs(dy);
      targetState.velY = dx * 0.009;
      targetState.velX = dy * 0.007;
      targetState.rotY += targetState.velY;
      targetState.rotX = Math.max(-1.15, Math.min(1.15, targetState.rotX + targetState.velX));
      lastX = e.clientX;
      lastY = e.clientY;
    });

    const endDrag = () => {
      if (dragging && moved < 6 && typeof onClick === 'function') onClick();
      dragging = false;
    };
    canvas.addEventListener('pointerup', endDrag);
    canvas.addEventListener('pointercancel', () => { dragging = false; });

    return () => dragging;
  }

  function trackVisibility(el) {
    let visible = true;
    if ('IntersectionObserver' in window) {
      const io = new IntersectionObserver((entries) => {
        visible = entries[0].isIntersecting;
      }, { threshold: 0.02 });
      io.observe(el);
    }
    return () => visible;
  }

  /* ==================== 1. SUBTLE AMBIENT BACKGROUND FIELD ==================== */
  function initBackgroundField() {
    if (typeof THREE === 'undefined') return;
    const canvas = document.getElementById('bg-canvas');
    if (!canvas) return;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(55, window.innerWidth / window.innerHeight, 0.1, 100);
    camera.position.z = 7;

    const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: false });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.5));
    renderer.setSize(window.innerWidth, window.innerHeight);

    const count = window.innerWidth < 768 ? 110 : 210;
    const pos = new Float32Array(count * 3);
    const col = new Float32Array(count * 3);
    const palette = [new THREE.Color(CBLUE_LIGHT), new THREE.Color(COPPER_SOFT), new THREE.Color(ICE_WHITE)];

    for (let i = 0; i < count; i++) {
      pos[i * 3] = (Math.random() - 0.5) * 18;
      pos[i * 3 + 1] = (Math.random() - 0.5) * 14;
      pos[i * 3 + 2] = (Math.random() - 0.5) * 8;
      const c = palette[i % palette.length];
      col[i * 3] = c.r;
      col[i * 3 + 1] = c.g;
      col[i * 3 + 2] = c.b;
    }

    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    geo.setAttribute('color', new THREE.BufferAttribute(col, 3));

    const points = new THREE.Points(
      geo,
      new THREE.PointsMaterial({ size: 0.034, vertexColors: true, transparent: true, opacity: 0.4, depthWrite: false })
    );
    scene.add(points);

    let scrollY = 0;
    window.addEventListener('scroll', () => { scrollY = window.scrollY; }, { passive: true });
    window.addEventListener('resize', () => {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
    });

    const clock = new THREE.Clock();
    function animate() {
      requestAnimationFrame(animate);
      const t = prefersReducedMotion ? 0 : clock.getElapsedTime();
      points.rotation.y = t * 0.015;
      points.position.y = scrollY * 0.0011;
      renderer.render(scene, camera);
    }
    animate();
  }

  /* ==================== 2. HERO 3D MORPHING (100% POINT-CLOUD / DOTTED SCHEMATICS) ==================== */
  let heroSetFacet = () => {};

  function initHero3DStage() {
    if (typeof THREE === 'undefined') return;
    const canvas = document.getElementById('hero-3d');
    if (!canvas) return;

    const isVisible = trackVisibility(canvas);
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(42, 1, 0.1, 60);
    camera.position.set(0, 0.25, 6.2);
    camera.lookAt(0, 0, 0);

    const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));

    function resize() {
      const w = canvas.clientWidth || 400;
      const h = canvas.clientHeight || 400;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h, false);
    }
    resize();
    window.addEventListener('resize', resize);

    const root = new THREE.Group();
    scene.add(root);

    function fillLinePoints(arr, startIdx, count, a, b) {
      for (let k = 0; k < count; k++) {
        const idx = (startIdx + k) * 3;
        const u = k / Math.max(1, count - 1);
        arr[idx] = a[0] + (b[0] - a[0]) * u;
        arr[idx + 1] = a[1] + (b[1] - a[1]) * u;
        arr[idx + 2] = a[2] + (b[2] - a[2]) * u;
      }
    }

    function fillBoxEdgePoints(arr, startIdx, count, cx, cy, cz, sx, sy, sz) {
      const hx = sx / 2, hy = sy / 2, hz = sz / 2;
      const edges = [
        [cx - hx, cy - hy, cz - hz, cx + hx, cy - hy, cz - hz],
        [cx + hx, cy - hy, cz - hz, cx + hx, cy + hy, cz - hz],
        [cx + hx, cy + hy, cz - hz, cx - hx, cy + hy, cz - hz],
        [cx - hx, cy + hy, cz - hz, cx - hx, cy - hy, cz - hz],
        [cx - hx, cy - hy, cz + hz, cx + hx, cy - hy, cz + hz],
        [cx + hx, cy - hy, cz + hz, cx + hx, cy + hy, cz + hz],
        [cx + hx, cy + hy, cz + hz, cx - hx, cy + hy, cz + hz],
        [cx - hx, cy + hy, cz + hz, cx - hx, cy - hy, cz + hz],
        [cx - hx, cy - hy, cz - hz, cx - hx, cy - hy, cz + hz],
        [cx + hx, cy - hy, cz - hz, cx + hx, cy - hy, cz + hz],
        [cx + hx, cy + hy, cz - hz, cx + hx, cy + hy, cz + hz],
        [cx - hx, cy + hy, cz - hz, cx - hx, cy + hy, cz + hz]
      ];
      for (let k = 0; k < count; k++) {
        const eIdx = k % 12;
        const step = Math.floor(k / 12) / Math.max(1, Math.floor(count / 12) - 1);
        const e = edges[eIdx];
        const idx = (startIdx + k) * 3;
        arr[idx] = e[0] + (e[3] - e[0]) * step;
        arr[idx + 1] = e[1] + (e[4] - e[1]) * step;
        arr[idx + 2] = e[2] + (e[5] - e[2]) * step;
      }
    }

    function fillSpherePoints(arr, startIdx, count, cx, cy, cz, r) {
      for (let k = 0; k < count; k++) {
        const phi = Math.acos(1 - 2 * ((k + 0.5) / count));
        const theta = Math.PI * (1 + Math.sqrt(5)) * k;
        const idx = (startIdx + k) * 3;
        arr[idx] = cx + r * Math.sin(phi) * Math.cos(theta);
        arr[idx + 1] = cy + r * Math.cos(phi);
        arr[idx + 2] = cz + r * Math.sin(phi) * Math.sin(theta);
      }
    }

    // Pure dotted point cloud (no solid 3D meshes, no rigid lines)
    const N = 1800;
    const shapes = [
      new Float32Array(N * 3),
      new Float32Array(N * 3),
      new Float32Array(N * 3),
      new Float32Array(N * 3)
    ];
    const currentPos = new Float32Array(N * 3);
    const colors = new Float32Array(N * 3);

    // == SHAPE 0: SYSTEM ARCHITECTURE (Central Orchestrator + 4 System Modules + Orthogonal Dotted Buses) ==
    const archModules = [
      [0, 0, 0, 1.08, 0.74, 0.68],        // Central Orchestrator
      [-1.82, 0.94, 0, 0.84, 0.54, 0.44], // Input / Data
      [1.82, 0.94, 0, 0.84, 0.54, 0.44],  // LLM Reasoning
      [-1.82, -0.94, 0, 0.84, 0.54, 0.44],// Memory / Vector Store
      [1.82, -0.94, 0, 0.84, 0.54, 0.44]  // API / Output
    ];
    fillBoxEdgePoints(shapes[0], 0, 360, ...archModules[0]);
    fillBoxEdgePoints(shapes[0], 360, 240, ...archModules[1]);
    fillBoxEdgePoints(shapes[0], 600, 240, ...archModules[2]);
    fillBoxEdgePoints(shapes[0], 840, 240, ...archModules[3]);
    fillBoxEdgePoints(shapes[0], 1080, 240, ...archModules[4]);
    // Orthogonal L-shaped dotted buses (horizontal from core, then vertical to module)
    fillLinePoints(shapes[0], 1320, 60, [-0.54, 0.16, 0], [-1.18, 0.16, 0]);
    fillLinePoints(shapes[0], 1380, 60, [-1.18, 0.16, 0], [-1.18, 0.94, 0]);
    fillLinePoints(shapes[0], 1440, 60, [0.54, 0.16, 0], [1.18, 0.16, 0]);
    fillLinePoints(shapes[0], 1500, 60, [1.18, 0.16, 0], [1.18, 0.94, 0]);
    fillLinePoints(shapes[0], 1560, 60, [-0.54, -0.16, 0], [-1.18, -0.16, 0]);
    fillLinePoints(shapes[0], 1620, 60, [-1.18, -0.16, 0], [-1.18, -0.94, 0]);
    fillLinePoints(shapes[0], 1680, 60, [0.54, -0.16, 0], [1.18, -0.16, 0]);
    fillLinePoints(shapes[0], 1740, 60, [1.18, -0.16, 0], [1.18, -0.94, 0]);

    // == SHAPE 1: DEEP LEARNING (4-Layer Dotted Neural Network: 3 -> 5 -> 5 -> 2 + Dotted Synapses) ==
    const nnLayers = [
      { x: -1.98, ys: [-0.88, 0, 0.88] },
      { x: -0.66, ys: [-1.24, -0.62, 0, 0.62, 1.24] },
      { x: 0.66, ys: [-1.24, -0.62, 0, 0.62, 1.24] },
      { x: 1.98, ys: [-0.50, 0.50] }
    ];
    let pCursor = 0;
    nnLayers.forEach((layer) => {
      layer.ys.forEach((y) => {
        fillSpherePoints(shapes[1], pCursor, 56, layer.x, y, 0, 0.17);
        pCursor += 56;
      });
    });
    // Distribute remaining points evenly as clean dotted synapses across all layer pairs
    const synPairs = [];
    for (let l = 0; l < 3; l++) {
      nnLayers[l].ys.forEach((yA) => {
        nnLayers[l + 1].ys.forEach((yB) => {
          synPairs.push([[nnLayers[l].x, yA, 0], [nnLayers[l + 1].x, yB, 0]]);
        });
      });
    }
    const ptsPerSyn = Math.floor((N - pCursor) / synPairs.length);
    synPairs.forEach((pair) => {
      if (pCursor + ptsPerSyn <= N) {
        fillLinePoints(shapes[1], pCursor, ptsPerSyn, pair[0], pair[1]);
        pCursor += ptsPerSyn;
      }
    });
    while (pCursor < N) {
      const pair = synPairs[pCursor % synPairs.length];
      fillLinePoints(shapes[1], pCursor, 1, pair[0], pair[1]);
      pCursor++;
    }

    // == SHAPE 2: MLOPS DEPLOYMENT (Code Window -> Dotted Pipeline & Container -> Server Rack) ==
    // Left: Code editor panel (-2.08) + 5 indented code lines
    fillBoxEdgePoints(shapes[2], 0, 300, -2.08, 0, 0, 1.15, 1.42, 0.14);
    fillLinePoints(shapes[2], 300, 36, [-2.46, 0.44, 0.08], [-1.72, 0.44, 0.08]);
    fillLinePoints(shapes[2], 336, 36, [-2.36, 0.22, 0.08], [-1.84, 0.22, 0.08]);
    fillLinePoints(shapes[2], 372, 36, [-2.36, 0.00, 0.08], [-1.66, 0.00, 0.08]);
    fillLinePoints(shapes[2], 408, 36, [-2.26, -0.22, 0.08], [-1.78, -0.22, 0.08]);
    fillLinePoints(shapes[2], 444, 36, [-2.46, -0.44, 0.08], [-1.92, -0.44, 0.08]);
    // Center: Container Cube (0,0,0) + dotted transition arrows left & right
    fillBoxEdgePoints(shapes[2], 480, 360, 0, 0, 0, 0.96, 0.96, 0.96);
    fillLinePoints(shapes[2], 840, 110, [-1.45, 0, 0], [-0.54, 0, 0]);
    fillLinePoints(shapes[2], 950, 30, [-0.68, 0.14, 0], [-0.54, 0, 0]);
    fillLinePoints(shapes[2], 980, 30, [-0.68, -0.14, 0], [-0.54, 0, 0]);
    fillLinePoints(shapes[2], 1010, 110, [0.54, 0, 0], [1.45, 0, 0]);
    fillLinePoints(shapes[2], 1120, 30, [1.31, 0.14, 0], [1.45, 0, 0]);
    fillLinePoints(shapes[2], 1150, 30, [1.31, -0.14, 0], [1.45, 0, 0]);
    // Right: Server Rack (3 stacked server blades at x = +2.08 + LED dots)
    fillBoxEdgePoints(shapes[2], 1180, 192, 2.08, 0.56, 0, 1.08, 0.38, 0.72);
    fillBoxEdgePoints(shapes[2], 1372, 192, 2.08, 0.0, 0, 1.08, 0.38, 0.72);
    fillBoxEdgePoints(shapes[2], 1564, 192, 2.08, -0.56, 0, 1.08, 0.38, 0.72);
    fillSpherePoints(shapes[2], 1756, 15, 2.44, 0.56, 0.37, 0.05);
    fillSpherePoints(shapes[2], 1771, 15, 2.44, 0.0, 0.37, 0.05);
    fillSpherePoints(shapes[2], 1786, 14, 2.44, -0.56, 0.37, 0.05);

    // == SHAPE 3: QUANTUM ATOM (Dotted Protons/Neutrons Nucleus + 3 Elliptical Electron Orbits) ==
    const nucleusOffsets = [
      [0, 0, 0], [0.22, 0.12, 0.10], [-0.22, -0.10, 0.12],
      [0.12, -0.22, -0.10], [-0.14, 0.20, -0.12], [0.02, 0.04, 0.24], [-0.04, -0.05, -0.24]
    ];
    nucleusOffsets.forEach((no, idx) => {
      fillSpherePoints(shapes[3], idx * 60, 60, no[0], no[1], no[2], 0.16);
    });
    const orbitRotations = [
      [0.45, 0.25, 0.0],
      [-0.55, 0.35, 1.05],
      [0.20, -0.65, -1.05]
    ];
    const orbitEulers = orbitRotations.map((r) => new THREE.Euler(...r));
    // 3 dotted elliptical trajectories (400 points each = 1200) + 3 orbiting electron dot-clusters (60 each = 180)
    for (let o = 0; o < 3; o++) {
      const start = 420 + o * 400;
      for (let k = 0; k < 400; k++) {
        const ang = (k / 400) * Math.PI * 2;
        const v = new THREE.Vector3(Math.cos(ang) * 2.0, Math.sin(ang) * 0.92, 0).applyEuler(orbitEulers[o]);
        const idx = (start + k) * 3;
        shapes[3][idx] = v.x;
        shapes[3][idx + 1] = v.y;
        shapes[3][idx + 2] = v.z;
      }
    }
    // Indices 1620..1799 reserved for the 3 moving electron clusters in Atom mode (initialized on orbit)
    const ELECTRON_START = 1620;
    for (let e = 0; e < 3; e++) {
      const v = new THREE.Vector3(2.0, 0, 0).applyEuler(orbitEulers[e]);
      fillSpherePoints(shapes[3], ELECTRON_START + e * 60, 60, v.x, v.y, v.z, 0.11);
    }

    // Initialize point cloud & copper-blue / copper vertex colors
    const cBlue = new THREE.Color(CBLUE_LIGHT);
    const cCopper = new THREE.Color(COPPER_SOFT);
    const cWhite = new THREE.Color(ICE_WHITE);

    for (let i = 0; i < N; i++) {
      const ix = i * 3;
      currentPos[ix] = shapes[0][ix];
      currentPos[ix + 1] = shapes[0][ix + 1];
      currentPos[ix + 2] = shapes[0][ix + 2];
      const c = i >= ELECTRON_START ? cWhite : (i % 7 === 0 ? cWhite : cBlue.clone().lerp(cCopper, (i % 12) / 12));
      colors[ix] = c.r; colors[ix + 1] = c.g; colors[ix + 2] = c.b;
    }

    const pGeo = new THREE.BufferGeometry();
    pGeo.setAttribute('position', new THREE.BufferAttribute(currentPos, 3));
    pGeo.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    const cloud = new THREE.Points(
      pGeo,
      new THREE.PointsMaterial({ size: 0.044, vertexColors: true, transparent: true, opacity: 0.92, depthWrite: false })
    );
    root.add(cloud);

    let activeFacet = 0;
    let pulse = 0;
    const FACET_LABEL_KEYS = ['stage.agents', 'stage.dl', 'stage.mlops', 'stage.quantum'];

    heroSetFacet = (idx) => {
      activeFacet = ((idx % 4) + 4) % 4;
      pulse = 0.55;
      document.querySelectorAll('.stage-btn[data-facet]').forEach((b) => {
        b.classList.toggle('active', parseInt(b.dataset.facet, 10) === activeFacet);
      });
      const lbl = document.getElementById('hero3dLabel');
      if (lbl) {
        const key = FACET_LABEL_KEYS[activeFacet];
        lbl.setAttribute('data-i18n', key);
        if (I18N[currentLang][key]) lbl.textContent = I18N[currentLang][key];
      }
    };

    const dragState = { rotX: 0.16, rotY: 0.12, velX: 0, velY: 0 };
    const isDragging = attachDragRotation(canvas, dragState, () => { pulse = 0.85; });

    document.querySelectorAll('.stage-btn[data-facet]').forEach((btn) => {
      btn.addEventListener('click', () => syncJumpToRole(parseInt(btn.dataset.facet, 10)));
    });

    const tmpVec = new THREE.Vector3();
    const clock = new THREE.Clock();

    function animate() {
      requestAnimationFrame(animate);
      if (!isVisible()) return;

      const t = prefersReducedMotion ? 0 : clock.getElapsedTime();
      pulse *= 0.91;

      // Update live orbiting electron dot-clusters when Atom facet is active
      if (activeFacet === 3 && !prefersReducedMotion) {
        for (let e = 0; e < 3; e++) {
          const ang = t * (1.45 + e * 0.35) + e * 2.1;
          tmpVec.set(Math.cos(ang) * 2.0, Math.sin(ang) * 0.92, 0).applyEuler(orbitEulers[e]);
          fillSpherePoints(shapes[3], ELECTRON_START + e * 60, 60, tmpVec.x, tmpVec.y, tmpVec.z, 0.11);
        }
      }

      // Smooth morphing of every single dot toward the active dotted schematic
      const target = shapes[activeFacet];
      const posAttr = pGeo.attributes.position;
      const arr = posAttr.array;
      for (let i = 0; i < N; i++) {
        const ix = i * 3;
        const speed = (activeFacet === 3 && i >= ELECTRON_START) ? 0.32 : 0.095;
        const wave = 1 + pulse * 0.16 * Math.sin(i * 0.06 + t * 5);
        arr[ix] += (target[ix] * wave - arr[ix]) * speed;
        arr[ix + 1] += (target[ix + 1] * wave - arr[ix + 1]) * speed;
        arr[ix + 2] += (target[ix + 2] * wave - arr[ix + 2]) * speed;
      }
      posAttr.needsUpdate = true;

      if (!isDragging()) {
        dragState.velY *= 0.92;
        dragState.velX *= 0.92;
        dragState.rotY += dragState.velY + (prefersReducedMotion ? 0 : 0.0028);
        dragState.rotX += dragState.velX;
      }

      if (activeFacet === 3 || isDragging()) {
        root.rotation.y = dragState.rotY;
        root.rotation.x = dragState.rotX;
      } else {
        root.rotation.y = Math.sin(dragState.rotY * 0.7) * 0.42;
        root.rotation.x = dragState.rotX;
      }

      renderer.render(scene, camera);
    }
    animate();
  }

  /* ==================== 3. PROJECT 1: ANKI LINEAR 4-AGENT 3D PIPELINE (ENHANCED) ==================== */
  function initAnki3DScene() {
    if (typeof THREE === 'undefined') return;
    const canvas = document.getElementById('anki-3d');
    if (!canvas) return;

    const isVisible = trackVisibility(canvas);
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(36, 1, 0.1, 40);
    camera.position.set(0, 1.35, 5.4);
    camera.lookAt(0, -0.05, 0);

    const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));

    function resize() {
      const w = canvas.clientWidth || 360;
      const h = canvas.clientHeight || 238;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h, false);
    }
    resize();
    window.addEventListener('resize', resize);

    const root = new THREE.Group();
    scene.add(root);

    scene.add(new THREE.AmbientLight(0xeef6fc, 0.75));
    const keyLight = new THREE.PointLight(CBLUE_LIGHT, 1.6, 18);
    keyLight.position.set(-2.5, 3.5, 4);
    scene.add(keyLight);
    const rimLight = new THREE.PointLight(COPPER_SOFT, 1.4, 18);
    rimLight.position.set(3, 2.5, 3.5);
    scene.add(rimLight);

    // Subtle spatial grid floor
    const grid = new THREE.GridHelper(6.2, 14, CBLUE, 0x222c38);
    grid.position.y = -0.78;
    grid.material.transparent = true;
    grid.material.opacity = 0.35;
    root.add(grid);

    const xs = [-2.15, -0.72, 0.72, 2.15];
    const stageGroups = [];

    // --- Stage 0: OCR Scanner (PDF Page + Text Bars + Moving Laser Scan Bar) ---
    const s0 = new THREE.Group();
    const pdfPage = new THREE.Mesh(
      new THREE.BoxGeometry(0.68, 0.90, 0.06),
      new THREE.MeshStandardMaterial({ color: 0x263544, metalness: 0.35, roughness: 0.4 })
    );
    s0.add(pdfPage);
    for (let l = 0; l < 4; l++) {
      const bar = new THREE.Mesh(
        new THREE.BoxGeometry(0.46 - (l % 2) * 0.1, 0.045, 0.08),
        new THREE.MeshBasicMaterial({ color: CBLUE_LIGHT, transparent: true, opacity: 0.7 })
      );
      bar.position.set(-0.04, 0.26 - l * 0.17, 0.02);
      s0.add(bar);
    }
    const scanLaser = new THREE.Mesh(
      new THREE.BoxGeometry(0.84, 0.032, 0.14),
      new THREE.MeshBasicMaterial({ color: COPPER_SOFT })
    );
    s0.add(scanLaser);
    s0.position.set(xs[0], 0, 0);
    root.add(s0);
    stageGroups.push(s0);

    // --- Stage 1: Subject Identification (Classifier Core + Tilted 3D Orbital Ring) ---
    const s1 = new THREE.Group();
    const idCore = new THREE.Mesh(
      new THREE.IcosahedronGeometry(0.34, 0),
      new THREE.MeshStandardMaterial({ color: CBLUE_LIGHT, metalness: 0.55, roughness: 0.25, emissive: CBLUE, emissiveIntensity: 0.22 })
    );
    s1.add(idCore);
    const idRing = new THREE.Mesh(
      new THREE.TorusGeometry(0.48, 0.015, 10, 48),
      new THREE.MeshStandardMaterial({ color: COPPER_SOFT, metalness: 0.5, roughness: 0.3, transparent: true, opacity: 0.65 })
    );
    idRing.rotation.set(Math.PI * 0.22, Math.PI * 0.28, Math.PI * 0.18);
    s1.add(idRing);
    s1.position.set(xs[1], 0, 0);
    root.add(s1);
    stageGroups.push(s1);

    // --- Stage 2: Full-Course Segmentation (3 Connected Concept Nodes / Mini Knowledge Graph) ---
    const s2 = new THREE.Group();
    const segCoords = [[-0.22, 0.30, 0.08], [0.24, 0.02, -0.10], [-0.16, -0.30, 0.06]];
    segCoords.forEach((c, idx) => {
      const blk = new THREE.Mesh(
        new THREE.BoxGeometry(0.36, 0.18, 0.24),
        new THREE.MeshStandardMaterial({
          color: idx === 1 ? COPPER_SOFT : 0x5c9ab8,
          metalness: 0.42, roughness: 0.32
        })
      );
      blk.position.set(...c);
      s2.add(blk);
    });
    const graphLine = new THREE.Line(
      new THREE.BufferGeometry().setFromPoints(segCoords.map((c) => new THREE.Vector3(...c))),
      new THREE.LineBasicMaterial({ color: ICE_WHITE, transparent: true, opacity: 0.55 })
    );
    s2.add(graphLine);
    s2.position.set(xs[2], 0, 0);
    root.add(s2);
    stageGroups.push(s2);

    // --- Stage 3: Anki Flashcard Deck (Layered Deck + Floating Top Card that flips/lifts) ---
    const s3 = new THREE.Group();
    for (let k = 0; k < 3; k++) {
      const card = new THREE.Mesh(
        new THREE.BoxGeometry(0.72, 0.06, 0.48),
        new THREE.MeshStandardMaterial({ color: 0x2a3846, metalness: 0.4, roughness: 0.35 })
      );
      card.position.set(0, -0.26 + k * 0.12, 0);
      card.rotation.y = (k - 1) * 0.08;
      s3.add(card);
    }
    const topCard = new THREE.Group();
    const cardBase = new THREE.Mesh(
      new THREE.BoxGeometry(0.74, 0.065, 0.50),
      new THREE.MeshStandardMaterial({ color: COPPER_SOFT, metalness: 0.45, roughness: 0.28, emissive: COPPER, emissiveIntensity: 0.28 })
    );
    const cardStrip = new THREE.Mesh(
      new THREE.BoxGeometry(0.52, 0.072, 0.08),
      new THREE.MeshBasicMaterial({ color: ICE_WHITE })
    );
    cardStrip.position.z = -0.1;
    topCard.add(cardBase, cardStrip);
    topCard.position.y = 0.18;
    s3.add(topCard);
    s3.position.set(xs[3], 0, 0);
    root.add(s3);
    stageGroups.push(s3);

    // --- Directional Pipeline Conduits penetrating cleanly into each 3D agent ---
    for (let i = 0; i < 3; i++) {
      const startX = xs[i];
      const endX = xs[i + 1];
      const midX = (startX + endX) / 2;
      const tube = new THREE.Mesh(
        new THREE.CylinderGeometry(0.018, 0.018, endX - startX, 10),
        new THREE.MeshStandardMaterial({ color: CBLUE_LIGHT, metalness: 0.35, roughness: 0.4, transparent: true, opacity: 0.55 })
      );
      tube.rotation.z = Math.PI / 2;
      tube.position.set(midX, 0, 0);
      root.add(tube);

      // Directional arrow cone centered between stages
      const cone = new THREE.Mesh(
        new THREE.ConeGeometry(0.068, 0.15, 12),
        new THREE.MeshStandardMaterial({ color: COPPER_SOFT, metalness: 0.4, roughness: 0.35 })
      );
      cone.rotation.z = -Math.PI / 2;
      cone.position.set(midX + 0.04, 0, 0);
      root.add(cone);
    }

    // Multiple traveling data packets along the linear pipeline
    const packets = [];
    for (let k = 0; k < 3; k++) {
      const pkt = new THREE.Mesh(
        new THREE.SphereGeometry(0.085, 12, 12),
        new THREE.MeshBasicMaterial({ color: ICE_WHITE })
      );
      root.add(pkt);
      packets.push({ mesh: pkt, offset: k / 3 });
    }

    const hudSteps = document.querySelectorAll('.pipeline-steps-hud .pstep');
    let progress = 0;
    let speedBoost = 0;
    const restartFlow = () => { progress = 0; speedBoost = 0.014; };

    const dragState = { rotX: 0.12, rotY: 0, velX: 0, velY: 0 };
    const isDragging = attachDragRotation(canvas, dragState, restartFlow);

    const pulseBtn = document.getElementById('ankiPulseBtn');
    if (pulseBtn) pulseBtn.addEventListener('click', restartFlow);

    const clock = new THREE.Clock();
    function animate() {
      requestAnimationFrame(animate);
      if (!isVisible()) return;

      const t = prefersReducedMotion ? 0 : clock.getElapsedTime();
      speedBoost *= 0.95;
      progress = (progress + (prefersReducedMotion ? 0 : 0.0042 + speedBoost)) % 1;

      // Primary packet drives active HUD step
      const activeStage = Math.min(3, Math.floor(progress * 4));
      hudSteps.forEach((el, idx) => el.classList.toggle('active', idx === activeStage));

      // Packets travel strictly rectilinearly inside the conduits (y=0, z=0),
      // disappear inside each 3D agent while being processed, and emerge on the other side
      packets.forEach((p, idx) => {
        const u = (progress + p.offset) % 1;
        const px = xs[0] + (xs[3] - xs[0]) * u;
        const insideAgent = xs.some((ax) => Math.abs(px - ax) < 0.36);
        p.mesh.visible = !insideAgent;
        p.mesh.position.set(px, 0, 0);
        p.mesh.scale.setScalar(idx === 0 ? 1.05 : 0.78);
      });

      // Stage-specific animations
      scanLaser.position.y = Math.sin(t * 2.8) * 0.36;
      idCore.rotation.y = t * 1.1;
      idRing.rotation.y = Math.PI * 0.28 + t * 0.9;
      idRing.rotation.x = Math.PI * 0.22 + Math.sin(t * 0.7) * 0.25;
      s2.rotation.y = Math.sin(t * 0.9) * 0.35;
      topCard.position.y = 0.22 + Math.sin(t * 2.2) * 0.08 + (activeStage === 3 ? 0.10 : 0);
      topCard.rotation.z = activeStage === 3 ? Math.sin(t * 4) * 0.14 : 0.04;

      stageGroups.forEach((g, idx) => {
        const targetS = idx === activeStage ? 1.12 : 0.95;
        g.scale.x += (targetS - g.scale.x) * 0.12;
        g.scale.y += (targetS - g.scale.y) * 0.12;
        g.scale.z += (targetS - g.scale.z) * 0.12;
      });

      if (!isDragging()) {
        dragState.velY *= 0.92;
        dragState.velX *= 0.92;
        dragState.rotY += dragState.velY;
        dragState.rotX += dragState.velX;
        dragState.rotY *= 0.985;
        dragState.rotX += (0.12 - dragState.rotX) * 0.03;
      }
      root.rotation.y = dragState.rotY;
      root.rotation.x = dragState.rotX;

      renderer.render(scene, camera);
    }
    animate();
  }

  /* ==================== 4. PROJECT 2: SRGAN 2D PIXEL GRID (x1 -> x2 -> x4) ==================== */
  function initSrgan2DPixelGrid() {
    const canvas = document.getElementById('srgan-2d');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const isVisible = trackVisibility(canvas);
    const resInfo = document.getElementById('srganResInfo');
    const buttons = document.querySelectorAll('.res-btn[data-scale]');

    // Clean high-contrast procedural image (copper sun + layered copper-blue mountain horizon + reflection)
    function sampleSceneRGB(u, v) {
      // u, v in [0, 1]
      // Sun / orb at (0.68, 0.32)
      const dx = (u - 0.68) * 1.55;
      const dy = v - 0.32;
      const sunDist = Math.sqrt(dx * dx + dy * dy);

      // Mountain ridges
      const ridge1 = 0.56 + Math.sin(u * 6.2 + 0.5) * 0.11 + Math.cos(u * 13.0) * 0.035;
      const ridge2 = 0.69 + Math.sin(u * 8.5 + 2.4) * 0.075 + Math.cos(u * 17.0) * 0.02;

      if (v > ridge2) {
        // Foreground dark copper-blue terrain
        const t = Math.min(1, (v - ridge2) / 0.32);
        return [16 + t * 12, 34 + t * 18, 48 + t * 22];
      }
      if (v > ridge1) {
        // Midground mountain with subtle copper rim light near sun
        const rim = Math.max(0, 1 - Math.abs(v - ridge1) * 18) * Math.max(0, 1 - Math.abs(u - 0.68) * 2.1);
        return [
          38 + rim * 165,
          72 + rim * 65,
          96 + rim * 15
        ];
      }
      if (sunDist < 0.16) {
        // Warm brushed copper sun
        const core = 1 - sunDist / 0.16;
        return [215 + core * 36, 138 + core * 72, 82 + core * 68];
      }
      // Sky gradient + soft sun halo
      const halo = Math.exp(-sunDist * sunDist * 6.5);
      const skyR = 14 + v * 28 + halo * 125;
      const skyG = 28 + v * 58 + halo * 75;
      const skyB = 46 + v * 74 + halo * 38;
      return [Math.min(255, skyR), Math.min(255, skyG), Math.min(255, skyB)];
    }

    // Offscreen precomputed crisp pixel layers for x1 (10x6), x2 (20x12), x4 (40x24) -> true 2x and 4x density!
    const BASE_COLS = 10;
    const BASE_ROWS = 6;
    const scales = [1, 2, 4];

    function buildGridCanvas(scale) {
      const cols = BASE_COLS * scale;
      const rows = BASE_ROWS * scale;
      const off = document.createElement('canvas');
      off.width = cols;
      off.height = rows;
      const octx = off.getContext('2d');
      const img = octx.createImageData(cols, rows);

      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
          const u = (c + 0.5) / cols;
          const v = (r + 0.5) / rows;
          const [R, G, B] = sampleSceneRGB(u, v);
          const idx = (r * cols + c) * 4;
          img.data[idx] = R;
          img.data[idx + 1] = G;
          img.data[idx + 2] = B;
          img.data[idx + 3] = 255;
        }
      }
      octx.putImageData(img, 0, 0);
      return off;
    }

    const grids = {
      1: buildGridCanvas(1),
      2: buildGridCanvas(2),
      4: buildGridCanvas(4)
    };

    let currentScale = 1;
    let targetScale = 4;
    let transition = 1; // 0..1 morph between prevScale -> targetScale
    let prevScale = 1;
    let autoTimer = 0;

    function setScale(s, manual = false) {
      if (s === targetScale && transition >= 1) return;
      prevScale = targetScale;
      targetScale = s;
      transition = 0;
      if (manual) autoTimer = -3.5; // Pause auto-cycle briefly after user click

      buttons.forEach((b) => b.classList.toggle('active', parseInt(b.dataset.scale, 10) === s));
      if (resInfo) {
        const cols = BASE_COLS * s;
        const rows = BASE_ROWS * s;
        resInfo.textContent = `×${s} • ${cols}×${rows} px`;
      }
    }

    buttons.forEach((btn) => {
      btn.addEventListener('click', () => setScale(parseInt(btn.dataset.scale, 10), true));
    });

    canvas.addEventListener('click', () => {
      const next = scales[(scales.indexOf(targetScale) + 1) % scales.length];
      setScale(next, true);
    });

    function resize() {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const w = canvas.clientWidth || 360;
      const h = canvas.clientHeight || 238;
      canvas.width = Math.round(w * dpr);
      canvas.height = Math.round(h * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }
    resize();
    window.addEventListener('resize', resize);

    function drawPixelLayer(scale, alpha, w, h, padX, padY, drawW, drawH) {
      ctx.save();
      ctx.globalAlpha = alpha;
      ctx.imageSmoothingEnabled = false;
      ctx.drawImage(grids[scale], padX, padY, drawW, drawH);

      // Subtle crisp pixel grid lines so the x1 -> x2 -> x4 densification is unmistakably readable
      const cols = BASE_COLS * scale;
      const rows = BASE_ROWS * scale;
      const cellW = drawW / cols;
      const cellH = drawH / rows;
      ctx.strokeStyle = scale === 4 ? 'rgba(11, 13, 17, 0.16)' : 'rgba(11, 13, 17, 0.34)';
      ctx.lineWidth = scale === 4 ? 0.6 : 1;
      ctx.beginPath();
      for (let c = 0; c <= cols; c++) {
        const x = padX + c * cellW;
        ctx.moveTo(x, padY);
        ctx.lineTo(x, padY + drawH);
      }
      for (let r = 0; r <= rows; r++) {
        const y = padY + r * cellH;
        ctx.moveTo(padX, y);
        ctx.lineTo(padX + drawW, y);
      }
      ctx.stroke();
      ctx.restore();
    }

    // Initialize at x1 -> morphing to x4 on first reveal
    setScale(1, false);
    let lastTs = performance.now();

    function animate(now) {
      requestAnimationFrame(animate);
      if (!isVisible()) { lastTs = now; return; }

      const dt = Math.min(0.05, (now - lastTs) / 1000);
      lastTs = now;

      if (!prefersReducedMotion) {
        if (transition < 1) {
          transition = Math.min(1, transition + dt * 1.45);
        } else {
          autoTimer += dt;
          if (autoTimer > 2.6) {
            autoTimer = 0;
            const next = scales[(scales.indexOf(targetScale) + 1) % scales.length];
            setScale(next, false);
          }
        }
      } else {
        transition = 1;
      }

      const w = canvas.clientWidth || 360;
      const h = canvas.clientHeight || 238;
      ctx.clearRect(0, 0, w, h);

      // Centered aspect-locked 2D pixel viewport above the bottom control bar
      const drawW = Math.min(w - 36, 300);
      const drawH = drawW * (BASE_ROWS / BASE_COLS);
      const padX = (w - drawW) / 2;
      const padY = Math.max(14, (h - 40 - drawH) / 2);

      // Eased cross-morph + subtle scanline sweep
      const ease = 1 - Math.pow(1 - transition, 3);
      if (transition < 1) {
        drawPixelLayer(prevScale, 1 - ease * 0.85, w, h, padX, padY, drawW, drawH);
        // Clip sweep left -> right for satisfying SRGAN upscaling transition
        ctx.save();
        ctx.beginPath();
        ctx.rect(padX, padY, drawW * ease, drawH);
        ctx.clip();
        drawPixelLayer(targetScale, 1, w, h, padX, padY, drawW, drawH);
        ctx.restore();

        // Luminous copper-blue upscaling scanline
        const sweepX = padX + drawW * ease;
        ctx.fillStyle = 'rgba(124, 192, 224, 0.85)';
        ctx.fillRect(sweepX - 1, padY, 2, drawH);
      } else {
        drawPixelLayer(targetScale, 1, w, h, padX, padY, drawW, drawH);
      }

      // Clean frame border
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.22)';
      ctx.lineWidth = 1;
      ctx.strokeRect(padX, padY, drawW, drawH);
    }
    requestAnimationFrame(animate);
  }

  /* ==================== 5. 3D GLASS CARD TILT & SPOTLIGHT ==================== */
  function initTiltCards() {
    if (prefersReducedMotion || window.matchMedia('(pointer: coarse)').matches) return;

    document.querySelectorAll('.card-tilt').forEach((card) => {
      card.addEventListener('mousemove', (e) => {
        if (e.target.tagName === 'CANVAS') {
          card.style.transform = '';
          return;
        }
        const rect = card.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        const px = (x / rect.width) - 0.5;
        const py = (y / rect.height) - 0.5;

        card.style.setProperty('--mx', `${x}px`);
        card.style.setProperty('--my', `${y}px`);
        card.style.transform = `perspective(950px) rotateX(${(-py * 4).toFixed(2)}deg) rotateY(${(px * 4).toFixed(2)}deg) translateY(-3px)`;
      });

      card.addEventListener('mouseleave', () => { card.style.transform = ''; });
    });
  }

  /* ==================== 6. CURSOR GLOW, SCROLL PROGRESS & REVEAL ==================== */
  function initCursorAndScroll() {
    const glow = document.getElementById('cursorGlow');
    const progress = document.getElementById('scrollProgress');

    if (glow && !window.matchMedia('(pointer: coarse)').matches) {
      window.addEventListener('mousemove', (e) => {
        glow.style.opacity = '1';
        glow.style.left = `${e.clientX}px`;
        glow.style.top = `${e.clientY}px`;
      }, { passive: true });
    }

    const navLinks = document.querySelectorAll('.nav-link');
    const sections = document.querySelectorAll('main section[id]');

    window.addEventListener('scroll', () => {
      const max = Math.max(1, document.documentElement.scrollHeight - window.innerHeight);
      if (progress) progress.style.width = `${(window.scrollY / max) * 100}%`;

      let currentId = '';
      sections.forEach((sec) => {
        if (window.scrollY >= sec.offsetTop - 160) currentId = sec.id;
      });
      navLinks.forEach((link) => {
        link.classList.toggle('active', link.getAttribute('href') === `#${currentId}`);
      });
    }, { passive: true });

    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add('visible');
        observer.unobserve(entry.target);
      });
    }, { threshold: 0.1 });

    document.querySelectorAll('.reveal').forEach((el) => observer.observe(el));
  }

  /* ==================== 7. TYPEWRITER ROLES SYNCED TO HERO 3D MORPHING ==================== */
  const ROLES = {
    fr: [
      'Architecte de Systèmes Agentiques LLM',
      'Ingénieur Deep Learning & Recherche IA',
      'Ingénieur MLOps & Industrialisation',
      'Data Scientist & Quantum Computing'
    ],
    en: [
      'Agentic LLM Systems Builder',
      'Deep Learning & AI Research Engineer',
      'MLOps & Production Engineer',
      'Data Scientist & Quantum Computing'
    ]
  };

  let currentLang = 'fr';
  let roleIdx = 0;
  let charIdx = 0;
  let deleting = false;
  let typeTimerId = null;

  function syncJumpToRole(idx) {
    if (typeTimerId) clearTimeout(typeTimerId);
    roleIdx = ((idx % 4) + 4) % 4;
    charIdx = 0;
    deleting = false;
    heroSetFacet(roleIdx);
    runTypewriterTick();
  }

  function runTypewriterTick() {
    const el = document.getElementById('typewriterRole');
    if (!el) return;

    const list = ROLES[currentLang];
    const word = list[roleIdx % list.length];

    if (!deleting) {
      if (charIdx === 0) heroSetFacet(roleIdx);
      charIdx++;
      el.textContent = word.slice(0, charIdx);
      if (charIdx === word.length) {
        deleting = true;
        // ~3 seconds pause displaying the synced 3D object & role text
        typeTimerId = setTimeout(runTypewriterTick, 3000);
        return;
      }
      typeTimerId = setTimeout(runTypewriterTick, 42);
    } else {
      charIdx--;
      el.textContent = word.slice(0, charIdx);
      if (charIdx === 0) {
        deleting = false;
        roleIdx = (roleIdx + 1) % list.length;
        heroSetFacet(roleIdx);
        typeTimerId = setTimeout(runTypewriterTick, 280);
        return;
      }
      typeTimerId = setTimeout(runTypewriterTick, 24);
    }
  }

  function initTypewriter() {
    heroSetFacet(0);
    typeTimerId = setTimeout(runTypewriterTick, 700);
  }

  /* ==================== 8. BILINGUAL FR / EN SWITCHER ==================== */
  const I18N = {
    fr: {
      'nav.about': 'À propos',
      'nav.experience': 'Expériences',
      'nav.projects': 'Projets',
      'nav.skills': 'Compétences',
      'nav.education': 'Formations',
      'nav.contact': 'Contact',
      'nav.cv': 'CV',
      'hero.status': 'Disponible — Stage 5 mois (12 avr. – 7 sept. 2027)',
      'hero.greeting': 'Bonjour, je suis',
      'hero.desc': "Étudiant ingénieur en <strong>Data & IA à l'ESILV</strong>. Je conçois des <strong>systèmes agentiques LLM</strong>, des architectures de <strong>Deep Learning</strong> et des <strong>pipelines MLOps end-to-end</strong> prêts pour la production.",
      'hero.cta_projects': 'Explorer mes projets',
      'hero.cta_cv': 'Télécharger mon CV',
      'hero.hint': 'Glisser pour pivoter',
      'stage.agents': 'Architecture Système — Orchestration Agents IA',
      'stage.dl': 'Deep Learning — Réseau de Neurones',
      'stage.mlops': 'MLOps — Code → Conteneur → Serveur',
      'stage.quantum': 'Quantum — Atome (Noyau & Électrons)',
      'stage.btn0': 'Architecture',
      'stage.btn1': 'Deep Learning',
      'stage.btn2': 'MLOps',
      'stage.btn3': 'Quantum',
      'about.tag': 'À PROPOS',
      'about.title': 'À propos de moi',
      'about.subtitle': 'Allier rigueur scientifique, R&D en IA et industrialisation MLOps',
      'about.p1': "Étudiant en 2<sup>e</sup> année de cycle ingénieur à l'<strong>ESILV</strong> (Majeure Data & IA, English Track, avec une mineure en <strong>Quantum Computing</strong>), issu d'une classe préparatoire scientifique <strong>MPSI/MP</strong> (Lycée Claude Bernard) et enrichi d'un semestre d'échange académique à <strong>Hanyang University (Séoul)</strong>.",
      'about.p2': "Formé lors d'un premier stage en <strong>Data Science & MLOps chez Atos</strong>, je conçois des systèmes agentiques (orchestration d'agents LLM via l'API Mistral) ainsi que des pipelines MLOps complets (Python, FastAPI, Docker, Kubernetes, GitLab CI/CD). Habitué à collaborer en équipes pluridisciplinaires, j'aime autant l'exploration R&D que la traduction de besoins métiers en solutions IA fiables et industrialisées.",
      'about.c1.tag': 'International',
      'about.c1.title': 'Paris ↔ Séoul',
      'about.c1.desc': "Cursus ESILV en English Track complété par un semestre d'échange à Hanyang University (Corée du Sud).",
      'about.c2.tag': 'Langues',
      'about.c2.title': 'Trilingue en devenir',
      'about.c2.desc': 'Français (natif), Anglais courant (TOEIC 820 B2+) et Chinois (intermédiaire).',
      'about.c3.tag': 'Engagements',
      'about.c3.title': 'Leadership & Collectif',
      'about.c3.desc': "Délégué TD et membre de la commission de vie étudiante de l'ESILV, ex-représentant élu des classes prépa au conseil d'administration, membre Vinci Eco Drive et professeur chez Acadomia.",
      'about.c4.tag': 'Objectif 2027',
      'about.c4.title': 'Stage de 5 mois',
      'about.c4.desc': 'Disponible du 12 avril au 7 septembre 2027 en Recherche IA, Machine Learning, Data Science ou MLOps.',
      'exp.tag': 'EXPÉRIENCES',
      'exp.title': 'Expériences Professionnelles & Associatives',
      'exp.atos.type': 'Stage',
      'exp.atos.role': 'Data Scientist / MLOps Engineer',
      'exp.atos.date': 'Juil 2026 – Août 2026',
      'exp.atos.b1': "<strong>Modélisation :</strong> Optimisation d'un modèle GradientBoosting (<strong>ROC AUC : 0,865</strong>, <strong>Rappel : 78 %</strong>) via feature engineering et tuning d'hyperparamètres.",
      'exp.atos.b2': "<strong>API & Inférence :</strong> Développement d'une API REST Python (FastAPI) intégrant le service de scoring et l'interface utilisateur.",
      'exp.atos.b3': "<strong>MLOps & CI/CD :</strong> Conteneurisation (Docker), déploiement sur Kubernetes (Minikube) et automatisation des tests ML et du registre d'images (Nexus) via GitLab CI/CD.",
      'exp.vinci.type': 'Ingénierie Collaborative',
      'exp.vinci.role': 'Membre équipe Systèmes Embarqués',
      'exp.vinci.date': 'Oct 2025 – Présent',
      'exp.vinci.b1': 'Rédaction de benchmarks techniques (VCU — Vehicle Control Unit) pour le véhicule prototype.',
      'exp.vinci.b2': "Conception d'un PCB de volant sous <strong>KiCad</strong> dans un cadre d'ingénierie collaborative pluridisciplinaire.",
      'exp.acadomia.type': 'Enseignement',
      'exp.acadomia.role': 'Professeur Particulier (Mathématiques & Physique)',
      'exp.acadomia.date': 'Sep 2025 – Présent',
      'exp.acadomia.b1': 'Accompagnement pédagogique et vulgarisation de concepts scientifiques complexes auprès de 4 élèves de collège et lycée.',
      'proj.tag': 'PROJETS',
      'proj.title': 'Projets Publics en IA, Deep Learning & MLOps',
      'proj.anki.s2': '2. Matière',
      'proj.anki.s3': '3. Découpage',
      'proj.anki.s4': '4. Anki',
      'proj.anki.hint3d': 'Pipeline linéaire 4 agents • Glisser / Relancer',
      'proj.anki.btn3d': 'Exécuter',
      'proj.anki.date': 'Oct 2025 – Présent',
      'proj.anki.cat': 'IA Agentique • Mistral AI',
      'proj.anki.title': 'Générateur de cartes Anki (AnkiCardsGenerator)',
      'proj.anki.desc': "Pipeline Python linéaire à <strong>4 agents IA</strong> (API Mistral AI) : <strong>1. OCR</strong> du PDF (texte & schémas), <strong>2. Identification</strong> de la matière, <strong>3. Segmentation</strong> complète du cours en concepts clés, et <strong>4. Formatage</strong> en flashcards Anki LaTeX/HTML.",
      'proj.anki.m1': 'Pipeline séquentiel',
      'proj.anki.m2': 'LaTeX / HTML + Graphe',
      'proj.srgan.date': 'Mai 2024 – Août 2025',
      'proj.srgan.cat': 'Deep Learning • Computer Vision',
      'proj.srgan.title': "Super Résolution d'images par SRGAN",
      'proj.srgan.desc': "Conception from scratch et entraînement d'un <strong>Wasserstein SRGAN</strong> (TensorFlow / Keras, <strong>12,7M paramètres</strong>) pour la super-résolution <strong>×2 et ×4</strong> (comparaison conditionnel vs non-conditionnel) sur 1 254 images.",
      'proj.srgan.m3': 'Paramètres',
      'proj.alz.cat': 'Imagerie Médicale',
      'proj.alz.title': "Détection d'Alzheimer par IRM (OASIS-1)",
      'proj.alz.desc': 'EDA rigoureuse (split par patient anti-data-leakage) et modélisation Deep Learning (<strong>CNN 2D, Attention MIL 61 coupes, MobileNetV2 2.5D</strong>) sur <strong>86 437 coupes</strong> et 347 patients.',
      'proj.bob.cat': 'Data Science • Santé',
      'proj.bob.title': 'Parkinson MDS-UPDRS (Bobathon)',
      'proj.bob.desc': "Challenge <strong>Probabl × IBM × ESILV</strong> : prédiction et correction du biais d'évaluation du score moteur OFF MDS-UPDRS pour la maladie de Parkinson, suivi via <strong>Skore Hub</strong>.",
      'proj.churn.title': 'Détection de Churn (MLOps)',
      'proj.churn.desc': "Dépôt GitLab dédié à la prédiction de churn client : entraînement de modèles supervisés, service d'inférence et pratiques d'industrialisation MLOps / CI/CD.",
      'proj.view_github': 'Voir le dépôt GitHub',
      'skills.tag': 'COMPÉTENCES',
      'skills.title': 'Stack Technique & Savoir-faire',
      'skills.ai': 'Data Science & IA',
      'skills.agentic': 'Systèmes Agentiques',
      'skills.dev': 'Développement',
      'skills.mlops': 'MLOps & DevOps',
      'edu.tag': 'FORMATIONS',
      'edu.title': 'Parcours Académique',
      'edu.esilv.date': 'Sep 2025 – Août 2028',
      'edu.esilv.degree': 'Cycle Ingénieur Bac+5',
      'edu.esilv.major': 'Majeure Data & IA (English Track) • Paris La Défense',
      'edu.esilv.desc': 'Machine Learning, Deep Learning, MLOps, Cybersecurity, Mineure <strong>Quantum Computing</strong>, Mathematics. Délégué de groupe de TD et membre de la commission de vie étudiante.',
      'edu.hanyang.date': 'Mars 2026 – Juin 2026',
      'edu.hanyang.major': 'Academic Exchange Semester • Séoul, Corée du Sud',
      'edu.hanyang.desc': 'Signal Processing, Artificial Intelligence, Engineering Mathematics. Immersion académique internationale en anglais.',
      'edu.cpge.date': 'Sep 2023 – Juin 2025',
      'edu.cpge.major': 'CPGE Scientifique MPSI / MP (Option Informatique) • Paris',
      'edu.cpge.desc': "Reçu au concours <strong>CCINP avec 516 points</strong>. Délégué et représentant élu des classes préparatoires au conseil d'administration.",
      'contact.title': 'Discutons de votre prochain projet IA',
      'contact.desc': "Je recherche un <strong>stage de 5 mois (12 avril – 7 septembre 2027)</strong> en Recherche IA, Machine Learning, Data Science ou MLOps. N'hésitez pas à me contacter !",
      'footer.rights': 'Conçu avec soin & WebGL 3D.',
      'footer.top': '↑ Haut de page',
      'toast.copied': 'Email copié dans le presse-papiers !'
    },
    en: {
      'nav.about': 'About',
      'nav.experience': 'Experience',
      'nav.projects': 'Projects',
      'nav.skills': 'Skills',
      'nav.education': 'Education',
      'nav.contact': 'Contact',
      'nav.cv': 'Resume',
      'hero.status': 'Available — 5-month Internship (Apr 12 – Sep 7, 2027)',
      'hero.greeting': "Hi, I'm",
      'hero.desc': '<strong>Data & AI Engineering student at ESILV</strong>. I build <strong>agentic LLM systems</strong>, <strong>Deep Learning</strong> architectures, and production-ready <strong>end-to-end MLOps pipelines</strong>.',
      'hero.cta_projects': 'Explore my projects',
      'hero.cta_cv': 'Download Resume',
      'hero.hint': 'Drag to rotate',
      'stage.agents': 'System Architecture — AI Agent Orchestration',
      'stage.dl': 'Deep Learning — Neural Network',
      'stage.mlops': 'MLOps — Code → Container → Server',
      'stage.quantum': 'Quantum — Atom (Nucleus & Electrons)',
      'stage.btn0': 'Architecture',
      'stage.btn1': 'Deep Learning',
      'stage.btn2': 'MLOps',
      'stage.btn3': 'Quantum',
      'about.tag': 'ABOUT ME',
      'about.title': 'About Me',
      'about.subtitle': 'Bridging scientific rigor, AI R&D, and MLOps industrialization',
      'about.p1': 'Second-year engineering student at <strong>ESILV</strong> (Data & AI Major, English Track, with a <strong>Quantum Computing</strong> minor), following a scientific preparatory class <strong>MPSI/MP</strong> (Lycée Claude Bernard) and an academic exchange semester at <strong>Hanyang University (Seoul)</strong>.',
      'about.p2': 'Trained during a <strong>Data Science & MLOps internship at Atos</strong>, I design agentic AI systems (LLM agent orchestration via Mistral AI API) and full MLOps pipelines (Python, FastAPI, Docker, Kubernetes, GitLab CI/CD). Used to multidisciplinary teamwork, I thrive in both R&D exploration and turning business needs into reliable AI systems.',
      'about.c1.tag': 'International',
      'about.c1.title': 'Paris ↔ Seoul',
      'about.c1.desc': 'ESILV English Track engineering program complemented by an exchange semester at Hanyang University (South Korea).',
      'about.c2.tag': 'Languages',
      'about.c2.title': 'Multilingual Profile',
      'about.c2.desc': 'French (native), English (fluent — TOEIC 820 B2+), and Chinese (intermediate).',
      'about.c3.tag': 'Leadership',
      'about.c3.title': 'Team & Community',
      'about.c3.desc': 'ESILV class rep & Student Life Committee member, former elected CPGE representative to the Board of Governors, Vinci Eco Drive member, and Acadomia tutor.',
      'about.c4.tag': '2027 Goal',
      'about.c4.title': '5-Month Internship',
      'about.c4.desc': 'Available April 12 – September 7, 2027 in AI Research, Machine Learning, Data Science, or MLOps.',
      'exp.tag': 'EXPERIENCE',
      'exp.title': 'Professional & Collaborative Experience',
      'exp.atos.type': 'Internship',
      'exp.atos.role': 'Data Scientist / MLOps Engineer',
      'exp.atos.date': 'Jul 2026 – Aug 2026',
      'exp.atos.b1': '<strong>Modeling:</strong> Optimized a GradientBoosting model (<strong>ROC AUC: 0.865</strong>, <strong>Recall: 78%</strong>) through feature engineering and hyperparameter tuning.',
      'exp.atos.b2': '<strong>API & Inference:</strong> Built a Python REST API (FastAPI) integrating both the scoring service and user interface.',
      'exp.atos.b3': '<strong>MLOps & CI/CD:</strong> Containerization (Docker), Kubernetes (Minikube) deployment, and automated ML testing & image registry (Nexus) via GitLab CI/CD.',
      'exp.vinci.type': 'Collaborative Engineering',
      'exp.vinci.role': 'Embedded Systems Team Member',
      'exp.vinci.date': 'Oct 2025 – Present',
      'exp.vinci.b1': 'Authored technical benchmarks (VCU — Vehicle Control Unit) for the prototype vehicle.',
      'exp.vinci.b2': 'Designed a steering wheel PCB in <strong>KiCad</strong> within a multidisciplinary student engineering team.',
      'exp.acadomia.type': 'Teaching',
      'exp.acadomia.role': 'Private Tutor (Mathematics & Physics)',
      'exp.acadomia.date': 'Sep 2025 – Present',
      'exp.acadomia.b1': 'Mentored 4 middle and high school students, breaking down complex scientific concepts clearly.',
      'proj.tag': 'PROJECTS',
      'proj.title': 'Public Projects in AI, Deep Learning & MLOps',
      'proj.anki.s2': '2. Subject',
      'proj.anki.s3': '3. Segment',
      'proj.anki.s4': '4. Anki',
      'proj.anki.hint3d': 'Linear 4-agent pipeline • Drag / Replay',
      'proj.anki.btn3d': 'Run',
      'proj.anki.date': 'Oct 2025 – Present',
      'proj.anki.cat': 'Agentic AI • Mistral AI',
      'proj.anki.title': 'Anki Flashcard Generator (AnkiCardsGenerator)',
      'proj.anki.desc': 'Linear <strong>4-agent Python pipeline</strong> (Mistral AI API): <strong>1. OCR</strong> of the PDF (text & diagrams), <strong>2. Subject identification</strong>, <strong>3. Full-course segmentation</strong> into key concepts, and <strong>4. Formatting</strong> into LaTeX/HTML Anki flashcards.',
      'proj.anki.m1': 'Sequential pipeline',
      'proj.anki.m2': 'LaTeX / HTML + Graph',
      'proj.srgan.date': 'May 2024 – Aug 2025',
      'proj.srgan.cat': 'Deep Learning • Computer Vision',
      'proj.srgan.title': 'Image Super-Resolution with SRGAN',
      'proj.srgan.desc': 'From-scratch <strong>Wasserstein SRGAN</strong> (TensorFlow / Keras, <strong>12.7M parameters</strong>) trained for <strong>×2 and ×4</strong> super-resolution (conditional vs unconditional comparison) on 1,254 images.',
      'proj.srgan.m3': 'Parameters',
      'proj.alz.cat': 'Medical Imaging',
      'proj.alz.title': 'Alzheimer MRI Detection (OASIS-1)',
      'proj.alz.desc': 'Patient-level split EDA (anti-data-leakage) and Deep Learning modeling (<strong>2D CNN, 61-slice Attention MIL, 2.5D MobileNetV2</strong>) on <strong>86,437 slices</strong> across 347 patients.',
      'proj.bob.cat': 'Data Science • Healthcare',
      'proj.bob.title': 'Parkinson MDS-UPDRS (Bobathon)',
      'proj.bob.desc': '<strong>Probabl × IBM × ESILV</strong> challenge: predicting and correcting evaluation bias in OFF MDS-UPDRS motor scores for Parkinson’s disease, tracked with <strong>Skore Hub</strong>.',
      'proj.churn.title': 'Churn Detection (MLOps)',
      'proj.churn.desc': 'GitLab repository dedicated to customer churn prediction: supervised modeling, inference service, and MLOps / CI/CD engineering practices.',
      'proj.view_github': 'View GitHub repo',
      'skills.tag': 'SKILLS',
      'skills.title': 'Tech Stack & Capabilities',
      'skills.ai': 'Data Science & AI',
      'skills.agentic': 'Agentic Systems',
      'skills.dev': 'Development',
      'skills.mlops': 'MLOps & DevOps',
      'edu.tag': 'EDUCATION',
      'edu.title': 'Academic Background',
      'edu.esilv.date': 'Sep 2025 – Aug 2028',
      'edu.esilv.degree': "Master's in Engineering (Bac+5)",
      'edu.esilv.major': 'Data & AI Major (English Track) • Paris La Défense',
      'edu.esilv.desc': 'Machine Learning, Deep Learning, MLOps, Cybersecurity, <strong>Quantum Computing</strong> Minor, Mathematics. Class representative & Student Life Committee member.',
      'edu.hanyang.date': 'Mar 2026 – Jun 2026',
      'edu.hanyang.major': 'Academic Exchange Semester • Seoul, South Korea',
      'edu.hanyang.desc': 'Signal Processing, Artificial Intelligence, Engineering Mathematics. International English-taught exchange.',
      'edu.cpge.date': 'Sep 2023 – Jun 2025',
      'edu.cpge.major': 'CPGE MPSI / MP (Computer Science Track) • Paris',
      'edu.cpge.desc': 'Admitted to <strong>CCINP with 516 points</strong>. Class representative & elected preparatory classes representative to the Board of Governors.',
      'contact.title': "Let's build your next AI project",
      'contact.desc': 'Looking for a <strong>5-month internship (April 12 – September 7, 2027)</strong> in AI Research, Machine Learning, Data Science, or MLOps. Feel free to reach out!',
      'footer.rights': 'Crafted with care & 3D WebGL.',
      'footer.top': '↑ Back to top',
      'toast.copied': 'Email copied to clipboard!'
    }
  };

  function applyLanguage(lang) {
    currentLang = lang;
    document.documentElement.lang = lang;
    document.documentElement.dataset.lang = lang;

    const dict = I18N[lang];
    document.querySelectorAll('[data-i18n]').forEach((el) => {
      const key = el.getAttribute('data-i18n');
      if (dict[key]) el.innerHTML = dict[key];
    });

    document.querySelectorAll('.lang-opt').forEach((opt) => {
      opt.classList.toggle('active', opt.dataset.set === lang);
    });

    syncJumpToRole(roleIdx);
  }

  function initUIControls() {
    const langBtn = document.getElementById('langToggle');
    if (langBtn) {
      langBtn.addEventListener('click', () => applyLanguage(currentLang === 'fr' ? 'en' : 'fr'));
    }

    const menuBtn = document.getElementById('menuToggle');
    const mobileMenu = document.getElementById('mobileMenu');
    if (menuBtn && mobileMenu) {
      menuBtn.addEventListener('click', () => {
        const isOpen = mobileMenu.classList.toggle('open');
        menuBtn.classList.toggle('open', isOpen);
        menuBtn.setAttribute('aria-expanded', String(isOpen));
      });
      mobileMenu.querySelectorAll('a').forEach((a) => {
        a.addEventListener('click', () => {
          mobileMenu.classList.remove('open');
          menuBtn.classList.remove('open');
          menuBtn.setAttribute('aria-expanded', 'false');
        });
      });
    }

    const copyBtn = document.getElementById('copyEmailBtn');
    const toast = document.getElementById('toast');
    if (copyBtn && toast) {
      copyBtn.addEventListener('click', async () => {
        const email = 'tim.barselo@gmail.com';
        try {
          await navigator.clipboard.writeText(email);
        } catch {
          window.location.href = `mailto:${email}`;
        }
        toast.textContent = I18N[currentLang]['toast.copied'];
        toast.classList.add('show');
        setTimeout(() => toast.classList.remove('show'), 2600);
      });
    }

    const yearEl = document.getElementById('year');
    if (yearEl) yearEl.textContent = String(new Date().getFullYear());
  }

  /* ==================== BOOT ==================== */
  document.addEventListener('DOMContentLoaded', () => {
    initBackgroundField();
    initHero3DStage();
    initAnki3DScene();
    initSrgan2DPixelGrid();
    initTiltCards();
    initCursorAndScroll();
    initTypewriter();
    initUIControls();
  });
})();
