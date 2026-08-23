# 🧠 Arquitectura de Grafos Semánticos Progresivos — Antigravity Writer

Este documento detalla la arquitectura técnica detrás del motor de grafos progresivos, la normalización ontológica y los algoritmos de ordenación por dependencias en Antigravity Writer.

---

## 🏗️ 1. Estructura de Almacenamiento

```
<Compendio>/
├── .writer/
│   ├── graph-global.json          # Grafo consolidado acumulado de todo el curso
│   └── graphs/                    # Subgrafos locales aislados por archivo
│       ├── modulo-1/sesion-01.json
│       ├── modulo-1/sesion-02.json
│       └── unassigned/idea-01.json
├── content/
│   ├── modulo-1/
│   │   ├── _index.adoc
│   │   ├── sesion-01.adoc
│   │   └── sesion-02.adoc
│   └── unassigned/                # Bandeja de temas e ideas flotantes
│       └── idea-01.adoc
```

---

## 🔤 2. Normalización de Identificadores Semánticos

Para evitar nodos duplicados con variaciones tipográficas o artículos (ej. `"El Bautismo"`, `"el bautismo."`, `"Bautismo"`), la función `NormalizeConceptID(label)` realiza:
1. Conversión a minúsculas y eliminación de puntuación.
2. Descomposición Unicode NFD para retirar tildes y diacríticos (`ó` $\rightarrow$ `o`, `ñ` preservada).
3. Eliminación de artículos y contracciones en español (`el `, `la `, `los `, `las `, `un `, `una `, `del `, `al `).
4. Sustitución de espacios por guiones medios.

**Ejemplo**:
```
"La Gracia Santificante."  ==>  "gracia-santificante"
"El Bautismo Cristiano"   ==>  "bautismo-cristiano"
```

---

## 🔄 3. Algoritmo de Fusión Progresiva e Idempotente (`MergeChapterGraph`)

Al extraer o guardar el subgrafo de una sesión $S$:
1. Se carga el grafo global actual $G = (V, E)$.
2. Se filtran todas las aristas y ocurrencias previas asociadas exclusivamente al archivo $S$.
3. Para cada nodo local $v_{local} \in V_S$:
   - Si no existe en $G$, se inserta $v_{local}$.
   - Si ya existe en $G$, se actualiza la lista de apariciones (`occurrences`), incrementando el contador de frecuencia y registrando el archivo $S$.
4. Para cada arista local $e_{local} \in E_S$:
   - Se asegura que sus extremos pertenezcan al grafo.
   - Se añade al conjunto de aristas globales con su tipo de relación y grado de confianza.
5. Se persiste $G$ en `.writer/graph-global.json`.

---

## 🚦 4. Evaluación del Semáforo de Madurez (`Readiness Assessment`)

Dado un tema flotante $U \in \text{Unassigned}$ con subgrafo $G_U = (V_U, E_U)$:

1. **Prerrequisitos Entrantes**: $P = \{ u \in V_G \mid (u, v) \in E_U, v \in V_U \}$
2. **Conceptos Impartidos**: $K = \bigcup_{S \in \text{Sesiones}} V_S$
3. **Cálculo del Estado**:
   $$\text{Readiness}(U) = \begin{cases} 
   \text{root} & \text{si } P = \emptyset \\
   \text{ready} & \text{si } P \neq \emptyset \land P \subseteq K \\
   \text{blocked} & \text{si } P \setminus K \neq \emptyset 
   \end{cases}$$

---

## 📊 5. Matriz de Coherencia Curricular (`Curriculum Coherence Matrix`)

La matriz $M$ cruza los conceptos $C = \{c_1, \dots, c_m\}$ contra las sesiones cronológicas ordenadas $S = \{s_1, \dots, s_n\}$:

$$M(c, s_j) = \begin{cases}
\text{"intro"} \ (\bigstar) & \text{si } c \in s_j \land c \notin \bigcup_{k=1}^{j-1} s_k \\
\text{"reinforce"} \ (\bullet) & \text{si } c \in s_j \land c \in \bigcup_{k=1}^{j-1} s_k \\
\text{"premature_warning"} \ (\triangle) & \text{si } c \in s_j \land \exists p \in \text{Prereq}(c) \text{ tal que } p \notin \bigcup_{k=1}^j s_k \\
\text{"empty"} & \text{en otro caso}
\end{cases}$$

---

## 🛡️ 6. Algoritmo del Validador Curricular (`Curriculum Linter`)

El validador ejecuta una auditoría estática multidimensional sobre el grafo global $G = (V, E)$:

1. **Detección de Ciclos de Prerrequisitos (DFS / Tarjan)**:
   - Se construye el subgrafo dirigido de aristas de tipo prerrequisito $E_{\text{prereq}} \subseteq E$.
   - Se ejecuta un recorrido en profundidad con seguimiento de pila de recursión (3 estados: *unvisited*, *visiting*, *visited*).
   - Cualquier arista de retroceso a un nodo con estado *visiting* delata un ciclo circular insoluble $c_1 \to c_2 \to \dots \to c_1$.
2. **Detección de Prerrequisitos Ausentes**:
   - Para toda arista $(u, v) \in E_{\text{prereq}}$ donde $v \in \text{Curso}$, se verifica si $u \in \text{Curso}$. Si $u \notin \text{Curso}$, se emite un diagnóstico de severidad `error`.
3. **Detección de Uso Prematuro**:
   - Sean $\text{idx}(u)$ y $\text{idx}(v)$ los índices de la primera sesión donde se introducen $u$ y $v$. Si $\text{idx}(v) < \text{idx}(u)$, se emite un diagnóstico de severidad `warning`.
4. **Cálculo del Índice de Salud ($H$)**:
   $$H = \max\left(0, 100 - 20 \cdot |\text{Errors}| - 5 \cdot |\text{Warnings}|\right)$$

