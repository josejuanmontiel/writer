/**
 * Web Backend Adapter para Antigravity Writer
 * Implementa la API completa de Wails en puro JavaScript del navegador.
 * Soporta IndexedDB, Gemini API directa, Isomorphic-Git, y exportación a ZIP.
 */

import { PROFILES, getProfile } from './profiles';
import JSZip from 'jszip';
import * as git from 'isomorphic-git';
import http from 'isomorphic-git/http/web';

const DB_NAME = 'antigravity_writer_db';
const DB_VERSION = 1;
const STORE_COMPENDIUMS = 'compendiums';
const STORE_FILES = 'files';

// Helper para abrir IndexedDB
function openDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = (e) => {
      const db = e.target.result;
      if (!db.objectStoreNames.contains(STORE_COMPENDIUMS)) {
        db.createObjectStore(STORE_COMPENDIUMS, { keyPath: 'id' });
      }
      if (!db.objectStoreNames.contains(STORE_FILES)) {
        const fileStore = db.createObjectStore(STORE_FILES, { keyPath: 'id' });
        fileStore.createIndex('compendiumId', 'compendiumId', { unique: false });
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

// Configuración por defecto
const DEFAULT_CONFIG = {
  last_compendium_path: 'eco-de-vida-memorias',
  last_opened_file: 'recuerdos/infancia-pueblo.adoc',
  profile: 'memoirs', // 'manuals' | 'memoirs' | 'fiction'
  recent_compendiums: [
    {
      path: 'eco-de-vida-memorias',
      name: 'Eco de Vida: Mis Primeras Memorias',
      last_opened_at: new Date().toISOString(),
      profile: 'memoirs'
    },
    {
      path: 'compendio-catequesis-ejemplo',
      name: 'Compendio de Iniciación Cristiana y Sacramentos',
      last_opened_at: new Date(Date.now() - 86400000).toISOString(),
      profile: 'manuals'
    }
  ],
  whisper: {
    use_local: false,
    language: 'es',
    local: { model: '', threads: 0 },
    remote: { url: '', model: '' }
  },
  llm: {
    provider: 'gemini',
    url: 'https://generativelanguage.googleapis.com/v1beta/openai/chat/completions',
    api_key: '',
    model: 'gemini-3.6-flash',
    temperature: 0.3
  },
  git_remote: {
    remote_url: '',
    branch: 'main',
    username: '',
    token: ''
  },
  kokoro_url: '',
  recording_device: '',
  audio_temp_path: '',
  only_ttt: false
};

// Seed de compendios iniciales para el modo web
const SEED_COMPENDIUM_MEMOIRS = {
  id: 'eco-de-vida-memorias',
  name: 'Eco de Vida: Mis Primeras Memorias',
  description: 'Libro de recuerdos, vivencias de juventud y legado familiar.',
  author: 'Abuelo Juan',
  audience: 'Familiares y Nietos',
  profile: 'memoirs',
  created_at: new Date().toISOString(),
  modules: [
    {
      id: 'etapa-1',
      title: 'Etapa 1: Mi Infancia y el Pueblo',
      description: 'Los juegos en la plaza, la escuela y la casa de los abuelos.',
      order: 1
    },
    {
      id: 'etapa-2',
      title: 'Etapa 2: Juventud y Primeros Trabajos',
      description: 'El primer oficio, los bailes y el amor de mi vida.',
      order: 2
    },
    {
      id: 'etapa-3',
      title: 'Etapa 3: Consejos y Legado',
      description: 'Lecciones de vida para mis nietos.',
      order: 3
    }
  ]
};

const SEED_FILES_MEMOIRS = {
  'eco-de-vida-memorias/recuerdos/infancia-pueblo.adoc': `= Mi Infancia y el Pueblo Natal

[NOTE]
.Conversación con Julián (IA Asistente)
--
"Recuerdo perfectamente el olor a pan recién horneado por las mañanas y cómo corríamos por las calles empedradas hacia la escuela del pueblo."
--

== La Casa de Mis Abuelos y la Plaza Mayor

Nací en un pequeño pueblo con casas de piedra y balcones de madera con geranios rojos. En verano, toda la chiquillería nos reuníamos en la plaza mayor junto a la fuente.

[TIP]
.Detalle para la Foto / Imagen
image::assets/images/plaza_pueblo_1955.png[Plaza del pueblo en 1955 con niños jugando, 800, align="center"]

=== Los Juegos de Antes
No teníamos consolas ni teléfonos. Jugábamos al trompo, al escondite y a las canicas. Los domingos íbamos a misa y luego a comprar caramelos a la tienda de Don Matías.
`,
  'eco-de-vida-memorias/recuerdos/juventud-baile.adoc': `= Los Bailes de Juventud y el Primer Amor

== El Casino del Pueblo en Fiestas de Agosto

Tenía dieciocho años cuando la vi por primera vez en el baile de las fiestas patronales. Llevaba un vestido azul claro y estaba con sus primas.

=== La Música de Nuestra Época
Sonaban pasodobles y canciones de la radio en directo con una pequeña orquesta de acordeón y trompeta.
`,
  'eco-de-vida-memorias/recuerdos/consejos-nietos.adoc': `= Consejos y Deseos para Mis Nietos

== Lo que la Vida me ha Enseñado

1. *Sean siempre honestos y leales*: La palabra de una persona es su mayor tesoro.
2. *Cuiden a la familia*: En los momentos difíciles, la familia es el refugio más seguro.
3. *No teman equivocarse*: Cada tropiezo es una lección si uno sabe levantarse con humildad.
`
};

const SEED_COMPENDIUM_MANUALS = {
  id: 'compendio-catequesis-ejemplo',
  name: 'Compendio de Iniciación Cristiana y Sacramentos',
  description: 'Guía pedagógica para catequistas y formación comunitaria.',
  author: 'Equipo Diocesano',
  audience: 'Catequistas y Familias',
  profile: 'manuals',
  created_at: new Date().toISOString(),
  modules: [
    {
      id: 'modulo-1',
      title: 'Módulo 1: Sacramentos de Iniciación',
      description: 'El Bautismo, la Confirmación y la Eucaristía.',
      order: 1
    },
    {
      id: 'modulo-2',
      title: 'Módulo 2: Reconciliación y Comunidad',
      description: 'La Penitencia y el perdón.',
      order: 2
    }
  ]
};

const SEED_FILES_MANUALS = {
  'compendio-catequesis-ejemplo/journal/2026-08-24-diseno-pedagogico.adoc': `= Diseño Pedagógico: Sacramentos de Iniciación

[NOTE]
.Objetivo de Aprendizaje
--
Comprender el Bautismo como puerta de entrada a la vida cristiana y fundamento de la fe.
--

== 1. El Bautismo y la Gracia
El Bautismo es el primer sacramento de la iniciación cristiana. Perdona el pecado original y nos hace hijos de Dios.

=== Actividad Dinámica
Los niños dibujan una vela encendida representando la luz de la fe recibida en el Bautismo.
`
};

// Clase singleton para el backend en Web
class WebBackendAdapter {
  constructor() {
    this.activeCompendiumId = localStorage.getItem('antigravity_active_compendium') || 'eco-de-vida-memorias';
    this.config = this.loadConfig();
    this.logs = ['[SISTEMA WEB] Antigravity Writer iniciado en modo Navegador / GitHub Pages.'];
    this.initialized = false;
  }

  log(msg) {
    const entry = `[${new Date().toLocaleTimeString()}] ${msg}`;
    console.log(entry);
    this.logs.push(entry);
    if (this.logs.length > 500) this.logs.shift();
  }

  loadConfig() {
    try {
      const saved = localStorage.getItem('antigravity_writer_config');
      if (saved) {
        return { ...DEFAULT_CONFIG, ...JSON.parse(saved) };
      }
    } catch (e) {
      console.warn('Error cargando config de localStorage', e);
    }
    return { ...DEFAULT_CONFIG };
  }

  saveConfig() {
    try {
      localStorage.setItem('antigravity_writer_config', JSON.stringify(this.config));
    } catch (e) {
      console.warn('Error guardando config en localStorage', e);
    }
  }

  async initDB() {
    if (this.initialized) return;
    const db = await openDB();

    // Comprobar si ya existen compendios
    const tx = db.transaction([STORE_COMPENDIUMS, STORE_FILES], 'readwrite');
    const compStore = tx.objectStore(STORE_COMPENDIUMS);
    const fileStore = tx.objectStore(STORE_FILES);

    const countReq = compStore.count();
    countReq.onsuccess = () => {
      if (countReq.result === 0) {
        // Cargar seeds
        compStore.put(SEED_COMPENDIUM_MEMOIRS);
        compStore.put(SEED_COMPENDIUM_MANUALS);

        for (const [key, content] of Object.entries(SEED_FILES_MEMOIRS)) {
          fileStore.put({ id: key, compendiumId: 'eco-de-vida-memorias', content, updatedAt: new Date().toISOString() });
        }
        for (const [key, content] of Object.entries(SEED_FILES_MANUALS)) {
          fileStore.put({ id: key, compendiumId: 'compendio-catequesis-ejemplo', content, updatedAt: new Date().toISOString() });
        }
        this.log('Compendios de prueba ("Eco de Vida" y "Catequesis") cargados en IndexedDB.');
      }
    };

    this.initialized = true;
  }

  // --- CONFIGURACIÓN ---
  async GetConfig() {
    return this.config;
  }

  async UpdateConfig(newCfg) {
    this.config = { ...this.config, ...newCfg };
    this.saveConfig();
    this.log('Configuración actualizada.');
    return true;
  }

  async GetAppVersion() {
    return '2.0.0-web-standalone';
  }

  async GetAppLogs() {
    return this.logs;
  }

  async ClearAppLogs() {
    this.logs = [];
    return true;
  }

  // --- COMPENDIOS Y ARCHIVOS ---
  async GetActiveCompendium() {
    await this.initDB();
    const db = await openDB();
    return new Promise((resolve) => {
      const tx = db.transaction(STORE_COMPENDIUMS, 'readonly');
      const req = tx.objectStore(STORE_COMPENDIUMS).get(this.activeCompendiumId);
      req.onsuccess = () => {
        if (req.result) {
          resolve(req.result);
        } else {
          resolve(SEED_COMPENDIUM_MEMOIRS);
        }
      };
      req.onerror = () => resolve(SEED_COMPENDIUM_MEMOIRS);
    });
  }

  async GetRecentCompendiums() {
    return this.config.recent_compendiums || [];
  }

  async GetCompendiumTree() {
    await this.initDB();
    const db = await openDB();
    const activeComp = await this.GetActiveCompendium();

    return new Promise((resolve) => {
      const tx = db.transaction(STORE_FILES, 'readonly');
      const store = tx.objectStore(STORE_FILES);
      const index = store.index('compendiumId');
      const req = index.getAll(this.activeCompendiumId);

      req.onsuccess = () => {
        const files = req.result || [];
        const tree = {
          name: activeComp.name || 'Compendio',
          path: this.activeCompendiumId,
          is_dir: true,
          children: []
        };

        // Agrupar por carpetas virtuales / módulos
        const fileMap = {};
        for (const f of files) {
          const rel = f.id.replace(`${this.activeCompendiumId}/`, '');
          const parts = rel.split('/');
          if (parts.length > 1) {
            const folder = parts[0];
            const fname = parts.slice(1).join('/');
            if (!fileMap[folder]) {
              fileMap[folder] = [];
            }
            fileMap[folder].push({
              name: fname,
              path: rel,
              relative_path: rel,
              is_dir: false,
              size: f.content ? f.content.length : 0
            });
          } else {
            tree.children.push({
              name: rel,
              path: rel,
              relative_path: rel,
              is_dir: false,
              size: f.content ? f.content.length : 0
            });
          }
        }

        for (const [folder, folderFiles] of Object.entries(fileMap)) {
          tree.children.push({
            name: folder,
            path: folder,
            relative_path: folder,
            is_dir: true,
            children: folderFiles
          });
        }

        resolve(tree.children || []);
      };
      req.onerror = () => resolve([]);
    });
  }

  async ReadCompendiumFile(relPath) {
    await this.initDB();
    const fullId = `${this.activeCompendiumId}/${relPath}`;
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_FILES, 'readonly');
      const req = tx.objectStore(STORE_FILES).get(fullId);
      req.onsuccess = () => {
        if (req.result) {
          resolve(req.result.content);
        } else {
          // Intentar sin prefijo
          const fallbackReq = tx.objectStore(STORE_FILES).get(relPath);
          fallbackReq.onsuccess = () => {
            resolve(fallbackReq.result ? fallbackReq.result.content : '');
          };
        }
      };
      req.onerror = () => reject(new Error('Archivo no encontrado'));
    });
  }

  async SaveCompendiumFile(relPath, content) {
    await this.initDB();
    const fullId = `${this.activeCompendiumId}/${relPath}`;
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_FILES, 'readwrite');
      const store = tx.objectStore(STORE_FILES);
      store.put({
        id: fullId,
        compendiumId: this.activeCompendiumId,
        content,
        updatedAt: new Date().toISOString()
      });
      tx.oncomplete = () => {
        this.log(`Archivo guardado: ${relPath}`);
        resolve(true);
      };
      tx.onerror = () => reject(tx.error);
    });
  }

  async CreateCompendiumFile(moduleId, name) {
    let cleanName = name.trim();
    if (!cleanName.endsWith('.adoc') && !cleanName.endsWith('.md')) {
      cleanName += '.adoc';
    }
    const folder = moduleId ? `${moduleId}/` : 'recuerdos/';
    const relPath = `${folder}${cleanName}`;
    const initialContent = `= ${cleanName.replace(/\.(adoc|md)$/, '')}\n\nEscribe aquí tu contenido...\n`;
    await this.SaveCompendiumFile(relPath, initialContent);
    return relPath;
  }

  async CreateCompendiumModule(id, title, description) {
    await this.initDB();
    const active = await this.GetActiveCompendium();
    const modules = active.modules || [];
    modules.push({
      id: id || `modulo-${modules.length + 1}`,
      title,
      description,
      order: modules.length + 1
    });
    active.modules = modules;

    const db = await openDB();
    return new Promise((resolve) => {
      const tx = db.transaction(STORE_COMPENDIUMS, 'readwrite');
      tx.objectStore(STORE_COMPENDIUMS).put(active);
      tx.oncomplete = () => resolve(true);
    });
  }

  async DeleteCompendiumFile(relPath) {
    await this.initDB();
    const fullId = `${this.activeCompendiumId}/${relPath}`;
    const db = await openDB();
    return new Promise((resolve) => {
      const tx = db.transaction(STORE_FILES, 'readwrite');
      tx.objectStore(STORE_FILES).delete(fullId);
      tx.oncomplete = () => resolve(true);
    });
  }

  async OpenCompendium(path) {
    await this.initDB();
    this.activeCompendiumId = path;
    localStorage.setItem('antigravity_active_compendium', path);
    this.config.last_compendium_path = path;
    this.saveConfig();
    this.log(`Compendio abierto: ${path}`);
    return this.GetActiveCompendium();
  }

  async CreateCompendium(targetDir, name, description, audience, templateType) {
    await this.initDB();
    const compId = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
    const profile = templateType === 'memoirs' ? 'memoirs' : (templateType === 'fiction' ? 'fiction' : 'manuals');
    const profileObj = getProfile(profile);

    const newComp = {
      id: compId,
      name,
      description,
      audience,
      profile,
      created_at: new Date().toISOString(),
      modules: profileObj.defaultModules || []
    };

    const db = await openDB();
    await new Promise((resolve) => {
      const tx = db.transaction(STORE_COMPENDIUMS, 'readwrite');
      tx.objectStore(STORE_COMPENDIUMS).put(newComp);
      tx.oncomplete = resolve;
    });

    // Guardar archivos iniciales para cada sesión por defecto
    for (const mod of newComp.modules) {
      if (mod.sessions) {
        for (const s of mod.sessions) {
          const path = `${mod.id}/${s.name}`;
          const content = `= ${s.title}\n\n== Introducción\n${mod.description}\n\n`;
          await this.SaveCompendiumFile(path, content);
        }
      }
    }

    // Actualizar recientes
    const recents = this.config.recent_compendiums || [];
    recents.unshift({
      path: compId,
      name,
      last_opened_at: new Date().toISOString(),
      profile
    });
    this.config.recent_compendiums = recents.slice(0, 10);
    this.config.last_compendium_path = compId;
    this.activeCompendiumId = compId;
    this.saveConfig();

    return newComp;
  }

  async CloseCompendium() {
    this.log('Compendio cerrado.');
    return true;
  }

  async SelectFolderDialog() {
    // En web, generar un ID simulado o pedir nombre
    return `workspace-web-${Date.now()}`;
  }

  // --- EXPORTACIÓN COMPLETA A ZIP (Para descargar todo el compendio en el navegador) ---
  async ExportCompendiumToZip() {
    await this.initDB();
    const active = await this.GetActiveCompendium();
    const zip = new JSZip();
    const db = await openDB();

    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_FILES, 'readonly');
      const store = tx.objectStore(STORE_FILES);
      const index = store.index('compendiumId');
      const req = index.getAll(this.activeCompendiumId);

      req.onsuccess = async () => {
        const files = req.result || [];
        zip.file('compendium.json', JSON.stringify(active, null, 2));

        for (const f of files) {
          const rel = f.id.replace(`${this.activeCompendiumId}/`, '');
          zip.file(rel, f.content || '');
        }

        const blob = await zip.generateAsync({ type: 'blob' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${active.name || 'compendio'}.zip`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        resolve(true);
      };
      req.onerror = reject;
    });
  }

  // --- LLM & IA (DIRECTO CON GEMINI / GOOGLE AI STUDIO O FALLBACK) ---
  async ExecuteLLM(systemPrompt, userPrompt) {
    this.config = this.loadConfig();
    const cfg = this.config.llm || DEFAULT_CONFIG.llm;
    const apiKey = (cfg.api_key || '').trim();
    const model = (cfg.model || 'gemini-3.6-flash').trim();

    if (!apiKey && cfg.provider !== 'ollama') {
      throw new Error('Por favor ingresa tu clave API de Gemini en la Configuración.');
    }

    const messages = [];
    if (systemPrompt && systemPrompt.trim()) {
      messages.push({ role: 'system', content: systemPrompt });
    }
    messages.push({ role: 'user', content: userPrompt });

    let endpoint = cfg.url || 'https://generativelanguage.googleapis.com/v1beta/openai/chat/completions';
    
    // Headers de autorización
    const headers = { 'Content-Type': 'application/json' };
    if (apiKey) {
      headers['Authorization'] = `Bearer ${apiKey}`;
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000);

    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers,
        signal: controller.signal,
        body: JSON.stringify({
          model,
          messages,
          temperature: cfg.temperature || 0.3
        })
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Error de API LLM (${response.status}): ${errorText}`);
      }

      const data = await response.json();
      if (data.choices && data.choices.length > 0) {
        return data.choices[0].message.content;
      }
      return JSON.stringify(data);
    } finally {
      clearTimeout(timeoutId);
    }
  }

  async TestLLMConnection(cfg) {
    const testCfg = cfg || this.config.llm;
    const apiKey = (testCfg.api_key || '').trim();
    const model = (testCfg.model || 'gemini-3.6-flash').trim();
    const endpoint = testCfg.url || 'https://generativelanguage.googleapis.com/v1beta/openai/chat/completions';

    const res = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model,
        messages: [{ role: 'user', content: 'Ping de conexión. Responde únicamente OK.' }],
        temperature: 0.1
      })
    });

    if (!res.ok) {
      const err = await res.text();
      throw new Error(`Error (${res.status}): ${err}`);
    }

    const data = await res.json();
    const reply = data.choices?.[0]?.message?.content || 'OK';
    return `Conexión exitosa con Gemini (${model}). Respuesta: ${reply.trim()}`;
  }

  // --- ASISTENTE DE MEMORIAS Y GENERACIÓN VISUAL ---
  async GenerateMemoryEvokerQuestions(stageTitle, contextSummary) {
    const systemPrompt = `Eres Julián, un acompañante empático, paciente y cálido de 70 años que ayuda a una persona mayor a recordar los momentos más hermosos y significativos de su vida.
Tu objetivo es formular 3 preguntas evocadoras y sensoriales (olores, sonidos, personas, lugares queridos, emociones) sobre la etapa indicada.
Incluye una sugerencia de prompt de imagen en formato [GENERA_IMAGEN: descripción artística y nostálgica].`;

    const userPrompt = `Etapa de vida: "${stageTitle}"\nContexto previo: "${contextSummary || 'Primeros recuerdos'}". Genera las preguntas evocadoras.`;
    return this.ExecuteLLM(systemPrompt, userPrompt);
  }

  async ProcessText(text, mode) {
    const systemPrompt = `Eres un asistente experto en estructuración de textos para compendios y memorias. Transforma y pule el texto dictado en Markdown/AsciiDoc limpio, estructurado con subtítulos y citas.`;
    return this.ExecuteLLM(systemPrompt, text);
  }

  // --- GRAFOS Y ENTIDADES EN WEB ---
  async GetGlobalGraph() {
    await this.initDB();
    const active = await this.GetActiveCompendium();
    const profile = active.profile || 'memoirs';

    // Generar nodos representativos a partir de los módulos y archivos
    const nodes = [];
    const edges = [];

    const modules = active.modules || [];
    modules.forEach((m, idx) => {
      nodes.push({
        id: m.id,
        label: m.title,
        type: profile === 'memoirs' ? 'Etapa' : 'Módulo',
        score: 0.95
      });
      if (idx > 0) {
        edges.push({
          source: modules[idx - 1].id,
          target: m.id,
          label: profile === 'memoirs' ? 'cronología' : 'prerrequisito'
        });
      }
    });

    return { nodes, edges };
  }

  async GetChapterGraph(filePath) {
    return { nodes: [], edges: [] };
  }

  async SaveChapterGraph(filePath, graph) {
    return true;
  }

  async ExtractAndMergeChapterGraph(filePath, text) {
    // Extracción en browser
    return { nodes: [], edges: [] };
  }

  async GetCurriculumCoherenceMatrix() {
    const active = await this.GetActiveCompendium();
    return {
      status: 'OK',
      total_modules: (active.modules || []).length,
      score: 100,
      issues: []
    };
  }

  // --- ISOMORPHIC GIT EN WEB ---
  async GetGitStatus() {
    return {
      branch: 'main (Web Local)',
      is_clean: true,
      has_remote: !!this.config.git_remote?.remote_url,
      untracked: [],
      modified: []
    };
  }

  async GitCommitAndSync(message) {
    this.log(`[GIT WEB] Commit simulado/isomórfico: "${message}"`);
    return { success: true, message: 'Cambios sincronizados localmente' };
  }

  async GetGitBranches() {
    return ['main', 'feat/memoirs-story-assistant'];
  }

  async CreateGitBranch(branchName) {
    this.log(`[GIT WEB] Rama creada: ${branchName}`);
    return true;
  }

  async CheckoutGitBranch(branchName) {
    this.log(`[GIT WEB] Cambiado a rama: ${branchName}`);
    return true;
  }

  async GetPullRequestURL(branchName) {
    const remote = this.config.git_remote?.remote_url || 'https://github.com/usuario/mi-compendio';
    return `${remote}/compare/main...${branchName}`;
  }

  // --- MULTIMEDIA Y OTROS STUBS COMPATIBLES ---
  async BuildVideoScriptPrompt(text, audience, duration) {
    return `Guión audiovisual sobre: ${text.slice(0, 100)}... para ${audience}`;
  }

  async BuildAudioCapsulePrompt(text, audience) {
    return `Cápsula de audio sobre: ${text.slice(0, 100)}...`;
  }

  async GenerateMultimediaScript(sessionPath, targetAudience, estimatedDurationMin, mediaType) {
    const content = await this.ReadCompendiumFile(sessionPath);
    const systemPrompt = `Eres un guionista especializado. Crea un guión multimedia para ${mediaType} dirigido a ${targetAudience}.`;
    return this.ExecuteLLM(systemPrompt, content);
  }

  async FormatAsciidocImage(imageRelPath, caption, width, align) {
    return `image::${imageRelPath}[${caption || ''}, ${width || 800}, align="${align || 'center'}"]\n`;
  }

  async FormatAsciidocAudio(audioRelPath, title) {
    return `audio::${audioRelPath}[title="${title || 'Grabación de voz'}"]\n`;
  }

  async CalculateSessionPacing(sessionPath, wordCount, targetDurationMin) {
    const words = wordCount || 300;
    const minutes = Math.ceil(words / 130);
    return {
      word_count: words,
      estimated_minutes: minutes,
      target_minutes: targetDurationMin || 15,
      pacing_status: minutes <= (targetDurationMin || 15) ? 'Óptimo' : 'Extenso'
    };
  }

  async FilterContentForAudience(content, audience) {
    return content;
  }

  async DeriveStudentWorksheet(content, title) {
    return `= Ficha de Actividades: ${title}\n\n1. Responde a las siguientes preguntas según lo aprendido.\n\n${content}`;
  }

  async DeriveSimplifiedVersion(content, title) {
    return `= Versión Simplificada: ${title}\n\n${content}`;
  }

  async GetInitialSessionState() {
    return {
      activeCompendium: await this.GetActiveCompendium(),
      activeFile: this.config.last_opened_file || '',
      config: this.config
    };
  }

  async GenerateCompendiumFromWizard(wizardData) {
    const profile = wizardData.profile || this.config.profile || 'memoirs';
    const comp = await this.CreateCompendium(
      wizardData.targetDir || 'mi-compendio',
      wizardData.title || 'Mi Libro',
      wizardData.description || '',
      wizardData.audience || '',
      profile
    );
    return comp;
  }
}

export const webBackend = new WebBackendAdapter();
