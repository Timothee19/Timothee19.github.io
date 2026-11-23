/* ============================================================
   TIMOTHÉE SOULEZ BARSELO — EDITORIAL ORCHESTRATOR
   ============================================================ */

(() => {
  'use strict';

  const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  let currentLang = 'fr';
  let currentTheme = 'dark';
  let activeDemo = null;
  let lenisInstance = null;
  let heroCtrl = null;
  let shelfCtrl = null;

  const BOOKS_META = [
    { key: 'anki', num: '01', yearShort: '25—26', spineTitle: 'ANKI', coverLines: ['AnkiCards', 'Generator'], metricTag: '4 AGENTS · NETWORKX', coverColor: '#2c1f1b', accent: '#e05336', textColor: '#efeae0', subColor: '#b5a89c', thickness: 0.44, height: 2.22 },
    { key: 'srgan', num: '02', yearShort: '24—25', spineTitle: 'SRGAN ×4', coverLines: ['Wasserstein', 'SRGAN ×4'], metricTag: '28.74 dB · 12.7M', coverColor: '#1b2832', accent: '#5ea8cc', textColor: '#efeae0', subColor: '#9eb4c2', thickness: 0.38, height: 2.06 },
    { key: 'alzheimer', num: '03', yearShort: '2026', spineTitle: 'OASIS-1', coverLines: ['Alzheimer', 'MRI OASIS-1'], metricTag: 'AUC 0.91 · 86K SLICES', coverColor: '#1d2b23', accent: '#52b788', textColor: '#efeae0', subColor: '#9db8a9', thickness: 0.48, height: 2.30 },
    { key: 'bobslay', num: '04', yearShort: '2026', spineTitle: 'PARKINSON', coverLines: ['Parkinson', 'MDS-UPDRS'], metricTag: '44K ROWS · SKORE', coverColor: '#30261c', accent: '#d99b58', textColor: '#efeae0', subColor: '#c2ae97', thickness: 0.36, height: 2.00 },
    { key: 'churn', num: '05', yearShort: '2026', spineTitle: 'CHURN K8S', coverLines: ['Churn MLOps', 'Kubernetes'], metricTag: 'XGBOOST · MINIKUBE', coverColor: '#242030', accent: '#9b8ce8', textColor: '#efeae0', subColor: '#b2acc7', thickness: 0.42, height: 2.14 }
  ];

  const PROJECTS = {
    anki: {
      num: '01',
      date: { fr: '2025 – Présent', en: '2025 – Present' },
      cat: { fr: 'IA Agentique · Mistral', en: 'Agentic AI · Mistral' },
      title: 'AnkiCardsGenerator',
      desc: {
        fr: 'Pipeline à 4 agents (Mistral OCR + Large 4) transformant un cours PDF en graphe NetworkX (13+ matières) puis en deck Anki LaTeX/MathJax (.apkg, design Fieldnote) sur backend FastAPI / Celery / Redis.',
        en: '4-agent pipeline (Mistral OCR + Large 4) turning any PDF course into a NetworkX knowledge graph (13+ subjects) and a LaTeX/MathJax Anki deck (.apkg, Fieldnote design) on FastAPI / Celery / Redis.'
      },
      metrics: [
        { val: '4 Agents', lbl: { fr: 'Mistral OCR/L4', en: 'Mistral OCR/L4' } },
        { val: '13+', lbl: { fr: 'Disciplines', en: 'Subjects' } },
        { val: 'NetworkX', lbl: { fr: 'Graphe → .apkg', en: 'Graph → .apkg' } }
      ],
      stack: ['Python', 'Mistral Large 4', 'NetworkX', 'FastAPI', 'Celery', 'Pandoc / LaTeX', 'genanki'],
      repo: 'https://github.com/Timothee19/AnkiCardsGenerator'
    },
    srgan: {
      num: '02',
      date: { fr: '2024 – 2025', en: '2024 – 2025' },
      cat: { fr: 'Deep Learning · Vision', en: 'Deep Learning · Vision' },
      title: 'Wasserstein SRGAN',
      desc: {
        fr: 'Wasserstein SRGAN from scratch (TensorFlow/Keras, 12,7M params) comparant GAN conditionnel vs non-conditionnel pour la super-résolution ×2 (64→128) et ×4 (32→128) sur 1 254 images.',
        en: 'From-scratch Wasserstein SRGAN (TensorFlow/Keras, 12.7M params) benchmarking conditional vs. unconditional ×2 (64→128) and ×4 (32→128) super-resolution on 1,254 images.'
      },
      metrics: [
        { val: '28.74 dB', lbl: { fr: 'PSNR', en: 'PSNR' } },
        { val: '0.8667', lbl: { fr: 'SSIM', en: 'SSIM' } },
        { val: '12.7M', lbl: { fr: 'Paramètres', en: 'Parameters' } }
      ],
      stack: ['TensorFlow', 'Keras', 'Wasserstein GAN', 'Super-Resolution ×4', 'Python'],
      repo: 'https://github.com/Timothee19/SRGAN'
    },
    alzheimer: {
      num: '03',
      date: { fr: '2026', en: '2026' },
      cat: { fr: 'Imagerie Médicale · MIL', en: 'Medical Imaging · MIL' },
      title: 'Alzheimer MRI (OASIS-1)',
      desc: {
        fr: '86 437 coupes IRM (347 patients, split strict sans data leakage). CNN 2D, Gated Attention MIL sur 61 coupes par volume et MobileNetV2 2.5D entraînés sous TensorFlow + Intel Iris XPU.',
        en: '86,437 brain MRI slices (347 patients, zero-leakage split). 2D CNN, 61-slice Gated Attention MIL, and 2.5D MobileNetV2 trained with TensorFlow + Intel Iris XPU.'
      },
      metrics: [
        { val: '0.9115', lbl: { fr: 'ROC-AUC', en: 'ROC-AUC' } },
        { val: '86.25 %', lbl: { fr: 'Bal. Acc MIL', en: 'MIL Bal. Acc' } },
        { val: '100 %', lbl: { fr: 'Rappel Test', en: 'Test Recall' } }
      ],
      stack: ['TensorFlow', 'Attention MIL', 'MobileNetV2 2.5D', 'CNN 2D', 'Intel XPU'],
      repo: 'https://github.com/Timothee19/alzheimer-mri-oasis1'
    },
    bobslay: {
      num: '04',
      date: { fr: '2026', en: '2026' },
      cat: { fr: 'Probabl × IBM × ESILV', en: 'Probabl × IBM × ESILV' },
      title: 'Parkinson MDS-UPDRS',
      desc: {
        fr: 'Régression sur 44 590 visites patients pour corriger le biais clinique du score moteur OFF MDS-UPDRS. GroupKFold par patient_id, gestion de 42–79 % de valeurs manquantes et suivi Skore Hub.',
        en: 'Regression across 44,590 patient visits correcting clinical bias in OFF MDS-UPDRS motor scores. Patient-grouped GroupKFold, 42–79% missingness handling, tracked on Skore Hub.'
      },
      metrics: [
        { val: '44 590', lbl: { fr: 'Visites', en: 'Visits' } },
        { val: 'r = 0.87', lbl: { fr: 'Corr. OFF', en: 'OFF Corr.' } },
        { val: 'GroupKFold', lbl: { fr: 'Par patient', en: 'Per patient' } }
      ],
      stack: ['Scikit-learn', 'Skore Hub', 'GroupKFold', 'EDA', 'Kaggle'],
      repo: 'https://github.com/Timothee19/Bob-slay'
    },
    churn: {
      num: '05',
      date: { fr: '2026 · Atos', en: '2026 · Atos' },
      cat: { fr: 'MLOps · Kubernetes', en: 'MLOps · Kubernetes' },
      title: 'Churn Detection MLOps',
      desc: {
        fr: 'Benchmark de 7 modèles (XGBoost, LightGBM, CatBoost, MLP…) déployé en microservices Minikube/Kustomize : FastAPI + Gradio MCP + GitLab CI/CD 3 stages vers Nexus. Cliquez sur le pod central FastAPI + XGB pour explorer l’arbre de décision 3D.',
        en: '7-model benchmark (XGBoost, LightGBM, CatBoost, MLP…) deployed as Minikube/Kustomize microservices: FastAPI + Gradio MCP + 3-stage GitLab CI/CD to Nexus. Click the center FastAPI + XGB pod to inspect the 3D decision tree.'
      },
      metrics: [
        { val: '0.865', lbl: { fr: 'ROC AUC', en: 'ROC AUC' } },
        { val: '78 %', lbl: { fr: 'Rappel', en: 'Recall' } },
        { val: '7 Modèles', lbl: { fr: 'Comparés', en: 'Benchmarked' } }
      ],
      stack: ['XGBoost', 'FastAPI', 'Gradio MCP', 'Docker', 'Kubernetes', 'GitLab CI/CD', 'Nexus'],
      repo: 'https://gitlab.com/Timothee19/Projet_Churn_Detection'
    }
  };
  const PROJECT_KEYS = ['anki', 'srgan', 'alzheimer', 'bobslay', 'churn'];

  const I18N = {
    fr: {
      'nav.work': 'Projets', 'nav.about': 'TIMOTHEE.md', 'nav.track': 'Parcours', 'nav.contact': 'Contact',
      'hero.avail': 'STAGE 5 MOIS · 12 AVRIL – 7 SEPTEMBRE 2027',
      'hero.greeting': 'Bonjour, je suis',
      'hero.desc': "Étudiant ingénieur en <strong>Data &amp; IA à l'ESILV</strong>. Je conçois des <strong>systèmes agentiques LLM</strong>, des architectures de <strong>Deep Learning</strong> et des <strong>pipelines MLOps end-to-end</strong> prêts pour la production.",
      'hero.cta': 'Bureau 3D',
      'work.t1': 'Mes projets', 'work.t2': 'publics', 'work.shelf': 'BUREAU 3D', 'work.list': 'INDEX', 'work.open': 'ALLUMER LE LAPTOP ↗',
      'p.anki.cat': 'IA Agentique · Mistral', 'p.srgan.cat': 'Deep Learning · ×4', 'p.alz.cat': 'Imagerie Médicale · MIL',
      'p.bob.cat': 'Probabl × IBM', 'p.churn.cat': 'Kubernetes · XGBoost · GitLab CI',
      'fact.loc': 'PARIS · SÉOUL',
      'md.quote': "> curiosité, méthode, et envie d'apprendre en construisant.",
      'md.t1': '## 01 — curiosité & parcours',
      'md.p1': "Après deux ans de prépa MPSI/MP à Claude Bernard, j'ai intégré l'ESILV où j'ai effectué le second semestre de ma première année en échange à Hanyang University à Séoul (fin février – fin juin 2026). Aujourd'hui en majeure Data & IA (cursus anglophone), je suis en parallèle le parcours quantique — informatique quantique, cryptographie et mécanique quantique. La curiosité et l'envie d'apprendre restent mes principaux moteurs.",
      'md.t2': '## 02 — recherche & méthode',
      'md.p2': "En travaillant sur un SRGAN puis sur un pipeline multi-agents Mistral, j'ai appris à confronter mes idées à des métriques objectives et à explorer des sujets nouveaux. Mon stage chez Atos m'a ensuite appris l'importance des bonnes pratiques — tests, Docker, Kubernetes, CI/CD — pour livrer un code propre et reproductible.",
      'md.t3': '## 03 — écouter, vulgariser, partager',
      'md.p3': "Mes pairs me renouvellent leur confiance depuis trois ans : représentant élu des prépas au conseil d'administration, puis délégué et membre de la commission de vie étudiante à l'ESILV. Chez Vinci Eco Drive (étude VCU & PCB KiCad) comme chez Acadomia auprès de mes élèves, j'entretiens au quotidien l'écoute, la pédagogie et le soin du détail.",
      'md.t4': '## 04 — avril 2027',
      'md.p4': "Je recherche un stage de 5 mois du 12 avril au 7 septembre 2027 en Recherche IA, Machine Learning, Data Science ou MLOps — avec l'envie de grandir techniquement au contact d'une équipe et de contribuer à des projets concrets.",
      'ft.0': 'Parcours', 'ft.1': 'Méthode', 'ft.2': 'Collectif', 'ft.3': 'Avril 2027',
      'trk.t1': 'Parcours', 'trk.t2': '& repères', 'trk.exp': 'Expériences', 'trk.edu': 'Formations',
      'exp.atos.r': 'Data Scientist / MLOps — Atos',
      'exp.atos.p': 'GradientBoosting (ROC AUC 0,865, Rappel 78 %), FastAPI, Docker, Kubernetes & GitLab CI/CD.',
      'exp.vinci.r': 'Systèmes Embarqués — Vinci Eco Drive',
      'exp.vinci.p': "Étude d'état de l'art VCU (18 pages, FreeRTOS) et conception d'un PCB de volant sous KiCad.",
      'exp.acad.r': 'Professeur Maths & Physique — Acadomia',
      'exp.acad.p': 'Accompagnement scientifique auprès de 4 élèves de collège et lycée.',
      'edu.esilv.p': 'ML, Deep Learning, MLOps, parcours quantique. Délégué & commission vie étudiante.',
      'edu.han.p': "Semestre d'échange : Signal Processing, Artificial Intelligence, Engineering Mathematics.",
      'edu.cpge.p': "Option Informatique, CCINP 516 pts. Représentant élu des prépas au conseil d'administration.",
      'ctc.h1': 'Parlons-en', 'drawer.repo': 'Voir le dépôt', 'drawer.back': '← BUREAU',
      'footer.rights': 'Réalisé avec Gemini 4 Neon.', 'footer.top': '↑ HAUT',
      'toast.copied': 'EMAIL COPIÉ : tim.barselo@gmail.com'
    },
    en: {
      'nav.work': 'Projects', 'nav.about': 'TIMOTHEE.md', 'nav.track': 'Track', 'nav.contact': 'Contact',
      'hero.avail': '5-MONTH INTERNSHIP · APRIL 12 – SEPTEMBER 7, 2027',
      'hero.greeting': "Hello, I'm",
      'hero.desc': 'Engineering student in <strong>Data &amp; AI at ESILV</strong>. I design <strong>agentic LLM systems</strong>, <strong>Deep Learning</strong> architectures, and production-ready <strong>end-to-end MLOps pipelines</strong>.',
      'hero.cta': '3D Desk',
      'work.t1': 'My public', 'work.t2': 'projects', 'work.shelf': '3D DESK', 'work.list': 'INDEX', 'work.open': 'WAKE LAPTOP ↗',
      'p.anki.cat': 'Agentic AI · Mistral', 'p.srgan.cat': 'Deep Learning · ×4', 'p.alz.cat': 'Medical Imaging · MIL',
      'p.bob.cat': 'Probabl × IBM', 'p.churn.cat': 'Kubernetes · XGBoost · GitLab CI',
      'fact.loc': 'PARIS · SEOUL',
      'md.quote': '> curiosity, method, and learning by building.',
      'md.t1': '## 01 — curiosity & path',
      'md.p1': 'After two years of MPSI/MP preparatory classes at Claude Bernard, I joined ESILV and spent the second semester of my first year on exchange at Hanyang University in Seoul (late February – late June 2026). Now in the Data & AI major (English Track), I also take the Quantum minor in parallel — quantum computing, cryptography, and quantum mechanics. Curiosity and the desire to learn remain my main drivers.',
      'md.t2': '## 02 — research & method',
      'md.p2': 'Building an SRGAN in prep school and later a multi-agent Mistral pipeline taught me to test ideas against objective metrics and dive into new domains. My internship at Atos reinforced how much clean engineering practices — tests, Docker, Kubernetes, CI/CD — matter for reproducible work.',
      'md.t3': '## 03 — listening & teamwork',
      'md.p3': 'Elected student representative for three years — preparatory classes Board representative, then ESILV class rep and Student Life Committee member. Between Vinci Eco Drive (18-page VCU benchmark & KiCad PCB) and tutoring at Acadomia, I practice listening, explaining clearly, and caring about details every day.',
      'md.t4': '## 04 — april 2027',
      'md.p4': 'Looking for a 5-month internship from April 12 to September 7, 2027 in AI Research, Machine Learning, Data Science, or MLOps — eager to grow technically alongside an ambitious team and contribute to meaningful projects.',
      'ft.0': 'Path', 'ft.1': 'Method', 'ft.2': 'Community', 'ft.3': 'April 2027',
      'trk.t1': 'Track', 'trk.t2': '& milestones', 'trk.exp': 'Experience', 'trk.edu': 'Education',
      'exp.atos.r': 'Data Scientist / MLOps — Atos',
      'exp.atos.p': 'GradientBoosting (0.865 ROC AUC, 78% Recall), FastAPI, Docker, Kubernetes & GitLab CI/CD.',
      'exp.vinci.r': 'Embedded Systems — Vinci Eco Drive',
      'exp.vinci.p': '18-page VCU state-of-the-art study (FreeRTOS) and steering wheel PCB design in KiCad.',
      'exp.acad.r': 'Maths & Physics Tutor — Acadomia',
      'exp.acad.p': 'Scientific mentoring for 4 middle and high school students.',
      'edu.esilv.p': 'ML, Deep Learning, MLOps, Quantum track. Class rep & Student Life Committee.',
      'edu.han.p': 'Exchange semester: Signal Processing, Artificial Intelligence, Engineering Mathematics.',
      'edu.cpge.p': 'CS Option, 516 pts CCINP. Elected preparatory classes representative to the Board.',
      'ctc.h1': "Let's talk", 'drawer.repo': 'Open repository', 'drawer.back': '← DESK',
      'footer.rights': 'Built with Gemini 4 Neon.', 'footer.top': '↑ TOP',
      'toast.copied': 'COPIED: tim.barselo@gmail.com'
    }
  };

  let mdMouseX = 0, mdMouseY = 0;

  function updateManifesto() {
    const track = document.getElementById('about');
    if (!track) return;
    const topOffset = 58;
    const viewH = Math.max(1, window.innerHeight - topOffset);
    const rect = track.getBoundingClientRect();
    const scrollable = Math.max(1, track.offsetHeight - viewH);
    const p = Math.max(0, Math.min(1, (topOffset - rect.top) / scrollable));

    const fill = document.getElementById('mdProgressFill');
    if (fill) fill.style.width = `${(p * 100).toFixed(2)}%`;

    const marquee = document.getElementById('mdMarquee');
    if (marquee) marquee.style.transform = `translate3d(${(-p * 38).toFixed(2)}%, -50%, 0)`;

    const scenes = track.querySelectorAll('.md-scene');
    const tabs = document.querySelectorAll('#mdFilmTabs .md-ftab');
    const continuousIdx = p * 3;
    const activeIdx = Math.round(continuousIdx);

    scenes.forEach((sc, i) => {
      const dist = i - continuousIdx;
      const absD = Math.abs(dist);
      const norm = Math.max(0, Math.min(1, (absD - 0.24) / 0.38));
      const vis = 1 - norm * norm * (3 - 2 * norm);
      const moveAmt = Math.sign(dist) * Math.max(0, absD - 0.16);
      const ty = moveAmt * 54;
      const scl = 1 - Math.min(0.06, norm * 0.05);
      sc.style.opacity = vis.toFixed(3);
      sc.style.transform = `translate3d(0, ${ty.toFixed(1)}px, 0) scale(${scl.toFixed(3)})`;
      sc.style.filter = norm > 0.08 ? `blur(${(norm * 4).toFixed(1)}px)` : 'none';
      sc.classList.toggle('is-current', i === activeIdx);
    });

    tabs.forEach((tb, i) => tb.classList.toggle('active', i === activeIdx));

    const portrait = document.getElementById('mdPortrait');
    if (portrait) {
      const px = mdMouseX * -10;
      const py = (0.5 - p) * 28 + mdMouseY * -8;
      portrait.style.transform = `translate3d(${px.toFixed(1)}px, calc(-50% + ${py.toFixed(1)}px), 0)`;
    }
  }

  /* ==================== NATIVE 3D MACBOOK PRO SCREEN WORKSPACE (ZERO HTML OVERLAY!) ==================== */
  let currentKey = null;
  let laptopOpen = false;

  function focusDeskViewport() {
    const vp = document.getElementById('deskViewport');
    if (!vp) return;
    const rect = vp.getBoundingClientRect();
    const targetY = Math.max(0, window.scrollY + rect.top - Math.max(58, (window.innerHeight - rect.height) * 0.5));
    if (lenisInstance) lenisInstance.scrollTo(targetY, { duration: 0.55 });
    else window.scrollTo({ top: targetY, behavior: 'smooth' });
  }

  function openProject(key) {
    const shelfView = document.getElementById('shelfView');
    const listView = document.getElementById('listView');
    if (shelfView?.classList.contains('hidden')) {
      shelfView.classList.remove('hidden');
      listView?.classList.add('hidden');
      document.querySelectorAll('.seg-btn').forEach((x) => x.classList.toggle('active', x.dataset.view === 'shelf'));
      window.dispatchEvent(new Event('resize'));
    }

    currentKey = key;
    laptopOpen = true;
    document.getElementById('deskViewport')?.classList.add('is-focused');
    document.getElementById('shelfCallout')?.classList.remove('visible');
    focusDeskViewport();
    shelfCtrl?.openProjectOnLaptop(key);
  }

  function closeModal() {
    if (!laptopOpen) return;
    laptopOpen = false;
    document.getElementById('deskViewport')?.classList.remove('is-focused');
    shelfCtrl?.returnToDesk();
  }

  function mountLab(key) {
    const stage = document.getElementById('demoStage');
    const bar = document.getElementById('demoControls');
    stage.innerHTML = ''; bar.innerHTML = '';

    if (key === 'anki') {
      stage.innerHTML = `
        <div class="stage-hud">
          <span class="hud-chip" id="ankiIdx">01 / 05 · ANKICARDSGENERATOR</span>
          <span class="hud-chip">${currentLang === 'fr' ? 'Cliquer pour retourner' : 'Click to flip'}</span>
        </div>
        <canvas id="ankiC"></canvas>
      `;
      bar.innerHTML = `
        <div class="bar-group">
          <button type="button" class="tool-btn tool-accent" id="flipB">${currentLang === 'fr' ? 'RETOURNER LA CARTE' : 'FLIP CARD'}</button>
          <button type="button" class="tool-btn" id="nextB">${currentLang === 'fr' ? 'CARTE SUIVANTE →' : 'NEXT CARD →'}</button>
        </div>
        <span class="dim">FIELDNOTE · DECK 5 PROJETS</span>
      `;
      const idxEl = document.getElementById('ankiIdx');
      const c = window.TSB3D.createAnki3D(document.getElementById('ankiC'), () => currentLang, (idx, tag) => {
        idxEl.textContent = `${idx} · ${tag}`;
      });
      document.getElementById('flipB').addEventListener('click', () => c.flipCard());
      document.getElementById('nextB').addEventListener('click', () => c.nextCard());
      activeDemo = c;
    } else if (key === 'alzheimer') {
      stage.innerHTML = `
        <div class="stage-hud">
          <span class="hud-chip">OASIS-1 · 3D CORTEX</span>
          <span class="hud-chip" id="bHud">SLICE 132</span>
        </div>
        <canvas id="brainC"></canvas>
      `;
      bar.innerHTML = `
        <div class="bar-slider">
          <span>SLICE</span>
          <input type="range" id="bSl" min="100" max="160" value="132" />
          <span id="bVal">132</span>
        </div>
        <button type="button" class="tool-btn tool-accent" id="bAuto">AUTO SCAN</button>
      `;
      const sl = document.getElementById('bSl'), vEl = document.getElementById('bVal'), hud = document.getElementById('bHud'), auto = document.getElementById('bAuto');
      const c = window.TSB3D.createBrain3D(document.getElementById('brainC'), (s, attn) => {
        vEl.textContent = String(s);
        if (document.activeElement !== sl) sl.value = String(s);
        hud.textContent = `SLICE ${s} · MIL ${(attn * 100).toFixed(1)}%`;
      });
      sl.addEventListener('input', () => { auto.classList.remove('tool-accent'); c.setSlice(Number(sl.value)); });
      auto.addEventListener('click', () => { auto.classList.add('tool-accent'); c.setAuto(true); });
      activeDemo = c;
    } else if (key === 'srgan') {
      stage.innerHTML = `<canvas id="srC" style="cursor:ew-resize;"></canvas>`;
      bar.innerHTML = `
        <div class="bar-group">
          <button type="button" class="tool-btn sr-b" data-s="1">×1</button>
          <button type="button" class="tool-btn sr-b" data-s="2">×2</button>
          <button type="button" class="tool-btn sr-b tool-accent" data-s="4">×4</button>
        </div>
        <div class="bar-slider">
          <span>LR | HR</span>
          <input type="range" id="srSl" min="5" max="95" value="58" />
        </div>
      `;
      const c = window.TSB3D.createSrganLab(document.getElementById('srC'));
      bar.querySelectorAll('.sr-b').forEach((b) => b.addEventListener('click', () => {
        c.setScale(Number(b.dataset.s));
        bar.querySelectorAll('.sr-b').forEach((x) => x.classList.toggle('tool-accent', x === b));
      }));
      document.getElementById('srSl').addEventListener('input', (e) => c.setSplit(Number(e.target.value) / 100));
      activeDemo = c;
    } else if (key === 'bobslay') {
      stage.innerHTML = `
        <div class="stage-hud">
          <span class="hud-chip">OFF × ON × UPDRS</span>
          <span class="hud-chip" id="bobH">DEBIASED</span>
        </div>
        <canvas id="bobC"></canvas>
      `;
      bar.innerHTML = `
        <div class="bar-group">
          <button type="button" class="tool-btn" id="bobR">${currentLang === 'fr' ? 'BRUT' : 'RAW'}</button>
          <button type="button" class="tool-btn tool-accent" id="bobF">${currentLang === 'fr' ? 'CORRIGÉ' : 'DEBIASED'}</button>
        </div>
        <span class="dim">44 590 VISITS · GROUPKFOLD</span>
      `;
      const c = window.TSB3D.createBobslay3D(document.getElementById('bobC'));
      const bR = document.getElementById('bobR'), bF = document.getElementById('bobF'), h = document.getElementById('bobH');
      bR.addEventListener('click', () => { c.setMode(false); bR.classList.add('tool-accent'); bF.classList.remove('tool-accent'); h.textContent = 'RAW'; });
      bF.addEventListener('click', () => { c.setMode(true); bF.classList.add('tool-accent'); bR.classList.remove('tool-accent'); h.textContent = 'DEBIASED'; });
      activeDemo = c;
    } else if (key === 'churn') {
      stage.innerHTML = `
        <div class="stage-hud">
          <span class="hud-chip" id="chModeHud">${currentLang === 'fr' ? 'KUBERNETES · CLIQUER AU CENTRE POUR XGBOOST' : 'KUBERNETES · CLICK CENTER FOR XGBOOST'}</span>
          <span class="hud-chip" id="chH">ROC AUC 0.865 · RAPPEL 78%</span>
        </div>
        <canvas id="chC"></canvas>
      `;
      bar.innerHTML = `
        <button type="button" class="tool-btn tool-accent" id="chViewBtn">${currentLang === 'fr' ? 'VOIR L’ALGO XGBOOST ▸' : 'INSPECT XGBOOST ▸'}</button>
        <span class="dim">GRADIO MCP · FASTAPI + XGBOOST · GITLAB CI → NEXUS</span>
      `;
      const modeHud = document.getElementById('chModeHud');
      const viewBtn = document.getElementById('chViewBtn');

      const c = window.TSB3D.createChurn3D(
        document.getElementById('chC'),
        (m) => {
          if (m === 'algo') {
            modeHud.textContent = currentLang === 'fr' ? 'XGBOOST · ARBRE DE DÉCISION & RELIEF DE CHURN' : 'XGBOOST · DECISION TREE & CHURN LANDSCAPE';
            viewBtn.textContent = currentLang === 'fr' ? '← RETOUR CLUSTER K8S' : '← BACK TO K8S CLUSTER';
          } else {
            modeHud.textContent = currentLang === 'fr' ? 'KUBERNETES · CLIQUER AU CENTRE POUR XGBOOST' : 'KUBERNETES · CLICK CENTER FOR XGBOOST';
            viewBtn.textContent = currentLang === 'fr' ? 'VOIR L’ALGO XGBOOST ▸' : 'INSPECT XGBOOST ▸';
          }
        },
        (ruleStr) => {
          if (viewBtn.textContent.includes('←')) modeHud.textContent = ruleStr;
        }
      );

      viewBtn.addEventListener('click', () => c.toggleView());
      activeDemo = c;
    }
  }

  /* ==================== THEME, LANG, MOTION & BOOT ==================== */
  function setTheme(theme) {
    currentTheme = theme;
    document.documentElement.setAttribute('data-theme', theme);
    document.getElementById('themeMeta')?.setAttribute('content', theme === 'light' ? '#f3efe6' : '#141312');
    const lbl = document.getElementById('themeLabel');
    if (lbl) lbl.textContent = theme === 'dark' ? 'PAPER' : 'INK';
    try { localStorage.setItem('tsb-theme', theme); } catch {}
    heroCtrl?.syncTheme();
    shelfCtrl?.syncTheme();
  }

  function applyLanguage(lang) {
    currentLang = lang;
    document.documentElement.lang = lang;
    document.documentElement.dataset.lang = lang;
    const dict = I18N[lang];
    document.querySelectorAll('[data-i18n]').forEach((el) => {
      const k = el.getAttribute('data-i18n');
      if (dict[k]) el.innerHTML = dict[k];
    });
    document.querySelectorAll('#langToggle [data-set]').forEach((s) => s.classList.toggle('is-active', s.dataset.set === lang));
    updateManifesto();
    shelfCtrl?.refreshScreen();
  }

  function showToast(msg) {
    const t = document.getElementById('toast');
    if (!t) return;
    t.textContent = msg; t.classList.add('show');
    setTimeout(() => t.classList.remove('show'), 2400);
  }

  function initMotion() {
    if (typeof Lenis !== 'undefined' && !prefersReduced) {
      lenisInstance = new Lenis({ duration: 1.12, easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)), smoothWheel: true });
      lenisInstance.on('scroll', updateManifesto);
      const raf = (time) => { lenisInstance.raf(time); requestAnimationFrame(raf); };
      requestAnimationFrame(raf);
    }
    window.addEventListener('resize', updateManifesto, { passive: true });

    if (typeof gsap !== 'undefined' && !prefersReduced) {
      gsap.from('.hero-title .line-in', { yPercent: 108, duration: 1.0, stagger: 0.09, ease: 'power4.out' });
      gsap.from('.hero-kicker, .hero-foot', { y: 20, opacity: 0, duration: 0.85, stagger: 0.1, delay: 0.18, ease: 'power3.out' });
      if (typeof ScrollTrigger !== 'undefined') {
        gsap.registerPlugin(ScrollTrigger);
        document.querySelectorAll('.reveal').forEach((el) => {
          gsap.from(el, { y: 26, opacity: 0, duration: 0.8, ease: 'power3.out', scrollTrigger: { trigger: el, start: 'top 88%', once: true } });
        });
      }
    }

    const navLinks = document.querySelectorAll('.nav-link');
    const sections = document.querySelectorAll('main section[id]');
    window.addEventListener('scroll', () => {
      let id = '';
      sections.forEach((s) => { if (window.scrollY >= s.offsetTop - 180) id = s.id; });
      navLinks.forEach((a) => a.classList.toggle('active', a.getAttribute('href') === `#${id}`));
      updateManifesto();
    }, { passive: true });

    if (!prefersReduced && !window.matchMedia('(pointer: coarse)').matches) {
      document.querySelectorAll('.magnetic').forEach((btn) => {
        btn.addEventListener('mousemove', (e) => {
          const r = btn.getBoundingClientRect();
          btn.style.transform = `translate(${((e.clientX - (r.left + r.width / 2)) * 0.16).toFixed(1)}px, ${((e.clientY - (r.top + r.height / 2)) * 0.16).toFixed(1)}px)`;
        });
        btn.addEventListener('mouseleave', () => { btn.style.transform = ''; });
      });

      const cur = document.getElementById('studioCursor'), lbl = document.getElementById('cursorLabel');
      if (cur && lbl) {
        let cx = -100, cy = -100, tx = -100, ty = -100;
        window.addEventListener('mousemove', (e) => { tx = e.clientX; ty = e.clientY; cur.classList.add('active'); }, { passive: true });
        document.addEventListener('mouseover', (e) => {
          const t = e.target.closest('[data-cursor]');
          if (t) { lbl.textContent = t.getAttribute('data-cursor'); cur.classList.add('has-label'); }
          else { lbl.textContent = ''; cur.classList.remove('has-label'); }
        });
        const tick = () => { cx += (tx - cx) * 0.22; cy += (ty - cy) * 0.22; cur.style.left = `${cx}px`; cur.style.top = `${cy}px`; requestAnimationFrame(tick); };
        requestAnimationFrame(tick);
      }
    }
  }

  let booted = false;
  function bootPortfolio() {
    if (booted || typeof window.THREE === 'undefined' || document.readyState === 'loading') return;
    booted = true;
    try { currentTheme = localStorage.getItem('tsb-theme') || 'dark'; } catch {}

    heroCtrl = window.TSB3D.createHeroScene(document.getElementById('hero-webgl'), document.getElementById('heroStage'), () => currentTheme);

    const callout = document.getElementById('shelfCallout');
    const items = document.querySelectorAll('#shelfDock .s-item');
    const onHover = (book, idx) => {
      items.forEach((p, i) => p.classList.toggle('is-hovered', i === idx));
      if (!book) { callout.classList.remove('visible'); return; }
      const p = PROJECTS[book.key];
      document.getElementById('tetherMeta').textContent = p.cat[currentLang];
      document.getElementById('tetherTitle').textContent = p.title;
      callout.classList.add('visible');
    };

    shelfCtrl = window.TSB3D.createBookshelf3D(
      document.getElementById('bookshelf-3d'),
      BOOKS_META,
      (key) => {
        currentKey = key;
        laptopOpen = true;
        document.getElementById('deskViewport')?.classList.add('is-focused');
        document.getElementById('shelfCallout')?.classList.remove('visible');
        focusDeskViewport();
      },
      onHover,
      () => currentTheme,
      {
        projects: PROJECTS,
        projectKeys: PROJECT_KEYS,
        getLang: () => currentLang,
        onClose: () => {
          laptopOpen = false;
          document.getElementById('deskViewport')?.classList.remove('is-focused');
        }
      }
    );

    items.forEach((p, idx) => {
      p.addEventListener('mouseenter', () => { if (!laptopOpen) { shelfCtrl.highlightBook(idx); onHover(BOOKS_META[idx], idx); } });
      p.addEventListener('click', () => openProject(p.dataset.project));
    });

    setTheme(currentTheme);
    updateManifesto();
    initMotion();

    document.getElementById('themeToggle')?.addEventListener('click', () => setTheme(currentTheme === 'dark' ? 'light' : 'dark'));
    document.getElementById('langToggle')?.addEventListener('click', () => applyLanguage(currentLang === 'fr' ? 'en' : 'fr'));

    window.addEventListener('pointermove', (e) => {
      mdMouseX = (e.clientX / window.innerWidth) * 2 - 1;
      mdMouseY = (e.clientY / window.innerHeight) * 2 - 1;
      updateManifesto();
    }, { passive: true });

    document.querySelectorAll('#mdFilmTabs .md-ftab').forEach((btn) => {
      btn.addEventListener('click', () => {
        const track = document.getElementById('about');
        if (!track) return;
        const idx = Number(btn.dataset.goto);
        const topOffset = 58;
        const viewH = Math.max(1, window.innerHeight - topOffset);
        const scrollable = Math.max(1, track.offsetHeight - viewH);
        const trackTop = track.getBoundingClientRect().top + window.scrollY;
        const targetY = trackTop - topOffset + (idx / 3) * scrollable;
        if (lenisInstance) lenisInstance.scrollTo(targetY);
        else window.scrollTo({ top: targetY, behavior: 'smooth' });
      });
    });

    const shelfView = document.getElementById('shelfView'), listView = document.getElementById('listView');
    document.querySelectorAll('.seg-btn[data-view]').forEach((b) => b.addEventListener('click', () => {
      const isShelf = b.dataset.view === 'shelf';
      shelfView.classList.toggle('hidden', !isShelf);
      listView.classList.toggle('hidden', isShelf);
      document.querySelectorAll('.seg-btn').forEach((x) => x.classList.toggle('active', x === b));
    }));

    document.querySelectorAll('.work-row[data-project]').forEach((r) => r.addEventListener('click', () => openProject(r.dataset.project)));
    window.addEventListener('keydown', (e) => {
      if (!laptopOpen) return;
      if (e.key === 'Escape') closeModal();
      if (e.key === 'ArrowRight') shelfCtrl?.stepProject(1);
      if (e.key === 'ArrowLeft') shelfCtrl?.stepProject(-1);
    });

    document.getElementById('copyEmailBtn')?.addEventListener('click', async () => {
      const email = 'tim.barselo@gmail.com';
      try { await navigator.clipboard.writeText(email); } catch { window.location.href = `mailto:${email}`; }
      showToast(I18N[currentLang]['toast.copied']);
    });

    const yr = document.getElementById('year');
    if (yr) yr.textContent = String(new Date().getFullYear());
  }

  document.addEventListener('DOMContentLoaded', bootPortfolio);
  window.addEventListener('tsb:three-ready', bootPortfolio);
  bootPortfolio();
})();
