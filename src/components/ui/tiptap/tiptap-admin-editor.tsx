'use client';

import React, { forwardRef, useRef, useImperativeHandle } from 'react';
import { Table } from '@tiptap/extension-table';
import { TableRow } from '@tiptap/extension-table-row';
import { TableHeader } from '@tiptap/extension-table-header';
import { TableCell } from '@tiptap/extension-table-cell';
import { TextAlign } from '@tiptap/extension-text-align';
import { Highlight } from '@tiptap/extension-highlight';
import { Color } from '@tiptap/extension-color';
import { TextStyle } from '@tiptap/extension-text-style';
import { CodeBlockLowlight } from '@tiptap/extension-code-block-lowlight';
import { createLowlight } from 'lowlight';
import javascript from 'highlight.js/lib/languages/javascript';
import typescript from 'highlight.js/lib/languages/typescript';
import html from 'highlight.js/lib/languages/xml';
import css from 'highlight.js/lib/languages/css';
import json from 'highlight.js/lib/languages/json';
import python from 'highlight.js/lib/languages/python';
import sql from 'highlight.js/lib/languages/sql';

// Criar instância do lowlight e registrar linguagens
const lowlight = createLowlight();
lowlight.register('javascript', javascript);
lowlight.register('typescript', typescript);
lowlight.register('html', html);
lowlight.register('css', css);
lowlight.register('json', json);
lowlight.register('python', python);
lowlight.register('sql', sql);
import TiptapBaseEditor, { TiptapBaseEditorRef } from './tiptap-base-editor';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  Bold, 
  Italic, 
  Underline, 
  Strikethrough,
  Heading1,
  Heading2,
  Heading3,
  List,
  ListOrdered,
  Quote,
  Code,
  Image,
  Video,
  Link,
  Undo,
  Redo,
  AlignLeft,
  AlignCenter,
  AlignRight,
  AlignJustify,
  Palette,
  Table as TableIcon
} from 'lucide-react';
import { useToast } from "@/hooks/use-toast";

interface TiptapAdminEditorProps {
  content: string;
  onChange: (content: string) => void;
  courseId: string;
  placeholder?: string;
  className?: string;
}

export interface TiptapAdminEditorRef {
  insertImage: (url: string, alt?: string) => void;
  insertYouTube: (url: string) => void;
  focus: () => void;
  getHTML: () => string;
  setContent: (content: string) => void;
}

/**
 * Editor Tiptap para administradores
 * Inclui todas as funcionalidades avançadas de edição
 */
