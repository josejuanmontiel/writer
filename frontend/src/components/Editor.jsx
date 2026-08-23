import React, { useImperativeHandle, forwardRef } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Placeholder from '@tiptap/extension-placeholder';
import Underline from '@tiptap/extension-underline';
import Highlight from '@tiptap/extension-highlight';
import { Table } from '@tiptap/extension-table';
import { TableRow } from '@tiptap/extension-table-row';
import { TableCell } from '@tiptap/extension-table-cell';
import { TableHeader } from '@tiptap/extension-table-header';
import { TaskList } from '@tiptap/extension-task-list';
import { TaskItem } from '@tiptap/extension-task-item';
import TextAlign from '@tiptap/extension-text-align';

import { 
  Bold, Italic, Underline as UnderlineIcon, Strikethrough, Highlighter, Code,
  List, ListOrdered, CheckSquare, 
  Heading1, Heading2, Heading3, Quote, CodeXml, 
  Undo, Redo, Eraser, Lightbulb, AlertTriangle, 
  Bookmark, GraduationCap, Minus, Table as TableIcon,
  AlignLeft, AlignCenter, AlignRight, AlertOctagon, Info,
  Scissors, Layers
} from 'lucide-react';

const MenuBar = ({ editor, onExtractSelection }) => {
  if (!editor) {
    return null;
  }

  const insertAdmonition = (type, title, defaultText) => {
    const html = `
      <div class="admonition-block admonition-${type}" data-admonition="${type}">
        <div class="admonition-header">${title}</div>
        <div class="admonition-body"><p>${defaultText}</p></div>
      </div>
      <p></p>
    `;
    editor.chain().focus().insertContent(html).run();
  };

  const insertTable = () => {
    editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run();
  };

  return (
    <div className="flex flex-wrap items-center gap-1 p-2 border-b border-slate-800 bg-slate-950/90 backdrop-blur-md sticky top-0 z-20 text-xs select-none">
      
      {/* 1. Deshacer / Rehacer */}
      <div className="flex items-center gap-0.5 pr-1.5 border-r border-slate-800">
        <button
          onClick={() => editor.chain().focus().undo().run()}
          disabled={!editor.can().undo()}
          className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded transition-colors disabled:opacity-25"
          title="Deshacer (Ctrl+Z)"
        >
          <Undo size={14} />
        </button>
        <button
          onClick={() => editor.chain().focus().redo().run()}
          disabled={!editor.can().redo()}
          className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded transition-colors disabled:opacity-25"
          title="Rehacer (Ctrl+Y)"
        >
          <Redo size={14} />
        </button>
      </div>

      {/* 2. Jerarquía de Títulos (H1, H2, H3, Párrafo) */}
      <div className="flex items-center gap-0.5 pr-1.5 border-r border-slate-800">
        <button
          onClick={() => editor.chain().focus().setParagraph().run()}
          className={`px-2 py-1 rounded text-xs font-medium transition-all ${
            editor.isActive('paragraph') && !editor.isActive('heading') ? 'bg-indigo-600 text-white font-bold' : 'text-slate-400 hover:text-white hover:bg-slate-800'
          }`}
          title="Texto Normal"
        >
          P
        </button>
        <button
          onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
          className={`px-2 py-1 rounded text-xs font-bold transition-all ${
            editor.isActive('heading', { level: 1 }) ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-400 hover:text-white hover:bg-slate-800'
          }`}
          title="Título Principal (= H1)"
        >
          H1
        </button>
        <button
          onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
          className={`px-2 py-1 rounded text-xs font-bold transition-all ${
            editor.isActive('heading', { level: 2 }) ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-400 hover:text-white hover:bg-slate-800'
          }`}
          title="Sección (== H2)"
        >
          H2
        </button>
        <button
          onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
          className={`px-2 py-1 rounded text-xs font-bold transition-all ${
            editor.isActive('heading', { level: 3 }) ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-400 hover:text-white hover:bg-slate-800'
          }`}
          title="Subsección (=== H3)"
        >
          H3
        </button>
      </div>

      {/* 3. Tipografía y Estilos de Carácter (Word-like) */}
      <div className="flex items-center gap-0.5 pr-1.5 border-r border-slate-800">
        <button
          onClick={() => editor.chain().focus().toggleBold().run()}
          className={`p-1.5 rounded transition-all ${
            editor.isActive('bold') ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white hover:bg-slate-800'
          }`}
          title="Negrita (Ctrl+B / *texto*)"
        >
          <Bold size={14} />
        </button>
        <button
          onClick={() => editor.chain().focus().toggleItalic().run()}
          className={`p-1.5 rounded transition-all ${
            editor.isActive('italic') ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white hover:bg-slate-800'
          }`}
          title="Cursiva (Ctrl+I / _texto_)"
        >
          <Italic size={14} />
        </button>
        <button
          onClick={() => editor.chain().focus().toggleUnderline().run()}
          className={`p-1.5 rounded transition-all ${
            editor.isActive('underline') ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white hover:bg-slate-800'
          }`}
          title="Subrayado (Ctrl+U)"
        >
          <UnderlineIcon size={14} />
        </button>
        <button
          onClick={() => editor.chain().focus().toggleStrike().run()}
          className={`p-1.5 rounded transition-all ${
            editor.isActive('strike') ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white hover:bg-slate-800'
          }`}
          title="Tachado"
        >
          <Strikethrough size={14} />
        </button>
        <button
          onClick={() => editor.chain().focus().toggleHighlight().run()}
          className={`p-1.5 rounded transition-all ${
            editor.isActive('highlight') ? 'bg-amber-500 text-black font-bold' : 'text-slate-400 hover:text-white hover:bg-slate-800'
          }`}
          title="Resaltador fluorescente"
        >
          <Highlighter size={14} />
        </button>
        <button
          onClick={() => editor.chain().focus().toggleCode().run()}
          className={`p-1.5 rounded transition-all ${
            editor.isActive('code') ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white hover:bg-slate-800'
          }`}
          title="Código inline (`código`)"
        >
          <Code size={14} />
        </button>
      </div>

      {/* 4. Alineación de Texto */}
      <div className="flex items-center gap-0.5 pr-1.5 border-r border-slate-800">
        <button
          onClick={() => editor.chain().focus().setTextAlign('left').run()}
          className={`p-1.5 rounded transition-all ${
            editor.isActive({ textAlign: 'left' }) ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white hover:bg-slate-800'
          }`}
          title="Alinear a la izquierda"
        >
          <AlignLeft size={14} />
        </button>
        <button
          onClick={() => editor.chain().focus().setTextAlign('center').run()}
          className={`p-1.5 rounded transition-all ${
            editor.isActive({ textAlign: 'center' }) ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white hover:bg-slate-800'
          }`}
          title="Centrar"
        >
          <AlignCenter size={14} />
        </button>
        <button
          onClick={() => editor.chain().focus().setTextAlign('right').run()}
          className={`p-1.5 rounded transition-all ${
            editor.isActive({ textAlign: 'right' }) ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white hover:bg-slate-800'
          }`}
          title="Alinear a la derecha"
        >
          <AlignRight size={14} />
        </button>
      </div>

      {/* 5. Listas y Checklists */}
      <div className="flex items-center gap-0.5 pr-1.5 border-r border-slate-800">
        <button
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          className={`p-1.5 rounded transition-all ${
            editor.isActive('bulletList') ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white hover:bg-slate-800'
          }`}
          title="Lista con viñetas"
        >
          <List size={14} />
        </button>
        <button
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
          className={`p-1.5 rounded transition-all ${
            editor.isActive('orderedList') ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white hover:bg-slate-800'
          }`}
          title="Lista numerada"
        >
          <ListOrdered size={14} />
        </button>
        <button
          onClick={() => editor.chain().focus().toggleTaskList().run()}
          className={`p-1.5 rounded transition-all ${
            editor.isActive('taskList') ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white hover:bg-slate-800'
          }`}
          title="Lista de tareas / Checklist"
        >
          <CheckSquare size={14} />
        </button>
      </div>

      {/* 6. Estructuras (Citas, Bloque de Código, Tablas, Separador) */}
      <div className="flex items-center gap-0.5 pr-1.5 border-r border-slate-800">
        <button
          onClick={() => editor.chain().focus().toggleBlockquote().run()}
          className={`p-1.5 rounded transition-all ${
            editor.isActive('blockquote') ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white hover:bg-slate-800'
          }`}
          title="Cita en bloque"
        >
          <Quote size={14} />
        </button>
        <button
          onClick={() => editor.chain().focus().toggleCodeBlock().run()}
          className={`p-1.5 rounded transition-all ${
            editor.isActive('codeBlock') ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white hover:bg-slate-800'
          }`}
          title="Bloque de código"
        >
          <CodeXml size={14} />
        </button>
        <button
          onClick={insertTable}
          className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded transition-colors"
          title="Insertar Tabla 3x3"
        >
          <TableIcon size={14} />
        </button>
        <button
          onClick={() => editor.chain().focus().setHorizontalRule().run()}
          className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded transition-colors"
          title="Separador horizontal"
        >
          <Minus size={14} />
        </button>
      </div>

      {/* 7. Bloques Pedagógicos AsciiDoc (Callouts Notion/Word-like) */}
      <div className="flex items-center gap-1 px-1">
        <span className="text-[10px] text-slate-500 font-semibold uppercase tracking-wider mr-0.5">Bloques:</span>
        <button
          onClick={() => insertAdmonition('tip', '💡 CONSEJO PEDAGÓGICO', 'Explicar aquí un truco, anécdota o recomendación clave.')}
          className="flex items-center gap-1 px-2 py-1 rounded bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/20 transition-all text-xs font-medium"
          title="Insertar bloque [TIP] AsciiDoc"
        >
          <Lightbulb size={12} />
          <span>Consejo</span>
        </button>

        <button
          onClick={() => insertAdmonition('warning', '⚠️ ATENCIÓN / SEGURIDAD', 'Instrucción crítica o advertencia importante de taller.')}
          className="flex items-center gap-1 px-2 py-1 rounded bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 border border-amber-500/20 transition-all text-xs font-medium"
          title="Insertar bloque [WARNING] AsciiDoc"
        >
          <AlertTriangle size={12} />
          <span>Aviso</span>
        </button>

        <button
          onClick={() => insertAdmonition('note', '📌 NOTA IMPORTANTE', 'Punto conceptual o recordatorio a destacar.')}
          className="flex items-center gap-1 px-2 py-1 rounded bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-400 border border-indigo-500/20 transition-all text-xs font-medium"
          title="Insertar bloque [NOTE] AsciiDoc"
        >
          <Bookmark size={12} />
          <span>Nota</span>
        </button>

        <button
          onClick={() => insertAdmonition('important', '❗ IMPORTANTE', 'Requisito imprescindible o clave pedagógica.')}
          className="flex items-center gap-1 px-2 py-1 rounded bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/20 transition-all text-xs font-medium"
          title="Insertar bloque [IMPORTANT] AsciiDoc"
        >
          <AlertOctagon size={12} />
          <span>Importante</span>
        </button>

        <button
          onClick={() => insertAdmonition('instructor', '👨‍🏫 SOLO INSTRUCTOR (PROFESOR)', 'Notas didácticas, soluciones de ejercicios o tiempos de clase.')}
          className="flex items-center gap-1 px-2 py-1 rounded bg-purple-500/10 hover:bg-purple-500/20 text-purple-300 border border-purple-500/20 transition-all text-xs font-medium"
          title="Insertar bloque condicional de Instructor"
        >
          <GraduationCap size={12} />
          <span>Profesor</span>
        </button>
      </div>

      {/* 8. Extraer Selección a Tema Flotante (Punto 1.4) */}
      {onExtractSelection && (
        <div className="flex items-center gap-1 pl-1.5 border-l border-slate-800">
          <button
            onClick={() => {
              const { from, to } = editor.state.selection;
              const text = editor.state.doc.textBetween(from, to, '\n');
              if (!text || text.trim().length === 0) {
                alert("Selecciona primero con el ratón el fragmento de texto que deseas extraer como idea flotante.");
                return;
              }
              onExtractSelection(text);
            }}
            className="flex items-center gap-1 px-2 py-1 rounded bg-amber-500/15 hover:bg-amber-500/25 text-amber-300 border border-amber-500/30 transition-all text-xs font-semibold shadow-xs"
            title="Convertir el texto seleccionado en una Idea Flotante independiente"
          >
            <Scissors size={12} />
            <span>Extraer a Flotante</span>
          </button>
        </div>
      )}

      {/* 9. Limpiar Formato */}
      <div className="ml-auto pl-1.5 border-l border-slate-800">
        <button
          onClick={() => editor.chain().focus().unsetAllMarks().clearNodes().run()}
          className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 rounded transition-colors"
          title="Limpiar Formato"
        >
          <Eraser size={14} />
        </button>
      </div>
    </div>
  );
};

