/* ==========================================================================
   black-widow-3d.js — [FASE 2] Viuva Negra Procedural em Three.js (GD // 26)
   - Modelo CAD mecanico/wireframe: carbono facetado, titanio, latao & rubi
   - Animacao da aranha descendo na teia de latao graduada ao entrar na secao
   - Projecao 3D -> 2D em tempo real das 8 extremidades das patas em variaveis CSS
     (--pata-1-x/y .. --pata-8-x/y) sincronizadas aos 8 nos de ferramentas
   ========================================================================== */

(() => {
  'use strict';

  // Modo estatico (?static=1) preserva o SVG CAD da Fase 1 para captura no Figma
  const isStaticCapture = new URLSearchParams(window.location.search).has('static');
  if (isStaticCapture) return;

  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  function initBlackWidow3D() {
    if (typeof window.THREE === 'undefined') return;

    const THREE = window.THREE;
    const section = document.getElementById('arsenal');
    const stage = section ? section.querySelector('.gd-arsenal-stage') : null;
    const viewport = stage ? stage.querySelector('.gd-spider-viewport') : null;
    const canvas = document.getElementById('black-widow-canvas');

    if (!section || !stage || !viewport || !canvas) return;

    // Inicializa WebGL com fallback silencioso para o SVG caso WebGL nao esteja disponivel
    let renderer;
    try {
      renderer = new THREE.WebGLRenderer({
        canvas,
        alpha: true,
        antialias: true,
        powerPreference: 'high-performance'
      });
    } catch (_err) {
      return;
    }

    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.outputEncoding = THREE.sRGBEncoding;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.18;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(34, 1200 / 560, 0.1, 60);
    camera.position.set(0, 0, 12.6);
    camera.lookAt(0, 0, 0);

    /* ----------------------------------------------------------------------
       1. Iluminacao de Estudio (Carbono, Titanio & Latao Tecnico)
       ---------------------------------------------------------------------- */
    const ambientLight = new THREE.AmbientLight(0xd4d4d8, 0.62);
    scene.add(ambientLight);

    const keyLight = new THREE.DirectionalLight(0xf8fafc, 1.9);
    keyLight.position.set(-5.5, 6.5, 9.5);
    scene.add(keyLight);

    const brassRimLight = new THREE.DirectionalLight(0xd9a441, 1.55);
    brassRimLight.position.set(6.5, -3.5, 5.5);
    scene.add(brassRimLight);

    const topSpotLight = new THREE.PointLight(0xfff0cc, 1.25, 22);
    topSpotLight.position.set(0, 5.2, 5.5);
    scene.add(topSpotLight);

    const fillLight = new THREE.DirectionalLight(0x94a3b8, 0.65);
    fillLight.position.set(0, -6, 6);
    scene.add(fillLight);

    /* ----------------------------------------------------------------------
       2. Materiais Procedurais (Trama de Fibra de Carbono, Titanio, Latao, Rubi)
       ---------------------------------------------------------------------- */
    function createCarbonTexture() {
      const texCanvas = document.createElement('canvas');
      texCanvas.width = 128;
      texCanvas.height = 128;
      const ctx = texCanvas.getContext('2d');

      ctx.fillStyle = '#131317';
      ctx.fillRect(0, 0, 128, 128);

      const cell = 8;
      for (let y = 0; y < 128; y += cell) {
        for (let x = 0; x < 128; x += cell) {
          const even = ((x + y) / cell) % 2 === 0;
          ctx.fillStyle = even ? '#1e1e24' : '#0d0d11';
          ctx.fillRect(x, y, cell, cell);
          ctx.fillStyle = even ? 'rgba(244,244,245,0.08)' : 'rgba(255,255,255,0.02)';
          ctx.fillRect(x, y, cell, 2);
        }
      }

      const texture = new THREE.CanvasTexture(texCanvas);
      texture.wrapS = THREE.RepeatWrapping;
      texture.wrapT = THREE.RepeatWrapping;
      texture.repeat.set(5, 5);
      return texture;
    }

    const carbonTex = createCarbonTexture();

    const carbonMat = new THREE.MeshStandardMaterial({
      color: 0x202027,
      map: carbonTex,
      bumpMap: carbonTex,
      bumpScale: 0.035,
      metalness: 0.72,
      roughness: 0.36,
      flatShading: true
    });

    const titaniumMat = new THREE.MeshStandardMaterial({
      color: 0xb8bcc4,
      metalness: 0.88,
      roughness: 0.24
    });

    const darkSteelMat = new THREE.MeshStandardMaterial({
      color: 0x2a2a32,
      metalness: 0.82,
      roughness: 0.38
    });

    const brassMat = new THREE.MeshStandardMaterial({
      color: 0xd9a441,
      metalness: 0.9,
      roughness: 0.22
    });

    const rubyMat = new THREE.MeshStandardMaterial({
      color: 0xc81e3a,
      emissive: 0x5c0a18,
      emissiveIntensity: 0.55,
      metalness: 0.35,
      roughness: 0.2,
      flatShading: true
    });

    const wireframeMat = new THREE.LineBasicMaterial({
      color: 0xe4e4e7,
      transparent: true,
      opacity: 0.44
    });

    const silkMat = new THREE.MeshBasicMaterial({
      color: 0xd9a441,
      transparent: true,
      opacity: 0.92
    });

    const silkTickMat = new THREE.LineBasicMaterial({
      color: 0xd9a441,
      transparent: true,
      opacity: 0.65
    });

    /* ----------------------------------------------------------------------
       3. Teia Vertical em Latao Graduado (Estica durante a descida)
       ---------------------------------------------------------------------- */
    const SILK_TOP_Y = 5.4;
    const silkGroup = new THREE.Group();
    scene.add(silkGroup);

    const silkLineGeom = new THREE.CylinderGeometry(0.015, 0.015, 1, 8);
    const silkLineMesh = new THREE.Mesh(silkLineGeom, silkMat);
    silkGroup.add(silkLineMesh);

    // Marcacoes graduadas CAD ao longo do fio da teia
    const MAX_TICKS = 42;
    const tickPositions = new Float32Array(MAX_TICKS * 2 * 3);
    const tickGeom = new THREE.BufferGeometry();
    tickGeom.setAttribute('position', new THREE.BufferAttribute(tickPositions, 3));
    const silkTicks = new THREE.LineSegments(tickGeom, silkTickMat);
    silkGroup.add(silkTicks);

    // Micro-teia radial discreta presa ao ponto de ancoragem no topo
    const anchorRingGeom = new THREE.RingGeometry(0.05, 0.085, 16);
    const anchorRing = new THREE.Mesh(anchorRingGeom, silkMat);
    anchorRing.position.set(0, 3.72, -0.05);
    silkGroup.add(anchorRing);

    function updateSilkThread(attachWorldPos) {
      const topY = SILK_TOP_Y;
      const bottomY = attachWorldPos.y;
      const length = Math.max(0.05, topY - bottomY);

      silkLineMesh.scale.set(1, length, 1);
      silkLineMesh.position.set(
        attachWorldPos.x * 0.5,
        bottomY + length * 0.5,
        attachWorldPos.z
      );

      // Leve inclinacao caso a aranha oscile lateralmente na teia
      const dx = attachWorldPos.x;
      silkLineMesh.rotation.z = Math.atan2(dx, length);

      // Atualiza os ticks graduados do fio do topo ate o ponto de ancoragem no abdomen
      const spacing = 0.16;
      const posAttr = tickGeom.attributes.position;
      for (let i = 0; i < MAX_TICKS; i += 1) {
        const y = topY - 0.15 - i * spacing;
        const idx = i * 6;
        if (y > bottomY + 0.06) {
          const t = (topY - y) / length;
          const cx = attachWorldPos.x * t;
          const tickLen = i % 3 === 0 ? 0.12 : 0.065;
          tickPositions[idx] = cx;
          tickPositions[idx + 1] = y;
          tickPositions[idx + 2] = attachWorldPos.z;
          tickPositions[idx + 3] = cx + tickLen;
          tickPositions[idx + 4] = y;
          tickPositions[idx + 5] = attachWorldPos.z;
        } else {
          tickPositions[idx] = 0;
          tickPositions[idx + 1] = topY + 2;
          tickPositions[idx + 2] = 0;
          tickPositions[idx + 3] = 0;
          tickPositions[idx + 4] = topY + 2;
          tickPositions[idx + 5] = 0;
        }
      }
      posAttr.needsUpdate = true;
    }

    /* ----------------------------------------------------------------------
       4. Geometria da Viuva Negra Mecanica (Corpo Facetado + Ampulheta Rubi)
       ---------------------------------------------------------------------- */
    const spiderGroup = new THREE.Group();
    scene.add(spiderGroup);

    const bodyGroup = new THREE.Group();
    spiderGroup.add(bodyGroup);

    // 4a. Abdomen facetado em carbono (parte superior — descendo de cabeca para baixo)
    const abdomenGeom = new THREE.IcosahedronGeometry(1.02, 1);
    abdomenGeom.scale(0.95, 1.14, 0.86);
    const abdomenMesh = new THREE.Mesh(abdomenGeom, carbonMat);
    abdomenMesh.position.set(0, 0.96, -0.1);
    bodyGroup.add(abdomenMesh);

    const abdomenWire = new THREE.LineSegments(
      new THREE.EdgesGeometry(abdomenGeom, 12),
      wireframeMat
    );
    abdomenMesh.add(abdomenWire);

    // Fiandeira / terminal em latao onde a teia conecta
    const spinneret = new THREE.Mesh(
      new THREE.CylinderGeometry(0.08, 0.14, 0.18, 8),
      brassMat
    );
    spinneret.position.set(0, 2.1, -0.1);
    bodyGroup.add(spinneret);

    const silkAttachAnchor = new THREE.Object3D();
    silkAttachAnchor.position.set(0, 2.16, -0.1);
    bodyGroup.add(silkAttachAnchor);

    // 4b. Pedicelo (anel de acoplamento mecanico em latao)
    const pedicel = new THREE.Mesh(
      new THREE.CylinderGeometry(0.24, 0.2, 0.24, 12),
      brassMat
    );
    pedicel.position.set(0, -0.02, 0.06);
    bodyGroup.add(pedicel);

    // 4c. Cefalotorax facetado (parte inferior)
    const thoraxGeom = new THREE.IcosahedronGeometry(0.66, 1);
    thoraxGeom.scale(0.94, 1.06, 0.84);
    const thoraxMesh = new THREE.Mesh(thoraxGeom, carbonMat);
    thoraxMesh.position.set(0, -0.46, 0.18);
    bodyGroup.add(thoraxMesh);

    const thoraxWire = new THREE.LineSegments(
      new THREE.EdgesGeometry(thoraxGeom, 12),
      wireframeMat
    );
    thoraxMesh.add(thoraxWire);

    // 4d. Queliceras / Mandibulas mecanicas angulares na extremidade inferior
    [-1, 1].forEach((side) => {
      const fangGeom = new THREE.ConeGeometry(0.11, 0.44, 5);
      const fang = new THREE.Mesh(fangGeom, darkSteelMat);
      fang.position.set(side * 0.18, -1.2, 0.34);
      fang.rotation.z = side * 0.22;
      fang.rotation.x = Math.PI - 0.18;
      bodyGroup.add(fang);

      const fangWire = new THREE.LineSegments(
        new THREE.EdgesGeometry(fangGeom, 10),
        wireframeMat
      );
      fang.add(fangWire);

      // Micro-anel de latao na base da quelicera
      const fangRing = new THREE.Mesh(
        new THREE.TorusGeometry(0.085, 0.022, 8, 16),
        brassMat
      );
      fangRing.position.set(side * 0.2, -1.01, 0.35);
      fangRing.rotation.x = Math.PI * 0.45;
      bodyGroup.add(fangRing);
    });

    // 4e. Ampulheta Rubi (#C81E3A — uso exclusivo neste emblema)
    const hgShape = new THREE.Shape();
    hgShape.moveTo(-0.21, 0.3);
    hgShape.lineTo(0.21, 0.3);
    hgShape.lineTo(0.065, 0);
    hgShape.lineTo(0.21, -0.3);
    hgShape.lineTo(-0.21, -0.3);
    hgShape.lineTo(-0.065, 0);
    hgShape.closePath();

    const hgGeom = new THREE.ExtrudeGeometry(hgShape, {
      depth: 0.08,
      bevelEnabled: true,
      bevelThickness: 0.025,
      bevelSize: 0.02,
      bevelSegments: 2
    });
    hgGeom.center();

    const hourglassMesh = new THREE.Mesh(hgGeom, rubyMat);
    hourglassMesh.position.set(0, -0.46, 0.76);
    bodyGroup.add(hourglassMesh);

    const hgWire = new THREE.LineSegments(
      new THREE.EdgesGeometry(hgGeom, 20),
      new THREE.LineBasicMaterial({ color: 0xf4f4f5, transparent: true, opacity: 0.4 })
    );
    hourglassMesh.add(hgWire);

    const rubyGlow = new THREE.PointLight(0xc81e3a, 0.65, 3.2);
    rubyGlow.position.set(0, -0.46, 1.25);
    bodyGroup.add(rubyGlow);

    /* ----------------------------------------------------------------------
       5. 8 Patas Mecanicas Articuladas + Ancoras de Projecao (--pata-1..8)
       Ordem exata:
         1..4 = Esquerda (topo -> base): JAVA, PYTHON, SQL, FIGMA
         5..8 = Direita  (topo -> base): GIT & GITHUB, HTML & CSS, LINUX, GEMINI
       ---------------------------------------------------------------------- */
    const UP_AXIS = new THREE.Vector3(0, 1, 0);

    function orientLimbBetween(mesh, a, b) {
      const dir = new THREE.Vector3().subVectors(b, a);
      const len = dir.length();
      mesh.position.copy(a).addScaledVector(dir, 0.5);
      mesh.scale.set(1, Math.max(len, 0.001), 1);
      mesh.quaternion.setFromUnitVectors(UP_AXIS, dir.normalize());
    }

    const baseLegsConfig = [
      // Esquerda (side = -1): 1 JAVA, 2 PYTHON, 3 SQL, 4 FIGMA
      {
        side: -1,
        phase: 0.0,
        delay: 0.0,
        hip: new THREE.Vector3(-0.56, -0.18, 0.16),
        kneeOpen: new THREE.Vector3(-1.42, 1.56, 1.08),
        tipOpen: new THREE.Vector3(-2.52, 2.02, 0.25),
        kneeFold: new THREE.Vector3(-0.98, 2.15, 0.72),
        tipFold: new THREE.Vector3(-1.28, 3.05, 0.15)
      },
      {
        side: -1,
        phase: 1.1,
        delay: 0.08,
        hip: new THREE.Vector3(-0.62, -0.38, 0.24),
        kneeOpen: new THREE.Vector3(-1.82, 0.9, 1.32),
        tipOpen: new THREE.Vector3(-2.92, 0.58, 0.42),
        kneeFold: new THREE.Vector3(-1.12, 1.35, 0.85),
        tipFold: new THREE.Vector3(-1.48, 2.12, 0.22)
      },
      {
        side: -1,
        phase: 2.2,
        delay: 0.16,
        hip: new THREE.Vector3(-0.58, -0.62, 0.24),
        kneeOpen: new THREE.Vector3(-1.62, -0.02, 1.3),
        tipOpen: new THREE.Vector3(-2.52, -0.96, 0.38),
        kneeFold: new THREE.Vector3(-1.08, 0.42, 0.82),
        tipFold: new THREE.Vector3(-1.42, 1.08, 0.2)
      },
      {
        side: -1,
        phase: 3.3,
        delay: 0.24,
        hip: new THREE.Vector3(-0.46, -0.84, 0.18),
        kneeOpen: new THREE.Vector3(-1.22, -0.84, 1.08),
        tipOpen: new THREE.Vector3(-1.94, -2.48, 0.2),
        kneeFold: new THREE.Vector3(-0.92, -0.45, 0.72),
        tipFold: new THREE.Vector3(-1.18, -1.25, 0.15)
      }
    ];

    // Espelha com simetria de precisao para as 4 patas da direita (5..8)
    const allLegsConfig = [
      ...baseLegsConfig,
      ...baseLegsConfig.map((cfg, idx) => ({
        side: 1,
        phase: cfg.phase + 0.55,
        delay: cfg.delay + 0.03,
        hip: new THREE.Vector3(-cfg.hip.x, cfg.hip.y, cfg.hip.z),
        kneeOpen: new THREE.Vector3(-cfg.kneeOpen.x, cfg.kneeOpen.y, cfg.kneeOpen.z),
        tipOpen: new THREE.Vector3(-cfg.tipOpen.x, cfg.tipOpen.y, cfg.tipOpen.z),
        kneeFold: new THREE.Vector3(-cfg.kneeFold.x, cfg.kneeFold.y, cfg.kneeFold.z),
        tipFold: new THREE.Vector3(-cfg.tipFold.x, cfg.tipFold.y, cfg.tipFold.z),
        mirrorIndex: idx
      }))
    ];

    const femurGeom = new THREE.CylinderGeometry(0.068, 0.095, 1, 10);
    const tibiaGeom = new THREE.CylinderGeometry(0.032, 0.066, 1, 10);
    const pistonGeom = new THREE.CylinderGeometry(0.018, 0.018, 1, 6);
    const hipJointGeom = new THREE.SphereGeometry(0.115, 14, 14);
    const kneeJointGeom = new THREE.SphereGeometry(0.145, 16, 16);
    const kneeCollarGeom = new THREE.TorusGeometry(0.155, 0.028, 8, 18);
    const tipBallGeom = new THREE.SphereGeometry(0.068, 12, 12);
    const tipRingGeom = new THREE.TorusGeometry(0.088, 0.018, 8, 16);

    const legs = allLegsConfig.map((cfg) => {
      const legGroup = new THREE.Group();
      spiderGroup.add(legGroup);

      const hipJoint = new THREE.Mesh(hipJointGeom, brassMat);
      hipJoint.position.copy(cfg.hip);
      legGroup.add(hipJoint);

      const femur = new THREE.Mesh(femurGeom, titaniumMat);
      legGroup.add(femur);

      const piston = new THREE.Mesh(pistonGeom, darkSteelMat);
      legGroup.add(piston);

      const kneeJoint = new THREE.Mesh(kneeJointGeom, brassMat);
      legGroup.add(kneeJoint);

      const kneeCollar = new THREE.Mesh(kneeCollarGeom, darkSteelMat);
      kneeJoint.add(kneeCollar);

      const tibia = new THREE.Mesh(tibiaGeom, titaniumMat);
      legGroup.add(tibia);

      const tipAnchor = new THREE.Object3D();
      legGroup.add(tipAnchor);

      const tipBall = new THREE.Mesh(tipBallGeom, titaniumMat);
      tipAnchor.add(tipBall);

      const tipRing = new THREE.Mesh(tipRingGeom, brassMat);
      tipAnchor.add(tipRing);

      return {
        cfg,
        hipJoint,
        femur,
        piston,
        kneeJoint,
        tibia,
        tipAnchor,
        kneePos: new THREE.Vector3(),
        tipPos: new THREE.Vector3(),
        pistonStart: new THREE.Vector3(),
        pistonEnd: new THREE.Vector3()
      };
    });

    /* ----------------------------------------------------------------------
       6. Maquina de Estados da Animacao: Descida na Teia + Idle & Paralaxe
       ---------------------------------------------------------------------- */
    const DESCENT_START_Y = 5.6;
    const DESCENT_DURATION_MS = 2150;

    let hasStartedDescent = prefersReducedMotion;
    let descentStartTime = 0;
    let descentProgress = prefersReducedMotion ? 1 : 0;
    let isSectionVisible = false;
    let isNodeHovered = false;

    const pointerTarget = { x: 0, y: 0 };
    const pointerSmooth = { x: 0, y: 0 };

    // Trava de precisao quando o cursor inspeciona qualquer no (para o botao nao fugir)
    const nodeEls = stage.querySelectorAll('.gd-arsenal-node');
    nodeEls.forEach((nodeEl) => {
      nodeEl.addEventListener('pointerenter', () => {
        isNodeHovered = true;
      });
      nodeEl.addEventListener('pointerleave', () => {
        isNodeHovered = false;
      });
      nodeEl.addEventListener('focusin', () => {
        isNodeHovered = true;
      });
      nodeEl.addEventListener('focusout', () => {
        isNodeHovered = false;
      });
    });

    section.addEventListener('pointermove', (event) => {
      if (prefersReducedMotion) return;
      const rect = section.getBoundingClientRect();
      const nx = ((event.clientX - rect.left) / rect.width) * 2 - 1;
      const ny = ((event.clientY - rect.top) / rect.height) * 2 - 1;
      pointerTarget.x = Math.max(-1, Math.min(1, nx));
      pointerTarget.y = Math.max(-1, Math.min(1, ny));
    });

    section.addEventListener('pointerleave', () => {
      pointerTarget.x = 0;
      pointerTarget.y = 0;
    });

    function easeOutCubic(t) {
      return 1 - Math.pow(1 - t, 3);
    }

    function easeOutBackSoft(t) {
      const c1 = 0.85;
      const c3 = c1 + 1;
      return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2);
    }

    /* ----------------------------------------------------------------------
       7. Redimensionamento & Projecao 3D -> Variaveis CSS (--pata-1..8)
       ---------------------------------------------------------------------- */
    const worldVec = new THREE.Vector3();
    const attachWorldVec = new THREE.Vector3();

    function resizeRenderer() {
      const width = viewport.clientWidth || 1200;
      const height = viewport.clientHeight || 560;
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
      renderer.setSize(width, height, false);
    }

    function projectLegsToCssVariables() {
      // No mobile/tablet (<= 991.98px) os nos ficam em grade estatica abaixo do palco
      if (window.innerWidth <= 991.98) return;

      spiderGroup.updateMatrixWorld(true);

      for (let i = 0; i < legs.length; i += 1) {
        worldVec.setFromMatrixPosition(legs[i].tipAnchor.matrixWorld);
        worldVec.project(camera);

        const xPct = (worldVec.x * 0.5 + 0.5) * 100;
        const yPct = (-worldVec.y * 0.5 + 0.5) * 100;

        stage.style.setProperty(`--pata-${i + 1}-x`, `${xPct.toFixed(2)}%`);
        stage.style.setProperty(`--pata-${i + 1}-y`, `${yPct.toFixed(2)}%`);
      }
    }

    function updatePose(nowMs) {
      const timeSec = nowMs * 0.001;

      if (hasStartedDescent && descentProgress < 1) {
        if (!descentStartTime) descentStartTime = nowMs;
        descentProgress = Math.min((nowMs - descentStartTime) / DESCENT_DURATION_MS, 1);
      }

      // 1) Posicao vertical da descida na teia + leve amortecimento pendular
      const dropEase = prefersReducedMotion ? 1 : easeOutBackSoft(descentProgress);
      const baseY = DESCENT_START_Y * (1 - dropEase);

      // Balanco pendular sutil durante e logo apos a descida + respiracao leve no idle
      const swayDamp = isNodeHovered ? 0.12 : 1;
      const descentSwing =
        !prefersReducedMotion && descentProgress < 1
          ? Math.sin(descentProgress * Math.PI * 2.5) * (1 - descentProgress) * 0.14
          : 0;
      const idleFloatY = prefersReducedMotion ? 0 : Math.sin(timeSec * 1.45) * 0.055 * swayDamp;
      const idleSwingX = prefersReducedMotion ? 0 : Math.sin(timeSec * 0.85) * 0.035 * swayDamp;

      spiderGroup.position.set(idleSwingX + descentSwing, baseY + idleFloatY, 0);

      // 2) Paralaxe 3D sutil acompanhando o ponteiro (amortecida durante inspecao de no)
      const parallaxFactor = isNodeHovered ? 0.25 : 1;
      pointerSmooth.x += (pointerTarget.x * parallaxFactor - pointerSmooth.x) * 0.06;
      pointerSmooth.y += (pointerTarget.y * parallaxFactor - pointerSmooth.y) * 0.06;

      const descentPitch = (1 - easeOutCubic(descentProgress)) * 0.42;
      spiderGroup.rotation.y = pointerSmooth.x * 0.14;
      spiderGroup.rotation.x = pointerSmooth.y * 0.09 + descentPitch;
      spiderGroup.rotation.z = -(idleSwingX + descentSwing) * 0.35;

      // 3) Desdobramento progressivo das 8 patas + micro-oscilacao organica/mecanica
      const legOscAmp = prefersReducedMotion ? 0 : (isNodeHovered ? 0.008 : 0.042);

      for (let i = 0; i < legs.length; i += 1) {
        const leg = legs[i];
        const { cfg } = leg;

        const localOpenRaw = Math.max(
          0,
          Math.min(1, (descentProgress - cfg.delay * 0.55) / (1 - cfg.delay * 0.55))
        );
        const openT = prefersReducedMotion ? 1 : easeOutCubic(localOpenRaw);

        leg.kneePos.lerpVectors(cfg.kneeFold, cfg.kneeOpen, openT);
        leg.tipPos.lerpVectors(cfg.tipFold, cfg.tipOpen, openT);

        // Micro-movimento articulado em fase distinta por pata
        if (openT > 0.7) {
          const oscY = Math.sin(timeSec * 1.9 + cfg.phase) * legOscAmp;
          const oscZ = Math.cos(timeSec * 1.5 + cfg.phase) * legOscAmp * 1.2;
          leg.kneePos.y += oscY * 1.4;
          leg.kneePos.z += oscZ;
          leg.tipPos.y += oscY * 0.55;
        }

        // Orienta femur, pistao, joelho, tibia e ancora da ponta
        orientLimbBetween(leg.femur, cfg.hip, leg.kneePos);

        leg.pistonStart.copy(cfg.hip).add(new THREE.Vector3(0, 0.09, -0.07));
        leg.pistonEnd.copy(leg.kneePos).add(new THREE.Vector3(0, -0.06, -0.09));
        orientLimbBetween(leg.piston, leg.pistonStart, leg.pistonEnd);

        leg.kneeJoint.position.copy(leg.kneePos);
        orientLimbBetween(leg.tibia, leg.kneePos, leg.tipPos);
        leg.tipAnchor.position.copy(leg.tipPos);
      }

      // 4) Atualiza o fio da teia de latao conectando o topo ao topo do abdomen
      spiderGroup.updateMatrixWorld(true);
      attachWorldVec.setFromMatrixPosition(silkAttachAnchor.matrixWorld);
      updateSilkThread(attachWorldVec);

      // 5) Fade-in coordenado dos 8 nos quando as patas se abrem na descida
      const nodeReveal = prefersReducedMotion
        ? 1
        : Math.max(0, Math.min(1, (descentProgress - 0.52) / 0.38));
      stage.style.setProperty('--nodes-reveal', nodeReveal.toFixed(3));

      // 6) Projeta as 8 extremidades das patas nas variaveis CSS --pata-1..8
      projectLegsToCssVariables();
    }

    /* ----------------------------------------------------------------------
       8. Loop de Renderizacao Econômico (Ativo somente quando #arsenal visivel)
       ---------------------------------------------------------------------- */
    let rafId = 0;

    function renderFrame(nowMs) {
      updatePose(nowMs);
      renderer.render(scene, camera);

      if (!prefersReducedMotion && isSectionVisible) {
        rafId = window.requestAnimationFrame(renderFrame);
      } else {
        rafId = 0;
      }
    }

    function startLoop() {
      if (!rafId) {
        rafId = window.requestAnimationFrame(renderFrame);
      }
    }

    function stopLoop() {
      if (rafId) {
        window.cancelAnimationFrame(rafId);
        rafId = 0;
      }
    }

    // Ativa o modo 3D (esconde somente a aranha SVG fallback, preservando aneis CAD)
    stage.classList.add('is-3d-active');
    resizeRenderer();

    // Render inicial (pose pronta ou no topo pronta para descer)
    updatePose(performance.now());
    renderer.render(scene, camera);

    if ('IntersectionObserver' in window) {
      const visibilityObserver = new IntersectionObserver(
        (entries) => {
          const entry = entries[0];
          isSectionVisible = entry.isIntersecting;

          if (isSectionVisible) {
            if (!hasStartedDescent) {
              hasStartedDescent = true;
              descentStartTime = 0;
            }
            if (prefersReducedMotion) {
              updatePose(performance.now());
              renderer.render(scene, camera);
            } else {
              startLoop();
            }
          } else {
            stopLoop();
          }
        },
        { threshold: 0.15 }
      );

      visibilityObserver.observe(section);
    } else {
      isSectionVisible = true;
      hasStartedDescent = true;
      startLoop();
    }

    window.addEventListener('resize', () => {
      resizeRenderer();
      updatePose(performance.now());
      renderer.render(scene, camera);
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initBlackWidow3D);
  } else {
    initBlackWidow3D();
  }
})();