const TiptapAdminEditor = forwardRef<TiptapAdminEditorRef, TiptapAdminEditorProps>((
  {
    content,
    onChange,
    courseId,
    placeholder = 'Digite o conteúdo do módulo...',
    className = ''
  },
  ref
) => {
  const editorRef = useRef<TiptapBaseEditorRef>(null);
  const { toast } = useToast();
  
  // Extensões avançadas para administradores
  const adminExtensions = [
    Table.configure({
      resizable: true,
      HTMLAttributes: {
        class: 'tiptap-table',
      },
    }),
    TableRow.configure({
      HTMLAttributes: {
        class: 'tiptap-table-row',
      },
    }),
    TableHeader.configure({
      HTMLAttributes: {
        class: 'tiptap-table-header',
      },
    }),
    TableCell.configure({
      HTMLAttributes: {
        class: 'tiptap-table-cell',
      },
    }),
    TextAlign.configure({
      types: ['heading', 'paragraph'],
    }),
    Highlight.configure({
      multicolor: true,
      HTMLAttributes: {
        class: 'tiptap-highlight',
      },
    }),
    Color,
    TextStyle,
    CodeBlockLowlight.configure({
      lowlight,
      HTMLAttributes: {
        class: 'tiptap-code-block bg-gray-900 text-gray-100 p-4 rounded-lg overflow-x-auto',
      },
    }),
  ];

  // Expor métodos através da ref
  useImperativeHandle(ref, () => ({
    insertImage: (url: string, alt?: string) => {
      editorRef.current?.insertImage(url, alt);
    },
    insertYouTube: (url: string) => {
      editorRef.current?.insertYouTube(url);
    },
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

  const handleImageUpload = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file && editorRef.current?.editor) {
        // O upload será tratado pelo drag & drop handler do editor base
        const dataTransfer = new DataTransfer();
        dataTransfer.items.add(file);
        const event = new DragEvent('drop', { dataTransfer });
        editorRef.current.editor.view.dom.dispatchEvent(event);
      }
    };
    input.click();
  };

  const handleVideoInsert = () => {
    const url = window.prompt('URL do vídeo (YouTube, Vimeo, etc.):');
    if (url && editorRef.current) {
      // Verificar se é URL do YouTube
      const ytMatch = url.match(/(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|embed\/))([A-Za-z0-9_-]{11})/);
      if (ytMatch) {
        const embedUrl = `https://www.youtube.com/embed/${ytMatch[1]}`;
        editorRef.current.insertYouTube(embedUrl);
      } else {
        toast({
          title: "Erro",
          description: "URL de vídeo inválida. Use URLs do YouTube.",
          variant: "destructive",
        });
      }
    }
  };

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
    <div className="tiptap-admin-editor space-y-2">
      {/* Toolbar */}
      <div className="flex flex-wrap gap-1 p-2 border border-gray-200 rounded-lg bg-gray-50">
        {/* Formatação de texto */}
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
          <ToolbarButton
            onClick={() => editor?.chain().focus().toggleUnderline().run()}
            active={editor?.isActive('underline')}
            title="Sublinhado"
          >
            <Underline className="h-4 w-4" />
          </ToolbarButton>
          <ToolbarButton
            onClick={() => editor?.chain().focus().toggleStrike().run()}
            active={editor?.isActive('strike')}
            title="Riscado"
          >
            <Strikethrough className="h-4 w-4" />
          </ToolbarButton>
        </div>

        {/* Cabeçalhos */}
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

        {/* Listas */}
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

        {/* Alinhamento */}
        <div className="flex gap-1 border-r border-gray-300 pr-2 mr-2">
          <ToolbarButton
            onClick={() => editor?.chain().focus().setTextAlign('left').run()}
            active={editor?.isActive({ textAlign: 'left' })}
            title="Alinhar à esquerda"
          >
            <AlignLeft className="h-4 w-4" />
          </ToolbarButton>
          <ToolbarButton
            onClick={() => editor?.chain().focus().setTextAlign('center').run()}
            active={editor?.isActive({ textAlign: 'center' })}
            title="Centralizar"
          >
            <AlignCenter className="h-4 w-4" />
          </ToolbarButton>
          <ToolbarButton
            onClick={() => editor?.chain().focus().setTextAlign('right').run()}
            active={editor?.isActive({ textAlign: 'right' })}
            title="Alinhar à direita"
          >
            <AlignRight className="h-4 w-4" />
          </ToolbarButton>
          <ToolbarButton
            onClick={() => editor?.chain().focus().setTextAlign('justify').run()}
            active={editor?.isActive({ textAlign: 'justify' })}
            title="Justificar"
          >
            <AlignJustify className="h-4 w-4" />
          </ToolbarButton>
        </div>

        {/* Elementos especiais */}
        <div className="flex gap-1 border-r border-gray-300 pr-2 mr-2">
          <ToolbarButton
            onClick={() => editor?.chain().focus().toggleBlockquote().run()}
            active={editor?.isActive('blockquote')}
            title="Citação"
          >
            <Quote className="h-4 w-4" />
          </ToolbarButton>
          <ToolbarButton
            onClick={() => editor?.chain().focus().toggleCodeBlock().run()}
            active={editor?.isActive('codeBlock')}
            title="Bloco de código"
          >
            <Code className="h-4 w-4" />
          </ToolbarButton>
          <ToolbarButton
            onClick={() => editor?.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run()}
            title="Inserir tabela"
          >
            <TableIcon className="h-4 w-4" />
          </ToolbarButton>
        </div>

        {/* Mídia */}
        <div className="flex gap-1 border-r border-gray-300 pr-2 mr-2">
          <ToolbarButton
            onClick={handleImageUpload}
            title="Inserir imagem"
          >
            <Image className="h-4 w-4" />
          </ToolbarButton>
          <ToolbarButton
            onClick={handleVideoInsert}
            title="Inserir vídeo"
          >
            <Video className="h-4 w-4" />
          </ToolbarButton>
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

      {/* Editor */}
      <TiptapBaseEditor
        ref={editorRef}
        content={content}
        onChange={onChange}
        extensions={adminExtensions}
        courseId={courseId}
        placeholder={placeholder}
        className={`min-h-[400px] ${className}`}
      />
    </div>
  );
});

TiptapAdminEditor.displayName = 'TiptapAdminEditor';

export default TiptapAdminEditor;