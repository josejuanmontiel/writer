import React, { useImperativeHandle, forwardRef } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Placeholder from '@tiptap/extension-placeholder';
import { 
  Bold, Italic, List, ListOrdered, 
  Heading1, Heading2, Quote, 
  Undo, Redo, Eraser
} from 'lucide-react';

const MenuBar = ({ editor }) => {
  if (!editor) {
    return null;
  }

  const buttons = [
    { icon: <Bold size={18} />, action: () => editor.chain().focus().toggleBold().run(), active: 'bold', label: 'Negrita' },
    { icon: <Italic size={18} />, action: () => editor.chain().focus().toggleItalic().run(), active: 'italic', label: 'Cursiva' },
    { icon: <Heading1 size={18} />, action: () => editor.chain().focus().toggleHeading({ level: 1 }).run(), active: { heading: { level: 1 } }, label: 'H1' },
    { icon: <Heading2 size={18} />, action: () => editor.chain().focus().toggleHeading({ level: 2 }).run(), active: { heading: { level: 2 } }, label: 'H2' },
    { icon: <List size={18} />, action: () => editor.chain().focus().toggleBulletList().run(), active: 'bulletList', label: 'Lista' },
    { icon: <ListOrdered size={18} />, action: () => editor.chain().focus().toggleOrderedList().run(), active: 'orderedList', label: 'Lista Num' },
    { icon: <Quote size={18} />, action: () => editor.chain().focus().toggleBlockquote().run(), active: 'blockquote', label: 'Cita' },
  ];

  return (
    <div className="flex items-center gap-1 p-2 border-b border-white/5 bg-black/20 backdrop-blur-sm sticky top-0 z-20">
      <div className="flex items-center gap-0.5 pr-2 border-r border-white/5">
        <button
          onClick={() => editor.chain().focus().undo().run()}
          disabled={!editor.can().undo()}
          className="p-2 text-gray-400 hover:text-white hover:bg-white/5 rounded-lg transition-colors disabled:opacity-30"
          title="Deshacer"
        >
          <Undo size={18} />
        </button>
        <button
          onClick={() => editor.chain().focus().redo().run()}
          disabled={!editor.can().redo()}
          className="p-2 text-gray-400 hover:text-white hover:bg-white/5 rounded-lg transition-colors disabled:opacity-30"
          title="Rehacer"
        >
          <Redo size={18} />
        </button>
      </div>

      <div className="flex items-center gap-0.5 px-2">
        {buttons.map((btn, i) => (
          <button
            key={i}
            onClick={btn.action}
            className={`p-2 rounded-lg transition-all duration-200 ${
              editor.isActive(btn.active) 
              ? 'bg-brand-accent text-white shadow-lg shadow-brand-accent/20' 
              : 'text-gray-400 hover:text-white hover:bg-white/5'
            }`}
            title={btn.label}
          >
            {btn.icon}
          </button>
        ))}
      </div>

      <div className="ml-auto pl-2 border-l border-white/5">
        <button
          onClick={() => editor.chain().focus().unsetAllMarks().clearNodes().run()}
          className="p-2 text-gray-400 hover:text-red-400 hover:bg-red-400/5 rounded-lg transition-colors"
          title="Limpiar Formato"
        >
          <Eraser size={18} />
        </button>
      </div>
    </div>
  );
};

const Editor = forwardRef(({ placeholder = 'Empieza a escribir o dicta tu historia...', initialContent = '', onUpdate }, ref) => {
  const editor = useEditor({
    extensions: [
      StarterKit,
      Placeholder.configure({
        placeholder,
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
        class: 'prose prose-invert focus:outline-none max-w-none min-h-[500px] text-lg leading-relaxed p-8',
      },
    },
  });

  useImperativeHandle(ref, () => ({
    insertText: (text) => {
      if (editor) {
        editor.commands.insertContent(text + ' ');
      }
    },
    getContent: () => editor?.getHTML() || '',
  }));

  if (!editor) {
    return null;
  }

  return (
    <div className="flex-1 w-full overflow-y-auto flex flex-col relative group">
      <MenuBar editor={editor} />
      <div className="flex-1 w-full max-w-4xl mx-auto">
        <EditorContent editor={editor} />
      </div>
    </div>
  );
});

export default Editor;