const Editor = forwardRef(({ 
  placeholder = 'Empieza a escribir o dicta tu sesión...', 
  initialContent = '', 
  onUpdate,
  previousConcepts = [],
  onExtractGraph,
  onExtractSelection,
  onOpenGraphView,
  isExtractingGraph = false,
  extractedNodesCount = 0
}, ref) => {
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: {
          levels: [1, 2, 3, 4],
        },
      }),
      Placeholder.configure({
        placeholder,
      }),
      Underline,
      Highlight.configure({
        multicolor: false,
      }),
      Table.configure({
        resizable: true,
      }),
      TableRow,
      TableHeader,
      TableCell,
      TaskList,
      TaskItem.configure({
        nested: true,
      }),
      TextAlign.configure({
        types: ['heading', 'paragraph'],
      }),
    ],
    content: initialContent,
    onUpdate: ({ editor }) => {
      if (onUpdate) {
        onUpdate(editor.getHTML());
      }
    },
    editorProps: {
      attributes: {
        class: 'prose prose-invert focus:outline-none max-w-none min-h-[500px] text-base leading-relaxed p-8',
      },
    },
  });

  useImperativeHandle(ref, () => ({
    insertText: (text) => {
      if (editor) {
        editor.commands.insertContent(text + ' ');
      }
    },
    setContent: (content) => {
      if (editor) {
        editor.commands.setContent(content || '');
      }
    },
    getContent: () => editor?.getHTML() || '',
    getText: () => editor?.getText() || '',
  }));

  if (!editor) {
    return null;
  }

  const handleInsertConcept = (conceptLabel) => {
    if (editor) {
      editor.chain().focus().insertContent(`<strong>${conceptLabel}</strong> `).run();
    }
  };

  return (
    <div className="flex-1 w-full overflow-y-auto flex flex-col relative group bg-slate-950/40">
      <MenuBar editor={editor} onExtractSelection={onExtractSelection} />
      
      {/* Barra de Sugerencias de Contexto y Extracción de Grafo (Punto 1.4) */}
      <div className="bg-slate-900/90 border-b border-slate-800/80 px-4 py-2 flex flex-wrap items-center justify-between gap-2 text-xs">
        <div className="flex items-center gap-2 overflow-x-auto py-0.5 flex-1 min-w-0">
          <span className="text-[11px] font-semibold text-slate-400 shrink-0 flex items-center gap-1.5">
            <Lightbulb className="w-3.5 h-3.5 text-amber-400" />
            Conceptos Previos:
          </span>
          {previousConcepts && previousConcepts.length > 0 ? (
            <div className="flex items-center gap-1.5 flex-wrap">
              {previousConcepts.map((c) => (
                <button
                  key={c.id}
                  onClick={() => handleInsertConcept(c.label)}
                  title={`Insertar concepto "${c.label}" (${c.type || 'Concepto'}) en el texto`}
                  className="px-2 py-0.5 rounded-full bg-slate-800 hover:bg-amber-500/20 hover:text-amber-300 text-slate-300 border border-slate-700/80 text-[11px] font-medium transition-all cursor-pointer shadow-xs hover:border-amber-500/40"
                >
                  +{c.label}
                </button>
              ))}
            </div>
          ) : (
            <span className="text-slate-500 text-[11px] italic">
              Sesión inicial del curso (sin conceptos previos requeridos)
            </span>
          )}
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {onExtractGraph && (
            <button
              onClick={onExtractGraph}
              disabled={isExtractingGraph}
              title="Extraer entidades y relaciones con GLiNER2 y sincronizar con el Grafo Global"
              className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-300 border border-indigo-500/30 font-medium text-xs transition-all shadow-sm disabled:opacity-50"
            >
              {isExtractingGraph ? (
                <>
                  <div className="w-3 h-3 border-2 border-indigo-400 border-t-transparent rounded-full animate-spin"></div>
                  <span>Extrayendo con GLiNER2...</span>
                </>
              ) : (
                <>
                  <Bookmark className="w-3.5 h-3.5 text-indigo-400" />
                  <span>Sincronizar Grafo {extractedNodesCount > 0 ? `(${extractedNodesCount})` : ''}</span>
                </>
              )}
            </button>
          )}

          {onOpenGraphView && (
            <button
              onClick={onOpenGraphView}
              title="Abrir vista de IdeaGraph 2.0 y validador curricular"
              className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-medium text-xs transition-all shadow-sm"
            >
              <Layers className="w-3.5 h-3.5 text-amber-400" />
              <span>Ver en Grafo 2.0</span>
            </button>
          )}
        </div>
      </div>

      <div className="flex-1 w-full max-w-4xl mx-auto py-6 px-4">
        <EditorContent editor={editor} />
      </div>
    </div>
  );
});

export default Editor;
