# Material Didáctico y Guión Maestro — Capítulo 10
## Título: Compendium Wizard, Prompt Studio y Git Sync
**Subtítulo:** Generación determinista de esqueletos plurianuales, estudio de prompts multi-LLM, exportación a Canva y colaboración remota Git

---

## 1. Contexto Pedagógico y Filosofía de Diseño

### 1.1. La Culminación del Sistema de Autoría
Enseñar un compendio completo no termina al escribir el texto: requiere estructurar calendarios de varios años lectivos, preparar presentaciones visuales para el aula, generar cápsulas de audio/vídeo y sincronizar el trabajo con otros formadores del equipo.
- Crear manualmente 60 archivos con sus fechas y encabezados lleva horas.
- Exportar ideas a diapositivas o guiones de vídeo suele requerir copiar y pegar tediosamente entre múltiples programas.

### 1.2. La Solución de Antigravity Writer
Antigravity Writer integra la suite completa de producción y colaboración:
1. **Asistente de Estructuración y Calendario (`CompendiumWizardModal`)**:
   - Generación determinista del esqueleto completo en disco (Catequesis de 2 años / 60 sesiones, Curso escolar de 30 semanas o Taller monográfico).
   - Cálculo automático de semanas lectivas, fechas de inicio y plantillas pedagógicas normalizadas sin necesidad de IA.
2. **Prompt & Script Studio (`PromptStudioModal`)**:
   - Generador de escaletas para YouTube/Vídeo con marcas de tiempo, guiones para diapositivas de Canva y esquemas para cápsulas de audio.
   - Motor Dual: Flujo Clipboard 1-clic (para Gemini Web / ChatGPT sin API key) e inferencia directa API (Gemini API, Ollama, Groq).
3. **Sincronización Git Remota (`GitSyncModal`)**:
   - Conexión con GitHub, GitLab o servidor privado mediante token o SSH.
   - Botón `Push / Pull` en la barra lateral para respaldo en la nube y co-autoría en equipo.

---

## 2. Escaleta Audiovisual y Locución (Paso a Paso)

### Bloque 1: Apertura — La suite completa de producción educativa (00:00 – 00:35)
- **Visual:** Vista general de la barra lateral. Clic en el botón *"Asistente de Compendio"* (icono de varita mágica 🧙‍♂️). Se abre el modal `CompendiumWizardModal`.
- **Locución (Voz en off):**
  > "Bienvenidos al capítulo final de nuestra masterclass. Hoy conectaremos todas las piezas del rompecabezas: desde cómo generar un curso completo de 2 años en 10 segundos, hasta cómo crear presentaciones, vídeos y sincronizar tu trabajo en equipo con Git."

### Bloque 2: El Asistente de Calendario Plurianual (00:35 – 01:30)
- **Visual:** En el asistente se selecciona la plantilla: *"Catequesis Plurianual (2 Años - 60 Sesiones)"*, fecha de inicio: *1 de Octubre*, duración: *60 min por clase*. Clic en *"Generar Esqueleto"*. Al instante, el árbol de carpetas se puebla con todos los módulos y 60 sesiones estructuradas.
- **Locución (Voz en off):**
  > "Con el Compendium Wizard no necesitas configurar carpetas a mano. Defines el horizonte temporal —por ejemplo, un curso escolar o un plan bienal de catequesis— y el sistema calcula de forma determinista todas las semanas, fechas y archivos base con plantillas pedagógicas estandarizadas."

### Bloque 3: Prompt Studio — Diapositivas, Vídeos y Cápsulas (01:30 – 02:30)
- **Visual:** Clic en el botón con icono de chispa (*Prompt & Script Studio*). Se selecciona la Sesión 5. Se eligen las opciones:
  - *Generar Esquema de Diapositivas (Canva API)*
  - *Generar Guión de Vídeo con Marcas de Tiempo*
  Clic en *"Copiar Prompt para Gemini"* o *"Ejecutar con Gemini Direct API"*. Aparece el esquema estructurado listo para exportar.
- **Locución (Voz en off):**
  > "En el Prompt Studio transformamos cualquier lección en múltiples formatos con un clic. ¿Necesitas diapositivas para la clase? Genera el esquema para Canva. ¿Quieres publicar un resumen en vídeo? Obtén una escaleta cronometrada. Puedes usar tu propia API key o simplemente copiar el prompt listo para Gemini Web."

### Bloque 4: Sincronización Git Remota y Colaboración (02:30 – 03:25)
- **Visual:** Clic en el icono de rama Git en la barra lateral. Se abre `GitSyncModal`. Se introduce la URL del repositorio remoto en GitHub. Se pulsa *"Sync / Push"*. El indicador de estado cambia a *"Sincronizado con origin/main"*.
- **Locución (Voz en off):**
  > "Todo tu trabajo vive en un repositorio Git local. Con el módulo de sincronización remota, puedes conectar tu compendio con GitHub o el servidor de tu centro educativo. Con un solo clic en 'Push', tus compañeros de equipo reciben las últimas sesiones y tu material queda respaldado de forma segura."

### Bloque 5: Conclusión y Cierre de la Masterclass (03:25 – 04:00)
- **Visual:** Plano final con el logotipo de Antigravity Writer, la interfaz completa brillando y los 10 iconos de los módulos aprendidos.
- **Locución (Voz en off):**
  > "Has completado la formación integral de Antigravity Writer. Ahora cuentas con el poder de escribir libremente, extraer conocimiento en grafos locales, auditar la coherencia curricular de tus cursos y producir contenido multiformato sin fricción. ¡Empieza hoy mismo a crear tu próximo gran compendio!"

---

## 3. Claves de Buenas Prácticas para el Autor
1. **Genera el esqueleto antes de empezar el curso**: El Wizard te proporciona una vista de pájaro de todo el año lectivo desde el primer día.
2. **Usa Git Sync al terminar cada jornada**: Un simple clic en `Push` garantiza que nunca perderás tu trabajo y permite a otros formadores colaborar contigo.
3. **Aprovecha el Prompt Studio para tus materiales de apoyo**: En lugar de empezar tus diapositivas de Canva desde cero, exporta el esquema estructurado generado por la app.
