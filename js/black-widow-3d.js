/* ==========================================================================
   black-widow-3d.js — [FASE 2] Viuva Negra Procedural High-Detail (GD // 26)
   - Modelo CAD mecanico de alta fidelidade:
     * Ambiente de estudio procedural (PMREM) para reflexos metalicos reais
     * Abdomen e cefalotorax esculpidos em fibra de carbono facetada + placas
       de blindagem + wireframe titanio + fiandeira usinada + 8 lentes opticas
     * Ampulheta Rubi (#C81E3A) extrudada em moldura chanfrada de latao/titanio
     * Pedipalpos e queliceras articuladas
     * 8 patas de 3 segmentos (femur blindado + pistao hidraulico, patela/joelho
       em latao com colarinho duplo, tibia + tendao, tornozelo/metatarso e tarso)
   - Animacao cinematografica descendo na teia de latao graduada + teia CAD 3D
   - Projecao 3D -> 2D em tempo real nas variaveis --pata-1-x/y .. --pata-8-x/y
   ========================================================================== */

(() => {
  'use strict';

  // Coordenadas estaticas padrao dos 8 nos (usadas quando o Modo Sem Aranha e ativado)
  const SAFE_MODE_COORDS = [
    ['34.58%', '22.86%'],
    ['32.08%', '42.14%'],
    ['34.58%', '62.86%'],
    ['38.00%', '83.57%'],
    ['65.42%', '22.86%'],
    ['67.92%', '42.14%'],
    ['65.42%', '62.86%'],
    ['62.00%', '83.57%']
  ];

  let isArachnophobiaSafe = false;
  let onArachnophobiaToggleHook = null;

  function initArachnophobiaToggle() {
    const buttons = document.querySelectorAll('[data-arachnophobia-toggle], #gdArachnophobiaToggle');
    const stage = document.querySelector('#arsenal .gd-arsenal-stage');
    if (!buttons.length || !stage) return;

    const applySafeState = (safeActive) => {
      isArachnophobiaSafe = Boolean(safeActive);
      stage.classList.toggle('is-arachnophobia-safe', isArachnophobiaSafe);

      buttons.forEach((btn) => {
        btn.setAttribute('aria-pressed', String(isArachnophobiaSafe));
        const textSpan = btn.querySelector('.gd-arachnophobia-text');
        if (textSpan) {
          textSpan.textContent = isArachnophobiaSafe
            ? (textSpan.dataset.labelActive || 'MODO SEM ARANHA ATIVO // RESTAURAR ARANHA 3D')
            : (textSpan.dataset.labelDefault || 'AVISO DE ARACNOFOBIA // OCULTAR ARANHA');
        }
      });

      if (isArachnophobiaSafe) {
        stage.style.setProperty('--nodes-reveal', '1');
        SAFE_MODE_COORDS.forEach(([x, y], idx) => {
          stage.style.setProperty(`--pata-${idx + 1}-x`, x);
          stage.style.setProperty(`--pata-${idx + 1}-y`, y);
        });
      }

      if (typeof onArachnophobiaToggleHook === 'function') {
        onArachnophobiaToggleHook(isArachnophobiaSafe);
      }
    };

    buttons.forEach((btn) => {
      btn.addEventListener('click', () => {
        applySafeState(!isArachnophobiaSafe);
      });
    });
  }

  // Modo estatico (?static=1) preserva o SVG CAD da Fase 1 para captura no Figma
  const isStaticCapture = new URLSearchParams(window.location.search).has('static');
  if (isStaticCapture) {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', initArachnophobiaToggle);
    } else {
      initArachnophobiaToggle();
    }
    return;
  }

  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  function initBlackWidow3D() {
    initArachnophobiaToggle();

    if (typeof window.THREE === 'undefined') return;

    const THREE = window.THREE;
    const section = document.getElementById('arsenal');
    const stage = section ? section.querySelector('.gd-arsenal-stage') : null;
    const viewport = stage ? stage.querySelector('.gd-spider-viewport') : null;
    const canvas = document.getElementById('black-widow-canvas');

    if (!section || !stage || !viewport || !canvas) return;

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
    renderer.toneMappingExposure = 1.24;

    const scene = new THREE.Scene();

    // Camera mais proxima para dar escala imponente e riqueza de detalhes no palco
    const camera = new THREE.PerspectiveCamera(35, 1260 / 620, 0.1, 60);
    camera.position.set(0, -0.05, 10.6);
    camera.lookAt(0, -0.05, 0);

    const UP_AXIS = new THREE.Vector3(0, 1, 0);
    const _dirVec = new THREE.Vector3();

    function orientLimbBetween(mesh, a, b) {
      _dirVec.subVectors(b, a);
      const len = _dirVec.length();
      mesh.position.copy(a).addScaledVector(_dirVec, 0.5);
      mesh.scale.set(1, Math.max(len, 0.001), 1);
      mesh.quaternion.setFromUnitVectors(UP_AXIS, _dirVec.normalize());
    }

    /* ----------------------------------------------------------------------
       1. Ambiente de Estudio Procedural (PMREM EnvMap) + Iluminacao 5 Pontos
       ---------------------------------------------------------------------- */
    function createStudioEnvMap() {
      if (!THREE.PMREMGenerator) return null;
      const pmrem = new THREE.PMREMGenerator(renderer);
      const envScene = new THREE.Scene();
      envScene.background = new THREE.Color(0x0b0b0f);

      const panelGeo = new THREE.PlaneGeometry(10, 4);

      // Softbox principal superior fria (reflexo titanio)
      const topPanel = new THREE.Mesh(
        panelGeo,
        new THREE.MeshBasicMaterial({ color: 0xffffff, side: THREE.DoubleSide })
      );
      topPanel.position.set(-2, 7, 4);
      topPanel.lookAt(0, 0, 0);
      envScene.add(topPanel);

      // Faixa lateral direita em latao quente (reflexo dourado nas juntas)
      const brassPanel = new THREE.Mesh(
        new THREE.PlaneGeometry(8, 3.2),
        new THREE.MeshBasicMaterial({ color: 0xf4c86a, side: THREE.DoubleSide })
      );
      brassPanel.position.set(8, 1.5, 3);
      brassPanel.lookAt(0, 0, 0);
      envScene.add(brassPanel);

      // Contra-luz esquerda prateada
      const leftRim = new THREE.Mesh(
        new THREE.PlaneGeometry(7, 3),
        new THREE.MeshBasicMaterial({ color: 0xd4d8e2, side: THREE.DoubleSide })
      );
      leftRim.position.set(-8.5, -1, 2.5);
      leftRim.lookAt(0, 0, 0);
      envScene.add(leftRim);

      // Rebatedor inferior sutil
      const floorBounce = new THREE.Mesh(
        new THREE.PlaneGeometry(12, 8),
        new THREE.MeshBasicMaterial({ color: 0x3b3528, side: THREE.DoubleSide })
      );
      floorBounce.position.set(0, -7, 2);
      floorBounce.lookAt(0, 0, 0);
      envScene.add(floorBounce);

      const envRT = pmrem.fromScene(envScene, 0.04);
      pmrem.dispose();
      return envRT.texture;
    }

    const studioEnv = createStudioEnvMap();
    if (studioEnv) {
      scene.environment = studioEnv;
    }

    scene.add(new THREE.AmbientLight(0xd4d4d8, 0.48));

    const keyLight = new THREE.DirectionalLight(0xffffff, 1.85);
    keyLight.position.set(-5.5, 7.2, 8.5);
    scene.add(keyLight);

    const brassRimLight = new THREE.DirectionalLight(0xe5b24d, 1.65);
    brassRimLight.position.set(7, -2.5, 5.5);
    scene.add(brassRimLight);

    const topSpotLight = new THREE.PointLight(0xfff1cf, 1.35, 20);
    topSpotLight.position.set(0, 5.5, 5);
    scene.add(topSpotLight);

    const underFillLight = new THREE.DirectionalLight(0xa1a1aa, 0.65);
    underFillLight.position.set(-2, -6, 6);
    scene.add(underFillLight);

    /* ----------------------------------------------------------------------
       2. Textura Procedural de Fibra de Carbono + Materiais de Precisao
       ---------------------------------------------------------------------- */
    function createCarbonTexture() {
      const texCanvas = document.createElement('canvas');
      texCanvas.width = 256;
      texCanvas.height = 256;
      const ctx = texCanvas.getContext('2d');

      ctx.fillStyle = '#111116';
      ctx.fillRect(0, 0, 256, 256);

      const cell = 8;
      for (let y = 0; y < 256; y += cell) {
        for (let x = 0; x < 256; x += cell) {
          const phase = ((x / cell) + (y / cell)) % 2 === 0;
          const grad = ctx.createLinearGradient(x, y, x + cell, y + cell);
          if (phase) {
            grad.addColorStop(0, '#272730');
            grad.addColorStop(0.5, '#191920');
            grad.addColorStop(1, '#0e0e13');
          } else {
            grad.addColorStop(0, '#0c0c10');
            grad.addColorStop(0.5, '#17171d');
            grad.addColorStop(1, '#23232b');
          }
          ctx.fillStyle = grad;
          ctx.fillRect(x, y, cell, cell);

          ctx.fillStyle = phase ? 'rgba(244,244,245,0.1)' : 'rgba(244,244,245,0.03)';
          ctx.fillRect(x, y, cell, 1.5);
        }
      }

      const texture = new THREE.CanvasTexture(texCanvas);
      texture.wrapS = THREE.RepeatWrapping;
      texture.wrapT = THREE.RepeatWrapping;
      texture.repeat.set(6, 6);
      return texture;
    }

    const carbonTex = createCarbonTexture();

    const carbonMat = new THREE.MeshStandardMaterial({
      color: 0x24242c,
      map: carbonTex,
      bumpMap: carbonTex,
      bumpScale: 0.045,
      metalness: 0.68,
      roughness: 0.34,
      flatShading: true
    });

    const carbonArmorMat = new THREE.MeshStandardMaterial({
      color: 0x1b1b22,
      map: carbonTex,
      bumpMap: carbonTex,
      bumpScale: 0.03,
      metalness: 0.76,
      roughness: 0.28,
      flatShading: true
    });

    const titaniumMat = new THREE.MeshStandardMaterial({
      color: 0xd0d4dc,
      metalness: 0.92,
      roughness: 0.2
    });

    const chromeMat = new THREE.MeshStandardMaterial({
      color: 0xf4f4f5,
      metalness: 0.96,
      roughness: 0.14
    });

    const darkSteelMat = new THREE.MeshStandardMaterial({
      color: 0x272730,
      metalness: 0.85,
      roughness: 0.34
    });

    const brassMat = new THREE.MeshStandardMaterial({
      color: 0xd9a441,
      metalness: 0.92,
      roughness: 0.2
    });

    const brassBrightMat = new THREE.MeshStandardMaterial({
      color: 0xf0c264,
      metalness: 0.94,
      roughness: 0.16
    });

    const eyeLensMat = new THREE.MeshStandardMaterial({
      color: 0x0b0b10,
      emissive: 0x1e293b,
      emissiveIntensity: 0.35,
      metalness: 0.95,
      roughness: 0.06
    });

    // Rubi EXCLUSIVO da ampulheta (#C81E3A)
    const rubyMat = new THREE.MeshStandardMaterial({
      color: 0xc81e3a,
      emissive: 0x6b0b1c,
      emissiveIntensity: 0.65,
      metalness: 0.4,
      roughness: 0.16,
      flatShading: true
    });

    const wireframeMat = new THREE.LineBasicMaterial({
      color: 0xe4e4e7,
      transparent: true,
      opacity: 0.46
    });

    const brassWireMat = new THREE.LineBasicMaterial({
      color: 0xd9a441,
      transparent: true,
      opacity: 0.55
    });

    const silkMat = new THREE.MeshStandardMaterial({
      color: 0xe5b454,
      emissive: 0x6b4d12,
      emissiveIntensity: 0.45,
      metalness: 0.85,
      roughness: 0.25
    });

    const silkTickMat = new THREE.LineBasicMaterial({
      color: 0xd9a441,
      transparent: true,
      opacity: 0.72
    });

    /* ----------------------------------------------------------------------
       3. Teia Vertical de Latao Graduada + Teia Geometrica CAD 3D
       ---------------------------------------------------------------------- */
    const SILK_TOP_Y = 3.55;
    const silkTopVec = new THREE.Vector3(0, SILK_TOP_Y, -0.14);
    const silkGroup = new THREE.Group();
    scene.add(silkGroup);

    const silkLineMesh = new THREE.Mesh(
      new THREE.CylinderGeometry(0.017, 0.017, 1, 8),
      silkMat
    );
    silkGroup.add(silkLineMesh);

    const MAX_TICKS = 34;
    const tickPositions = new Float32Array(MAX_TICKS * 2 * 3);
    const tickGeom = new THREE.BufferGeometry();
    tickGeom.setAttribute('position', new THREE.BufferAttribute(tickPositions, 3));
    const silkTicks = new THREE.LineSegments(tickGeom, silkTickMat);
    silkGroup.add(silkTicks);

    // Teia geometrica CAD 3D (fios radiais + aneis octogonais sutis atras da aranha)
    const webPoints = [];
    const webCenter = new THREE.Vector3(0, -0.05, -0.95);
    const spokeCount = 12;
    const spokeMaxR = 4.65;

    for (let s = 0; s < spokeCount; s += 1) {
      const ang = (s / spokeCount) * Math.PI * 2 + Math.PI / 12;
      webPoints.push(
        new THREE.Vector3(webCenter.x, webCenter.y, webCenter.z),
        new THREE.Vector3(
          webCenter.x + Math.cos(ang) * spokeMaxR,
          webCenter.y + Math.sin(ang) * spokeMaxR,
          webCenter.z
        )
      );
    }

    [1.35, 2.25, 3.15, 4.05].forEach((radius) => {
      for (let s = 0; s < spokeCount; s += 1) {
        const a1 = (s / spokeCount) * Math.PI * 2 + Math.PI / 12;
        const a2 = ((s + 1) / spokeCount) * Math.PI * 2 + Math.PI / 12;
        webPoints.push(
          new THREE.Vector3(webCenter.x + Math.cos(a1) * radius, webCenter.y + Math.sin(a1) * radius, webCenter.z),
          new THREE.Vector3(webCenter.x + Math.cos(a2) * radius, webCenter.y + Math.sin(a2) * radius, webCenter.z)
        );
      }
    });

    const cadWebMat = new THREE.LineBasicMaterial({
      color: 0xd9a441,
      transparent: true,
      opacity: 0.11
    });
    const cadWebMesh = new THREE.LineSegments(
      new THREE.BufferGeometry().setFromPoints(webPoints),
      cadWebMat
    );
    silkGroup.add(cadWebMesh);

    // Fios diagonais de ancoragem no topo da teia
    const webAnchorMat = new THREE.LineBasicMaterial({
      color: 0xd9a441,
      transparent: true,
      opacity: 0.3
    });
    const webAnchorStrands = new THREE.LineSegments(
      new THREE.BufferGeometry().setFromPoints([
        new THREE.Vector3(-4.2, SILK_TOP_Y, -0.35),
        new THREE.Vector3(0, 3.12, -0.14),
        new THREE.Vector3(4.2, SILK_TOP_Y, -0.35),
        new THREE.Vector3(0, 3.12, -0.14),
        new THREE.Vector3(-2.1, SILK_TOP_Y, -0.25),
        new THREE.Vector3(0, 2.82, -0.14),
        new THREE.Vector3(2.1, SILK_TOP_Y, -0.25),
        new THREE.Vector3(0, 2.82, -0.14)
      ]),
      webAnchorMat
    );
    silkGroup.add(webAnchorStrands);

    const anchorNode = new THREE.Mesh(
      new THREE.TorusGeometry(0.068, 0.016, 8, 18),
      brassBrightMat
    );
    anchorNode.position.set(0, 3.12, -0.14);
    silkGroup.add(anchorNode);

    function updateSilkThread(attachWorldPos) {
      const length = SILK_TOP_Y - attachWorldPos.y;
      if (length <= 0.04) {
        silkLineMesh.visible = false;
        silkTicks.visible = false;
        return;
      }

      silkLineMesh.visible = true;
      silkTicks.visible = true;
      orientLimbBetween(silkLineMesh, attachWorldPos, silkTopVec);

      const spacing = 0.115;
      const posAttr = tickGeom.attributes.position;
      for (let i = 0; i < MAX_TICKS; i += 1) {
        const y = SILK_TOP_Y - 0.1 - i * spacing;
        const idx = i * 6;
        if (y > attachWorldPos.y + 0.06) {
          const t = (SILK_TOP_Y - y) / length;
          const cx = attachWorldPos.x * t;
          const cz = silkTopVec.z + (attachWorldPos.z - silkTopVec.z) * t;
          const tickLen = i % 3 === 0 ? 0.115 : 0.058;
          tickPositions[idx] = cx;
          tickPositions[idx + 1] = y;
          tickPositions[idx + 2] = cz;
          tickPositions[idx + 3] = cx + tickLen;
          tickPositions[idx + 4] = y;
          tickPositions[idx + 5] = cz;
        } else {
          tickPositions[idx] = 0;
          tickPositions[idx + 1] = SILK_TOP_Y + 4;
          tickPositions[idx + 2] = 0;
          tickPositions[idx + 3] = 0;
          tickPositions[idx + 4] = SILK_TOP_Y + 4;
          tickPositions[idx + 5] = 0;
        }
      }
      posAttr.needsUpdate = true;
    }

    /* ----------------------------------------------------------------------
       4. Geometria de Alta Fidelidade da Viuva Negra (Maior + Esculpida CAD)
       ---------------------------------------------------------------------- */
    const spiderGroup = new THREE.Group();
    scene.add(spiderGroup);

    const bodyGroup = new THREE.Group();
    spiderGroup.add(bodyGroup);

    // 4a. Abdomen esculpido em silhueta real de Viuva Negra (mais largo no topo, afilado na cintura)
    const abdomenGeom = new THREE.IcosahedronGeometry(1.18, 2);
    const abPos = abdomenGeom.attributes.position;
    for (let i = 0; i < abPos.count; i += 1) {
      let x = abPos.getX(i);
      let y = abPos.getY(i);
      let z = abPos.getZ(i);

      // Perfil anatomico em gota (mais volumoso na parte superior, afilando para o pedicelo)
      const normY = y / 1.18;
      const taper = normY < 0 ? 1 + normY * 0.28 : 1 - normY * 0.08;
      x *= 0.96 * taper;
      y *= 1.16;
      z *= 0.88 * taper;

      // Leve crista dorsal facetada frontal
      if (z > 0.35) {
        z += Math.max(0, 0.14 - Math.abs(x) * 0.16);
      }

      abPos.setXYZ(i, x, y, z);
    }
    abdomenGeom.computeVertexNormals();

    const abdomenMesh = new THREE.Mesh(abdomenGeom, carbonMat);
    abdomenMesh.position.set(0, 1.06, -0.14);
    bodyGroup.add(abdomenMesh);

    abdomenMesh.add(
      new THREE.LineSegments(new THREE.EdgesGeometry(abdomenGeom, 14), wireframeMat)
    );

    // Placa dorsal central de blindagem sobre o abdomen com filete de latao
    const dorsalPlateGeom = new THREE.CylinderGeometry(0.46, 0.3, 1.48, 6);
    dorsalPlateGeom.scale(1, 1, 0.34);
    const dorsalPlate = new THREE.Mesh(dorsalPlateGeom, carbonArmorMat);
    dorsalPlate.position.set(0, 1.14, 0.8);
    dorsalPlate.rotation.x = -0.14;
    bodyGroup.add(dorsalPlate);

    dorsalPlate.add(
      new THREE.LineSegments(new THREE.EdgesGeometry(dorsalPlateGeom, 18), brassWireMat)
    );

    // Costelas / anéis estruturais de latao embutidos nas laterais do abdomen
    [-1, 1].forEach((side) => {
      const ribGeom = new THREE.TorusGeometry(0.76, 0.022, 6, 12, Math.PI * 0.62);
      const rib = new THREE.Mesh(ribGeom, brassMat);
      rib.position.set(side * 0.38, 1.08, 0.18);
      rib.rotation.y = side * 1.05;
      rib.rotation.z = side * 0.32;
      bodyGroup.add(rib);
    });

    // Conjunto mecanico das Fiandeiras (Spinneret) no topo do abdomen
    const spinneretBase = new THREE.Mesh(
      new THREE.CylinderGeometry(0.14, 0.24, 0.2, 8),
      darkSteelMat
    );
    spinneretBase.position.set(0, 2.38, -0.14);
    bodyGroup.add(spinneretBase);

    const spinneretNozzle = new THREE.Mesh(
      new THREE.CylinderGeometry(0.075, 0.135, 0.18, 8),
      brassBrightMat
    );
    spinneretNozzle.position.set(0, 2.54, -0.14);
    bodyGroup.add(spinneretNozzle);

    const spinneretCollar = new THREE.Mesh(
      new THREE.TorusGeometry(0.16, 0.024, 8, 16),
      brassMat
    );
    spinneretCollar.position.set(0, 2.43, -0.14);
    spinneretCollar.rotation.x = Math.PI * 0.5;
    bodyGroup.add(spinneretCollar);

    const silkAttachAnchor = new THREE.Object3D();
    silkAttachAnchor.position.set(0, 2.62, -0.14);
    bodyGroup.add(silkAttachAnchor);

    // 4b. Pedicelo usinado (acoplamento entre abdomen e cefalotorax)
    const pedicelCore = new THREE.Mesh(
      new THREE.CylinderGeometry(0.32, 0.28, 0.3, 12),
      darkSteelMat
    );
    pedicelCore.position.set(0, -0.06, 0.08);
    bodyGroup.add(pedicelCore);

    [-0.08, 0.04].forEach((offsetY) => {
      const ring = new THREE.Mesh(
        new THREE.TorusGeometry(0.32, 0.032, 8, 18),
        brassMat
      );
      ring.position.set(0, -0.06 + offsetY, 0.08);
      ring.rotation.x = Math.PI * 0.5;
      bodyGroup.add(ring);
    });

    // 4c. Cefalotorax (prossoma) esculpido e blindado
    const thoraxGeom = new THREE.IcosahedronGeometry(0.84, 2);
    const thPos = thoraxGeom.attributes.position;
    for (let i = 0; i < thPos.count; i += 1) {
      let x = thPos.getX(i);
      let y = thPos.getY(i);
      let z = thPos.getZ(i);
      const normY = y / 0.84;
      const frontTaper = normY < 0 ? 1 + normY * 0.24 : 1;
      x *= 0.98 * frontTaper;
      y *= 1.08;
      z *= 0.86;
      thPos.setXYZ(i, x, y, z);
    }
    thoraxGeom.computeVertexNormals();

    const thoraxMesh = new THREE.Mesh(thoraxGeom, carbonMat);
    thoraxMesh.position.set(0, -0.62, 0.22);
    bodyGroup.add(thoraxMesh);

    thoraxMesh.add(
      new THREE.LineSegments(new THREE.EdgesGeometry(thoraxGeom, 14), wireframeMat)
    );

    // 4d. Ampulheta Rubi (#C81E3A) em Bezel Usinado de Latao + Titanio
    const bezelShape = new THREE.Shape();
    bezelShape.moveTo(-0.32, 0.42);
    bezelShape.lineTo(0.32, 0.42);
    bezelShape.lineTo(0.14, 0);
    bezelShape.lineTo(0.32, -0.42);
    bezelShape.lineTo(-0.32, -0.42);
    bezelShape.lineTo(-0.14, 0);
    bezelShape.closePath();

    const bezelGeom = new THREE.ExtrudeGeometry(bezelShape, {
      depth: 0.06,
      bevelEnabled: true,
      bevelThickness: 0.02,
      bevelSize: 0.02,
      bevelSegments: 2
    });
    bezelGeom.center();

    const bezelMesh = new THREE.Mesh(bezelGeom, darkSteelMat);
    bezelMesh.position.set(0, -0.58, 0.92);
    bodyGroup.add(bezelMesh);
    bezelMesh.add(
      new THREE.LineSegments(new THREE.EdgesGeometry(bezelGeom, 20), brassWireMat)
    );

    const hgShape = new THREE.Shape();
    hgShape.moveTo(-0.25, 0.35);
    hgShape.lineTo(0.25, 0.35);
    hgShape.lineTo(0.075, 0);
    hgShape.lineTo(0.25, -0.35);
    hgShape.lineTo(-0.25, -0.35);
    hgShape.lineTo(-0.075, 0);
    hgShape.closePath();

    const hgGeom = new THREE.ExtrudeGeometry(hgShape, {
      depth: 0.09,
      bevelEnabled: true,
      bevelThickness: 0.028,
      bevelSize: 0.022,
      bevelSegments: 2
    });
    hgGeom.center();

    const hourglassMesh = new THREE.Mesh(hgGeom, rubyMat);
    hourglassMesh.position.set(0, -0.58, 0.98);
    bodyGroup.add(hourglassMesh);

    hourglassMesh.add(
      new THREE.LineSegments(
        new THREE.EdgesGeometry(hgGeom, 20),
        new THREE.LineBasicMaterial({ color: 0xf4f4f5, transparent: true, opacity: 0.5 })
      )
    );

    const rubyGlow = new THREE.PointLight(0xc81e3a, 0.85, 3.6);
    rubyGlow.position.set(0, -0.58, 1.55);
    bodyGroup.add(rubyGlow);

    // 4e. Cluster de 8 Ocelos (Lentes Opticas de Viuva Negra na frente do cefalotorax)
    const eyeSpecs = [
      // Fileira frontal (4 lentes)
      { x: -0.1, y: -1.32, z: 0.72, r: 0.052 },
      { x: 0.1, y: -1.32, z: 0.72, r: 0.052 },
      { x: -0.25, y: -1.26, z: 0.66, r: 0.042 },
      { x: 0.25, y: -1.26, z: 0.66, r: 0.042 },
      // Fileira superior (4 lentes)
      { x: -0.14, y: -1.19, z: 0.76, r: 0.046 },
      { x: 0.14, y: -1.19, z: 0.76, r: 0.046 },
      { x: -0.31, y: -1.14, z: 0.67, r: 0.038 },
      { x: 0.31, y: -1.14, z: 0.67, r: 0.038 }
    ];

    const eyeBallGeo = new THREE.SphereGeometry(1, 12, 12);
    const eyeRingGeo = new THREE.TorusGeometry(1.15, 0.22, 6, 14);
    eyeSpecs.forEach((eye) => {
      const lens = new THREE.Mesh(eyeBallGeo, eyeLensMat);
      lens.scale.setScalar(eye.r);
      lens.position.set(eye.x, eye.y, eye.z);
      bodyGroup.add(lens);

      const bezel = new THREE.Mesh(eyeRingGeo, brassMat);
      bezel.scale.setScalar(eye.r);
      bezel.position.set(eye.x, eye.y, eye.z + eye.r * 0.18);
      bodyGroup.add(bezel);
    });

    // 4f. Queliceras (Presas) + Pedipalpos Articulados
    [-1, 1].forEach((side) => {
      // Base da quelicera
      const chelBase = new THREE.Mesh(
        new THREE.CylinderGeometry(0.12, 0.16, 0.34, 6),
        carbonArmorMat
      );
      chelBase.position.set(side * 0.22, -1.42, 0.44);
      chelBase.rotation.z = side * 0.18;
      bodyGroup.add(chelBase);

      // Colar em latao
      const chelRing = new THREE.Mesh(
        new THREE.TorusGeometry(0.135, 0.025, 8, 16),
        brassMat
      );
      chelRing.position.set(side * 0.24, -1.56, 0.46);
      chelRing.rotation.x = Math.PI * 0.48;
      bodyGroup.add(chelRing);

      // Garra metalica curvada para dentro
      const fang = new THREE.Mesh(
        new THREE.ConeGeometry(0.088, 0.38, 6),
        chromeMat
      );
      fang.position.set(side * 0.18, -1.75, 0.48);
      fang.rotation.z = -side * 0.32;
      fang.rotation.x = Math.PI - 0.16;
      bodyGroup.add(fang);

      // Pedipalpos (2 segmentos articulados ao lado das queliceras)
      const palpHip = new THREE.Vector3(side * 0.44, -1.16, 0.38);
      const palpKnee = new THREE.Vector3(side * 0.68, -1.52, 0.62);
      const palpTip = new THREE.Vector3(side * 0.52, -1.94, 0.54);

      const palpJ1 = new THREE.Mesh(new THREE.SphereGeometry(0.072, 10, 10), brassMat);
      palpJ1.position.copy(palpHip);
      bodyGroup.add(palpJ1);

      const palpJ2 = new THREE.Mesh(new THREE.SphereGeometry(0.068, 10, 10), brassBrightMat);
      palpJ2.position.copy(palpKnee);
      bodyGroup.add(palpJ2);

      const palpSeg1 = new THREE.Mesh(new THREE.CylinderGeometry(0.038, 0.048, 1, 8), titaniumMat);
      orientLimbBetween(palpSeg1, palpHip, palpKnee);
      bodyGroup.add(palpSeg1);

      const palpSeg2 = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.038, 1, 8), titaniumMat);
      orientLimbBetween(palpSeg2, palpKnee, palpTip);
      bodyGroup.add(palpSeg2);
    });

    /* ----------------------------------------------------------------------
       5. 8 Patas Mecanicas de 3 Segmentos (Femur + Tibia + Tarso) + Hidraulica
       Ordem exata:
         1..4 = Esquerda (topo -> base): JAVA, PYTHON, SQL, FIGMA
         5..8 = Direita  (topo -> base): GIT & GITHUB, HTML & CSS, LINUX, GEMINI
       ---------------------------------------------------------------------- */
    const baseLegsConfig = [
      // PATA 1: JAVA (Superior Esquerda)
      {
        side: -1,
        phase: 0.0,
        delay: 0.0,
        hip: new THREE.Vector3(-0.72, -0.26, 0.2),
        kneeOpen: new THREE.Vector3(-1.58, 1.62, 1.15),
        ankleOpen: new THREE.Vector3(-2.12, 1.84, 0.72),
        tipOpen: new THREE.Vector3(-2.54, 1.88, 0.28),
        kneeFold: new THREE.Vector3(-1.12, 2.25, 0.75),
        ankleFold: new THREE.Vector3(-1.32, 2.75, 0.45),
        tipFold: new THREE.Vector3(-1.42, 3.25, 0.15)
      },
      // PATA 2: PYTHON (Media-Superior Esquerda)
      {
        side: -1,
        phase: 1.15,
        delay: 0.07,
        hip: new THREE.Vector3(-0.78, -0.52, 0.28),
        kneeOpen: new THREE.Vector3(-1.96, 0.96, 1.38),
        ankleOpen: new THREE.Vector3(-2.52, 0.78, 0.92),
        tipOpen: new THREE.Vector3(-2.95, 0.5, 0.42),
        kneeFold: new THREE.Vector3(-1.26, 1.48, 0.88),
        ankleFold: new THREE.Vector3(-1.48, 1.92, 0.55),
        tipFold: new THREE.Vector3(-1.6, 2.38, 0.22)
      },
      // PATA 3: SQL (Media-Inferior Esquerda)
      {
        side: -1,
        phase: 2.3,
        delay: 0.14,
        hip: new THREE.Vector3(-0.74, -0.8, 0.28),
        kneeOpen: new THREE.Vector3(-1.76, -0.02, 1.36),
        ankleOpen: new THREE.Vector3(-2.22, -0.52, 0.88),
        tipOpen: new THREE.Vector3(-2.54, -0.94, 0.38),
        kneeFold: new THREE.Vector3(-1.2, 0.5, 0.85),
        ankleFold: new THREE.Vector3(-1.4, 0.9, 0.5),
        tipFold: new THREE.Vector3(-1.52, 1.28, 0.2)
      },
      // PATA 4: FIGMA (Inferior Esquerda)
      {
        side: -1,
        phase: 3.45,
        delay: 0.21,
        hip: new THREE.Vector3(-0.58, -1.06, 0.22),
        kneeOpen: new THREE.Vector3(-1.34, -0.92, 1.14),
        ankleOpen: new THREE.Vector3(-1.72, -1.68, 0.68),
        tipOpen: new THREE.Vector3(-1.98, -2.3, 0.22),
        kneeFold: new THREE.Vector3(-1.02, -0.46, 0.74),
        ankleFold: new THREE.Vector3(-1.18, -0.88, 0.42),
        tipFold: new THREE.Vector3(-1.28, -1.32, 0.15)
      }
    ];

    const allLegsConfig = [
      ...baseLegsConfig,
      ...baseLegsConfig.map((cfg) => ({
        side: 1,
        phase: cfg.phase + 0.55,
        delay: cfg.delay + 0.03,
        hip: new THREE.Vector3(-cfg.hip.x, cfg.hip.y, cfg.hip.z),
        kneeOpen: new THREE.Vector3(-cfg.kneeOpen.x, cfg.kneeOpen.y, cfg.kneeOpen.z),
        ankleOpen: new THREE.Vector3(-cfg.ankleOpen.x, cfg.ankleOpen.y, cfg.ankleOpen.z),
        tipOpen: new THREE.Vector3(-cfg.tipOpen.x, cfg.tipOpen.y, cfg.tipOpen.z),
        kneeFold: new THREE.Vector3(-cfg.kneeFold.x, cfg.kneeFold.y, cfg.kneeFold.z),
        ankleFold: new THREE.Vector3(-cfg.ankleFold.x, cfg.ankleFold.y, cfg.ankleFold.z),
        tipFold: new THREE.Vector3(-cfg.tipFold.x, cfg.tipFold.y, cfg.tipFold.z)
      }))
    ];

    // Geometrias compartilhadas (alta riqueza visual + baixo custo de draw/memoria)
    const hipSocketGeom = new THREE.CylinderGeometry(0.155, 0.175, 0.14, 6);
    const hipJointGeom = new THREE.SphereGeometry(0.135, 16, 16);
    const femurGeom = new THREE.CylinderGeometry(0.082, 0.112, 1, 12);
    const femurArmorGeom = new THREE.BoxGeometry(0.125, 0.62, 0.065);
    const pistonCylinderGeom = new THREE.CylinderGeometry(0.03, 0.03, 1, 8);
    const pistonRodGeom = new THREE.CylinderGeometry(0.015, 0.015, 1, 8);
    const kneeJointGeom = new THREE.SphereGeometry(0.178, 18, 18);
    const kneeCollarGeom = new THREE.TorusGeometry(0.188, 0.034, 8, 20);
    const kneeAxleGeom = new THREE.CylinderGeometry(0.058, 0.058, 0.42, 10);
    const tibiaGeom = new THREE.CylinderGeometry(0.056, 0.078, 1, 10);
    const tendonGeom = new THREE.CylinderGeometry(0.014, 0.014, 1, 6);
    const ankleJointGeom = new THREE.SphereGeometry(0.095, 14, 14);
    const ankleCollarGeom = new THREE.TorusGeometry(0.105, 0.02, 8, 16);
    const tarsusGeom = new THREE.CylinderGeometry(0.026, 0.054, 1, 10);
    const tipBallGeom = new THREE.SphereGeometry(0.072, 14, 14);
    const tipRingGeom = new THREE.TorusGeometry(0.098, 0.02, 8, 18);
    const sleeveRingGeom = new THREE.TorusGeometry(0.092, 0.018, 6, 16);

    const legs = allLegsConfig.map((cfg) => {
      const legGroup = new THREE.Group();
      spiderGroup.add(legGroup);

      // Socket sextavado no torax + esfera de latao proximal
      const hipSocket = new THREE.Mesh(hipSocketGeom, darkSteelMat);
      hipSocket.position.copy(cfg.hip);
      hipSocket.rotation.z = Math.PI * 0.5;
      legGroup.add(hipSocket);

      const hipJoint = new THREE.Mesh(hipJointGeom, brassMat);
      hipJoint.position.copy(cfg.hip);
      legGroup.add(hipJoint);

      // Segmento 1: Femur + placa de carbono + 2 aneis de reforco + pistao hidraulico
      const femur = new THREE.Mesh(femurGeom, titaniumMat);
      legGroup.add(femur);

      const femurArmor = new THREE.Mesh(femurArmorGeom, carbonArmorMat);
      femurArmor.position.set(0, 0, 0.075);
      femur.add(femurArmor);

      const femurSleeve = new THREE.Mesh(sleeveRingGeom, brassMat);
      femurSleeve.rotation.x = Math.PI * 0.5;
      femurSleeve.position.y = 0.24;
      femur.add(femurSleeve);

      const pistonCylinder = new THREE.Mesh(pistonCylinderGeom, darkSteelMat);
      legGroup.add(pistonCylinder);

      const pistonRod = new THREE.Mesh(pistonRodGeom, chromeMat);
      legGroup.add(pistonRod);

      // Joelho / Patela mecanica (esfera latao + duplo colarinho carbono + eixo)
      const kneeJoint = new THREE.Mesh(kneeJointGeom, brassBrightMat);
      legGroup.add(kneeJoint);

      const kneeCollarA = new THREE.Mesh(kneeCollarGeom, darkSteelMat);
      kneeCollarA.rotation.y = Math.PI * 0.25;
      kneeJoint.add(kneeCollarA);

      const kneeCollarB = new THREE.Mesh(kneeCollarGeom, darkSteelMat);
      kneeCollarB.rotation.y = -Math.PI * 0.25;
      kneeJoint.add(kneeCollarB);

      const kneeAxle = new THREE.Mesh(kneeAxleGeom, titaniumMat);
      kneeAxle.rotation.x = Math.PI * 0.5;
      kneeJoint.add(kneeAxle);

      // Segmento 2: Tibia + tendao metalico
      const tibia = new THREE.Mesh(tibiaGeom, titaniumMat);
      legGroup.add(tibia);

      const tendon = new THREE.Mesh(tendonGeom, brassMat);
      legGroup.add(tendon);

      // Junta secundaria: Tornozelo / Metatarso
      const ankleJoint = new THREE.Mesh(ankleJointGeom, brassMat);
      legGroup.add(ankleJoint);

      const ankleCollar = new THREE.Mesh(ankleCollarGeom, darkSteelMat);
      ankleJoint.add(ankleCollar);

      // Segmento 3: Tarso afilado + Ponteira terminal ancorada ao no HTML
      const tarsus = new THREE.Mesh(tarsusGeom, chromeMat);
      legGroup.add(tarsus);

      const tipAnchor = new THREE.Object3D();
      legGroup.add(tipAnchor);

      const tipBall = new THREE.Mesh(tipBallGeom, chromeMat);
      tipAnchor.add(tipBall);

      const tipRing = new THREE.Mesh(tipRingGeom, brassBrightMat);
      tipAnchor.add(tipRing);

      return {
        cfg,
        femur,
        pistonCylinder,
        pistonRod,
        kneeJoint,
        tibia,
        tendon,
        ankleJoint,
        tarsus,
        tipAnchor,
        kneePos: new THREE.Vector3(),
        anklePos: new THREE.Vector3(),
        tipPos: new THREE.Vector3(),
        auxA: new THREE.Vector3(),
        auxB: new THREE.Vector3(),
        auxMid: new THREE.Vector3()
      };
    });

    /* ----------------------------------------------------------------------
       6. Maquina de Estados: Descida na Teia + Amortecimento + Idle/Paralaxe
       ---------------------------------------------------------------------- */
    const DESCENT_START_Y = 4.65;
    const DESCENT_DURATION_MS = 2350;

    let hasStartedDescent = prefersReducedMotion;
    let descentStartTime = 0;
    let descentProgress = prefersReducedMotion ? 1 : 0;
    let isSectionVisible = false;
    let isNodeHovered = false;

    const pointerTarget = { x: 0, y: 0 };
    const pointerSmooth = { x: 0, y: 0 };

    // Trava de precisao ao inspecionar qualquer no
    const nodeEls = stage.querySelectorAll('.gd-arsenal-node');
    nodeEls.forEach((nodeEl) => {
      nodeEl.addEventListener('pointerenter', () => { isNodeHovered = true; });
      nodeEl.addEventListener('pointerleave', () => { isNodeHovered = false; });
      nodeEl.addEventListener('focusin', () => { isNodeHovered = true; });
      nodeEl.addEventListener('focusout', () => { isNodeHovered = false; });
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
      const c1 = 0.92;
      const c3 = c1 + 1;
      return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2);
    }

    /* ----------------------------------------------------------------------
       7. Redimensionamento & Projecao 3D -> Variaveis CSS (--pata-1..8)
       ---------------------------------------------------------------------- */
    const worldVec = new THREE.Vector3();
    const attachWorldVec = new THREE.Vector3();

    function resizeRenderer() {
      const width = viewport.clientWidth || 1260;
      const height = viewport.clientHeight || 620;
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
      renderer.setSize(width, height, false);
    }

    function projectLegsToCssVariables() {
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

      // 1) Descida fluida pela teia de latao com amortecimento elastico + leve pendulo
      const dropEase = prefersReducedMotion ? 1 : easeOutBackSoft(descentProgress);
      const baseY = DESCENT_START_Y * (1 - dropEase);

      const swayDamp = isNodeHovered ? 0.1 : 1;
      const descentSwing =
        !prefersReducedMotion && descentProgress < 1
          ? Math.sin(descentProgress * Math.PI * 2.5) * (1 - descentProgress) * 0.16
          : 0;
      const idleFloatY = prefersReducedMotion ? 0 : Math.sin(timeSec * 1.4) * 0.048 * swayDamp;
      const idleSwingX = prefersReducedMotion ? 0 : Math.sin(timeSec * 0.8) * 0.032 * swayDamp;

      spiderGroup.position.set(idleSwingX + descentSwing, baseY + idleFloatY, 0);

      // 2) Paralaxe 3D acompanhando o ponteiro
      const parallaxFactor = isNodeHovered ? 0.22 : 1;
      pointerSmooth.x += (pointerTarget.x * parallaxFactor - pointerSmooth.x) * 0.06;
      pointerSmooth.y += (pointerTarget.y * parallaxFactor - pointerSmooth.y) * 0.06;

      const descentPitch = (1 - easeOutCubic(descentProgress)) * 0.45;
      spiderGroup.rotation.y = pointerSmooth.x * 0.16;
      spiderGroup.rotation.x = pointerSmooth.y * 0.1 + descentPitch;
      spiderGroup.rotation.z = -(idleSwingX + descentSwing) * 0.32;

      // Iluminacao sutil da teia CAD de fundo acompanhando a chegada da aranha
      cadWebMat.opacity = 0.05 + easeOutCubic(descentProgress) * 0.08;

      // 3) Desdobramento articulado dos 3 segmentos de cada uma das 8 patas
      const legOscAmp = prefersReducedMotion ? 0 : (isNodeHovered ? 0.006 : 0.036);

      for (let i = 0; i < legs.length; i += 1) {
        const leg = legs[i];
        const { cfg } = leg;

        const localOpenRaw = Math.max(
          0,
          Math.min(1, (descentProgress - cfg.delay * 0.5) / (1 - cfg.delay * 0.5))
        );
        const openT = prefersReducedMotion ? 1 : easeOutCubic(localOpenRaw);

        leg.kneePos.lerpVectors(cfg.kneeFold, cfg.kneeOpen, openT);
        leg.anklePos.lerpVectors(cfg.ankleFold, cfg.ankleOpen, openT);
        leg.tipPos.lerpVectors(cfg.tipFold, cfg.tipOpen, openT);

        if (openT > 0.7) {
          const oscY = Math.sin(timeSec * 1.85 + cfg.phase) * legOscAmp;
          const oscZ = Math.cos(timeSec * 1.45 + cfg.phase) * legOscAmp * 1.25;
          leg.kneePos.y += oscY * 1.45;
          leg.kneePos.z += oscZ;
          leg.anklePos.y += oscY * 0.95;
          leg.anklePos.z += oscZ * 0.6;
          leg.tipPos.y += oscY * 0.45;
        }

        // Segmento 1: Femur + pistao hidraulico bipartido (cilindro + haste cromada)
        orientLimbBetween(leg.femur, cfg.hip, leg.kneePos);

        leg.auxA.set(cfg.hip.x, cfg.hip.y + 0.12, cfg.hip.z - 0.1);
        leg.auxB.set(leg.kneePos.x, leg.kneePos.y - 0.08, leg.kneePos.z - 0.12);
        leg.auxMid.lerpVectors(leg.auxA, leg.auxB, 0.56);
        orientLimbBetween(leg.pistonCylinder, leg.auxA, leg.auxMid);
        orientLimbBetween(leg.pistonRod, leg.auxMid, leg.auxB);

        // Joelho
        leg.kneeJoint.position.copy(leg.kneePos);

        // Segmento 2: Tibia + tendao inferior de latao
        orientLimbBetween(leg.tibia, leg.kneePos, leg.anklePos);
        leg.auxA.set(leg.kneePos.x, leg.kneePos.y - 0.1, leg.kneePos.z - 0.06);
        leg.auxB.set(leg.anklePos.x, leg.anklePos.y - 0.07, leg.anklePos.z - 0.04);
        orientLimbBetween(leg.tendon, leg.auxA, leg.auxB);

        // Tornozelo + Segmento 3: Tarso + Ponteira
        leg.ankleJoint.position.copy(leg.anklePos);
        orientLimbBetween(leg.tarsus, leg.anklePos, leg.tipPos);
        leg.tipAnchor.position.copy(leg.tipPos);
      }

      // 4) Atualiza a teia vertical graduada conectada a fiandeira
      spiderGroup.updateMatrixWorld(true);
      attachWorldVec.setFromMatrixPosition(silkAttachAnchor.matrixWorld);
      updateSilkThread(attachWorldVec);

      // 5) Fade-in coordenado dos 8 nos quando as patas se estendem
      const nodeReveal = prefersReducedMotion
        ? 1
        : Math.max(0, Math.min(1, (descentProgress - 0.5) / 0.38));
      stage.style.setProperty('--nodes-reveal', nodeReveal.toFixed(3));

      // 6) Projeta as 8 extremidades das patas nas variaveis CSS --pata-1..8
      projectLegsToCssVariables();
    }

    /* ----------------------------------------------------------------------
       8. Loop Economico de Renderizacao
       ---------------------------------------------------------------------- */
    let rafId = 0;

    function renderFrame(nowMs) {
      if (isArachnophobiaSafe) {
        rafId = 0;
        return;
      }

      updatePose(nowMs);
      renderer.render(scene, camera);

      if (!prefersReducedMotion && isSectionVisible && !isArachnophobiaSafe) {
        rafId = window.requestAnimationFrame(renderFrame);
      } else {
        rafId = 0;
      }
    }

    function startLoop() {
      if (!rafId && !isArachnophobiaSafe) {
        rafId = window.requestAnimationFrame(renderFrame);
      }
    }

    function stopLoop() {
      if (rafId) {
        window.cancelAnimationFrame(rafId);
        rafId = 0;
      }
    }

    onArachnophobiaToggleHook = (safeActive) => {
      if (safeActive) {
        stopLoop();
      } else {
        updatePose(performance.now());
        renderer.render(scene, camera);
        if (!prefersReducedMotion && isSectionVisible) {
          startLoop();
        }
      }
    };

    stage.classList.add('is-3d-active');
    resizeRenderer();
    updatePose(performance.now());
    renderer.render(scene, camera);

    if ('IntersectionObserver' in window) {
      const visibilityObserver = new IntersectionObserver(
        (entries) => {
          isSectionVisible = entries[0].isIntersecting;
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
        { threshold: 0.08 }
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
