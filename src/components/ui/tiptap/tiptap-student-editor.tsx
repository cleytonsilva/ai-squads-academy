'use client';

import React, { forwardRef, useRef, useImperativeHandle } from 'react';
import TiptapBaseEditor, { TiptapBaseEditorRef } from './tiptap-base-editor';
import { Button } from '@/components/ui/button';
import { 
  Bold, 
  Italic, 
  Heading1,
  Heading2,
  Heading3,
  List,
  ListOrdered,
  Link,
  Undo,
  Redo
} from 'lucide-react';

interface TiptapStudentEditorProps {
  content: string;
  onChange: (content: string) => void;
  courseId?: string;
  placeholder?: string;
  className?: string;
  readOnly?: boolean;
  showToolbar?: boolean;
}

export interface TiptapStudentEditorRef {
  focus: () => void;
  getHTML: () => string;
  setContent: (content: string) => void;
}

/**
 * Editor Tiptap para alunos
 * Funcionalidades limitadas focadas na experiência de aprendizado
 */
const TiptapStudentEditor = forwardRef<TiptapStudentEditorRef, TiptapStudentEditorProps>((
  {
    content,
    onChange,
    courseId,
    placeholder = 'Digite suas anotações...',
    className = '',
    readOnly = false,
    showToolbar = true
  },
  ref
) => {
  const editorRef = useRef<TiptapBaseEditorRef>(null);
  
  // Extensões limitadas para alunos (apenas funcionalidades básicas)
  const studentExtensions: any[] = [
    // Sem extensões avançadas como tabelas, cores, etc.
    // Apenas o que vem do StarterKit básico
  ];

  // Expor métodos através da ref
  useImperativeHandle(ref, () => ({
    focus: () => {
      editorRef.current?.focus();
    },
    getHTML: () => {
      return editorRef.current?.getHTML() || '';
    },
    setContent: (content: string) => {
      editorRef.current?.setContent(content);
    },
  }), []);

  const handleLinkInsert = () => {
    const url = window.prompt('URL do link:');
    if (url && editorRef.current?.editor) {
      editorRef.current.editor.chain().focus().setLink({ href: url }).run();
    }
  };

  const ToolbarButton = ({ onClick, active = false, children, title }: {
    onClick: () => void;
    active?: boolean;
    children: React.ReactNode;
    title: string;
  }) => (
    <Button
      variant={active ? "default" : "ghost"}
      size="sm"
      onClick={onClick}
      title={title}
      className="h-8 w-8 p-0"
    >
      {children}
    </Button>
  );

  const editor = editorRef.current?.editor;

  return (
    <div className="tiptap-student-editor space-y-2">
      {/* Toolbar simplificada para alunos */}
      {showToolbar && !readOnly && (
        <div className="flex flex-wrap gap-1 p-2 border border-gray-200 rounded-lg bg-gray-50">
          {/* Formatação básica */}
          <div className="flex gap-1 border-r border-gray-300 pr-2 mr-2">
            <ToolbarButton
              onClick={() => editor?.chain().focus().toggleBold().run()}
              active={editor?.isActive('bold')}
              title="Negrito"
            >
              <Bold className="h-4 w-4" />
            </ToolbarButton>
            <ToolbarButton
              onClick={() => editor?.chain().focus().toggleItalic().run()}
              active={editor?.isActive('italic')}
              title="Itálico"
            >
              <Italic className="h-4 w-4" />
            </ToolbarButton>
          </div>

          {/* Cabeçalhos básicos */}
          <div className="flex gap-1 border-r border-gray-300 pr-2 mr-2">
            <ToolbarButton
              onClick={() => editor?.chain().focus().toggleHeading({ level: 1 }).run()}
              active={editor?.isActive('heading', { level: 1 })}
              title="Cabeçalho 1"
            >
              <Heading1 className="h-4 w-4" />
            </ToolbarButton>
            <ToolbarButton
              onClick={() => editor?.chain().focus().toggleHeading({ level: 2 }).run()}
              active={editor?.isActive('heading', { level: 2 })}
              title="Cabeçalho 2"
            >
              <Heading2 className="h-4 w-4" />
            </ToolbarButton>
            <ToolbarButton
              onClick={() => editor?.chain().focus().toggleHeading({ level: 3 }).run()}
              active={editor?.isActive('heading', { level: 3 })}
              title="Cabeçalho 3"
            >
              <Heading3 className="h-4 w-4" />
            </ToolbarButton>
          </div>

          {/* Listas básicas */}
          <div className="flex gap-1 border-r border-gray-300 pr-2 mr-2">
            <ToolbarButton
              onClick={() => editor?.chain().focus().toggleBulletList().run()}
              active={editor?.isActive('bulletList')}
              title="Lista com marcadores"
            >
              <List className="h-4 w-4" />
            </ToolbarButton>
            <ToolbarButton
              onClick={() => editor?.chain().focus().toggleOrderedList().run()}
              active={editor?.isActive('orderedList')}
              title="Lista numerada"
            >
              <ListOrdered className="h-4 w-4" />
            </ToolbarButton>
          </div>

          {/* Link */}
          <div className="flex gap-1 border-r border-gray-300 pr-2 mr-2">
            <ToolbarButton
              onClick={handleLinkInsert}
              title="Inserir link"
            >
              <Link className="h-4 w-4" />
            </ToolbarButton>
          </div>

          {/* Undo/Redo */}
          <div className="flex gap-1">
            <ToolbarButton
              onClick={() => editor?.chain().focus().undo().run()}
              title="Desfazer"
            >
              <Undo className="h-4 w-4" />
            </ToolbarButton>
            <ToolbarButton
              onClick={() => editor?.chain().focus().redo().run()}
              title="Refazer"
            >
              <Redo className="h-4 w-4" />
            </ToolbarButton>
          </div>
        </div>
      )}

      {/* Editor */}
      <TiptapBaseEditor
        ref={editorRef}
        content={content}
        onChange={onChange}
        extensions={studentExtensions}
        courseId={courseId}
        placeholder={placeholder}
        className={`min-h-[200px] ${className}`}
        editable={!readOnly}
      />
    </div>
  );
});

TiptapStudentEditor.displayName = 'TiptapStudentEditor';

export default TiptapStudentEditor;