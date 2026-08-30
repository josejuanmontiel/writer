/**
 * Sistema de Perfiles y Toolkits para Antigravity Writer
 * Permite adaptar Writer a:
 * 1. Manuales & Formación (Pedagogía, Sesiones, Fichas de alumno)
 * 2. Memorias de Vida ("Eco de Vida" - Asistente para mayores, recuerdos, fotos y anécdotas)
 * 3. Ficción & Narrativa (Personajes, Arcos, Capítulos, Worldbuilding)
 */

export const PROFILES = {
  manuals: {
    id: 'manuals',
    name: 'Manuales & Formación',
    icon: 'BookOpen',
    badge: 'Pedagógico',
    description: 'Diseño de manuales, catequesis, cursos técnicos y guías de formación estructuradas.',
    terms: {
      compendium: 'Compendio',
      modules: 'Módulos',
      module: 'Módulo',
      sessions: 'Sesiones',
      session: 'Sesión',
      structure: 'Diseño Curricular',
      graph: 'Grafo Conceptual',
      matrix: 'Matriz de Coherencia',
      linter: 'Linter Pedagógico',
      wizard: 'Asistente de Compendio',
      finalOutput: 'Manual / Guía de Formación',
      voiceMemo: 'Memo de Sesión',
      newModuleAction: 'Nuevo Módulo',
      newSessionAction: 'Nueva Sesión',
      audiences: ['Formador', 'Estudiante', 'Autodidacta', 'General']
    },
    defaultModules: [
      {
        id: 'modulo-1',
        title: 'Módulo 1: Fundamentos y Conceptos Básicos',
        description: 'Bases teóricas y primeros principios.',
        sessions: [
          { name: 'sesion-01.adoc', title: 'Sesión 1: Introducción y Contexto' },
          { name: 'sesion-02.adoc', title: 'Sesión 2: Principios Clave' }
        ]
      },
      {
        id: 'modulo-2',
        title: 'Módulo 2: Aplicación Práctica y Dinámicas',
        description: 'Ejercicios grupales y consolidación.',
        sessions: [
          { name: 'sesion-03.adoc', title: 'Sesión 3: Casos Reales y Dinámicas' }
        ]
      }
    ],
    evokerPrompts: [
      "¿Cuáles son los 3 conceptos clave que el alumno debe dominar en esta sesión?",
      "¿Qué errores comunes o conceptos previos debemos aclarar antes?",
      "Propon una dinámica participativa para afianzar este tema."
    ]
  },
  memoirs: {
    id: 'memoirs',
    name: 'Memorias de Vida ("Eco de Vida")',
    icon: 'Heart',
    badge: 'Biográfico & Mayores',
    description: 'Asistente para personas mayores y familias. Graba con voz tus recuerdos, organiza tus anécdotas y crea tu Libro de Vida.',
    terms: {
      compendium: 'Libro de Memorias',
      modules: 'Etapas de Vida',
      module: 'Etapa de Vida',
      sessions: 'Recuerdos & Historias',
      session: 'Recuerdo',
      structure: 'Línea de Vida',
      graph: 'Árbol de Recuerdos (Lugares & Personas)',
      matrix: 'Álbum y Coherencia Cronológica',
      linter: 'Revisor Biográfico',
      wizard: 'Crear Mi Libro de Memorias',
      finalOutput: 'Libro de Vida Familiar (PDF / Impresión)',
      voiceMemo: 'Grabación de Recuerdo',
      newModuleAction: 'Nueva Etapa de Vida',
      newSessionAction: 'Nuevo Recuerdo',
      audiences: ['Familiares e Hijos', 'Nietos y Futuras Generaciones', 'Amigos', 'Público General']
    },
    defaultModules: [
      {
        id: 'etapa-1',
        title: 'Etapa 1: Mi Infancia, Pueblo y Primeros Años',
        description: 'La casa de los abuelos, la escuela, los juegos en la plaza y las fiestas del pueblo.',
        sessions: [
          { name: 'recuerdo-01.adoc', title: 'El patio de la abuela y mi calle de niño' },
          { name: 'recuerdo-02.adoc', title: 'La escuela, los amigos y los veranos en el río' }
        ]
      },
      {
        id: 'etapa-2',
        title: 'Etapa 2: Juventud, Primer Amor y Trabajo',
        description: 'Primeros trabajos, cómo conocí a mi pareja, los bailes de juventud y grandes decisiones.',
        sessions: [
          { name: 'recuerdo-03.adoc', title: 'Mis primeros pasos en el trabajo y la vida adulta' },
          { name: 'recuerdo-04.adoc', title: 'Cómo nos conocimos y el día de nuestra boda' }
        ]
      },
      {
        id: 'etapa-3',
        title: 'Etapa 3: La Familia, los Hijos y Momentos Inolvidables',
        description: 'El nacimiento de los hijos, vacaciones familiares, anécdotas divertidas y superación.',
        sessions: [
          { name: 'recuerdo-05.adoc', title: 'La llegada de los hijos y los años en el hogar' },
          { name: 'recuerdo-06.adoc', title: 'Anécdotas divertidas y celebraciones familiares' }
        ]
      },
      {
        id: 'etapa-4',
        title: 'Etapa 4: Mis Consejos, Sabiduría y Legado para mis Nietos',
        description: 'Lo que la vida me ha enseñado, valores importantes y mensajes para el futuro.',
        sessions: [
          { name: 'recuerdo-07.adoc', title: 'Las lecciones más valiosas que aprendí' },
          { name: 'recuerdo-08.adoc', title: 'Mi mensaje y deseos para mis nietos' }
        ]
      }
    ],
    evokerPrompts: [
      "¿Cómo era la casa donde te criaste? ¿Recuerdas los olores, la comida de tu madre o los juegos en la calle?",
      "¿Cuál fue la fiesta o celebración más emocionante de tu juventud?",
      "¿Qué objeto especial o foto guardas con más cariño y qué historia tiene detrás?",
      "Si pudieras darle un único consejo a tus nietos hoy, ¿cuál sería?"
    ]
  },
  fiction: {
    id: 'fiction',
    name: 'Ficción & Narrativa',
    icon: 'Sparkles',
    badge: 'Narrativa',
    description: 'Novelas, relatos, guiones y cuentos. Gestión de personajes, tramas, actos y worldbuilding.',
    terms: {
      compendium: 'Manuscrito',
      modules: 'Actos / Arcos',
      module: 'Acto',
      sessions: 'Capítulos & Escenas',
      session: 'Capítulo',
      structure: 'Escaleta Narrativa',
      graph: 'Grafo de Personajes & Tramas',
      matrix: 'Matriz de Conflictos',
      linter: 'Linter Narrativo',
      wizard: 'Generador de Novela / Relato',
      finalOutput: 'Libro / Manuscrito Final',
      voiceMemo: 'Nota de Voz de Guión',
      newModuleAction: 'Nuevo Acto',
      newSessionAction: 'Nuevo Capítulo',
      audiences: ['Lector General', 'Young Adult', 'Infantil', 'Especializado']
    },
    defaultModules: [
      {
        id: 'acto-1',
        title: 'Acto 1: Planteamiento y Detonante',
        description: 'Presentación del protagonista, el mundo ordinario y el incidente incitador.',
        sessions: [
          { name: 'capitulo-01.adoc', title: 'Capítulo 1: El Mundo Ordinario' },
          { name: 'capitulo-02.adoc', title: 'Capítulo 2: La Llamada a la Aventura' }
        ]
      },
      {
        id: 'acto-2',
        title: 'Acto 2: Nudo y Confrontación',
        description: 'Obstáculos, aliados, pruebas y el punto medio.',
        sessions: [
          { name: 'capitulo-03.adoc', title: 'Capítulo 3: Pruebas y Nuevos Aliados' },
          { name: 'capitulo-04.adoc', title: 'Capítulo 4: La Caída y Revelación' }
        ]
      },
      {
        id: 'acto-3',
        title: 'Acto 3: Clímax y Desenlace',
        description: 'La gran confrontación final y la nueva normalidad.',
        sessions: [
          { name: 'capitulo-05.adoc', title: 'Capítulo 5: El Clímax' },
          { name: 'capitulo-06.adoc', title: 'Capítulo 6: El Regreso Renovado' }
        ]
      }
    ],
    evokerPrompts: [
      "¿Cuál es el mayor miedo de tu protagonista y qué secreto oculta?",
      "¿Qué giro inesperado en este capítulo romperá los planes de los personajes?",
      "Describe la atmósfera sensorial del lugar donde transcurre esta escena."
    ]
  }
};

export function getProfile(profileId = 'manuals') {
  return PROFILES[profileId] || PROFILES.manuals;
}
