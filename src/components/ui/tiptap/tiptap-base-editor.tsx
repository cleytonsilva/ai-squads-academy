'use client';

import React, { forwardRef, useImperativeHandle, useCallback, useEffect } from 'react';
import { useEditor, EditorContent, Editor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Image from '@tiptap/extension-image';
import Link from '@tiptap/extension-link';
import Youtube from '@tiptap/extension-youtube';
import { uploadImageToSupabase } from './extensions/supabase-storage';
import { useToast } from "@/hooks/use-toast";
import './styles/tiptap.css';

interface TiptapBaseEditorProps {
  content: string;
  onChange: (content: string) => void;
  extensions?: any[];
  editable?: boolean;
  placeholder?: string;
  className?: string;
  courseId?: string;
}

export interface TiptapBaseEditorRef {
  editor: Editor | null;
  insertImage: (url: string, alt?: string) => void;
  insertYouTube: (url: string) => void;
  focus: () => void;
  getHTML: () => string;
  setContent: (content: string) => void;
}

/**
 * Componente base do editor Tiptap
 * Fornece funcionalidades básicas de edição e serve como base para editores especializados
 */
const TiptapBaseEditor = forwardRef<TiptapBaseEditorRef, TiptapBaseEditorProps>((
  {
    content,
    onChange,
    extensions = [],
    editable = true,
    placeholder = 'Digite seu conteúdo...',
    className = '',
    courseId
  },
  ref
) => {
  const { toast } = useToast();
  
  const handleImageUpload = useCallback(async (file: File) => {
    if (!courseId) {
      toast({
        title: "Erro",
        description: "Course ID é necessário para upload de imagens",
        variant: "destructive",
      });
      throw new Error('Course ID é necessário para upload de imagens');
    }
    return await uploadImageToSupabase(file, courseId, toast);
  }, [courseId, toast]);

  const baseExtensions = [
    StarterKit.configure({
      heading: {
        levels: [1, 2, 3, 4, 5, 6],
      },
      bulletList: {
        HTMLAttributes: {
          class: 'tiptap-bullet-list',
        },
      },
      orderedList: {
        HTMLAttributes: {
          class: 'tiptap-ordered-list',
        },
      },
      blockquote: {
        HTMLAttributes: {
          class: 'tiptap-blockquote',
        },
      },
      codeBlock: {
        HTMLAttributes: {
          class: 'tiptap-code-block',
        },
      },
    }),
    Image.configure({
      HTMLAttributes: {
        class: 'tiptap-image rounded-lg max-w-full h-auto shadow-md',
      },
      allowBase64: false,
    }),
    Link.configure({
      openOnClick: false,
      HTMLAttributes: {
        class: 'tiptap-link text-blue-600 hover:text-blue-800 underline cursor-pointer',
        target: '_blank',
        rel: 'noopener noreferrer',
      },
    }),
    Youtube.configure({
      width: 640,
      height: 480,
      HTMLAttributes: {
        class: 'tiptap-youtube rounded-lg shadow-md',
      },
    }),
    ...extensions,
  ];

  const editor = useEditor({
    extensions: baseExtensions,
    content,
    editable,
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML());
    },
    editorProps: {
      attributes: {
        class: `tiptap-editor prose prose-lg max-w-none focus:outline-none min-h-[200px] p-4 ${className}`,
        'data-placeholder': placeholder,
      },
      handleDrop: (view, event, slice, moved) => {
        if (!moved && event.dataTransfer && event.dataTransfer.files && event.dataTransfer.files[0]) {
          const file = event.dataTransfer.files[0];
          if (file.type.startsWith('image/')) {
            event.preventDefault();
            handleImageUpload(file).then((url) => {
              const { schema } = view.state;
              const coordinates = view.posAtCoords({ left: event.clientX, top: event.clientY });
              if (coordinates) {
                const node = schema.nodes.image.create({ src: url });
                const transaction = view.state.tr.insert(coordinates.pos, node);
                view.dispatch(transaction);
              }
            }).catch((error) => {
              console.error('Erro no upload da imagem:', error);
            });
            return true;
          }
        }
        return false;
      },
      handlePaste: (view, event, slice) => {
        const items = Array.from(event.clipboardData?.items || []);
        const imageItem = items.find(item => item.type.startsWith('image/'));
        
        if (imageItem) {
          event.preventDefault();
          const file = imageItem.getAsFile();
          if (file) {
            handleImageUpload(file).then((url) => {
              const { schema } = view.state;
              const { selection } = view.state;
              const node = schema.nodes.image.create({ src: url });
              const transaction = view.state.tr.replaceSelectionWith(node);
              view.dispatch(transaction);
            }).catch((error) => {
              console.error('Erro no upload da imagem:', error);
            });
          }
          return true;
        }
        return false;
      },
    },
  });

  // Sincronizar conteúdo quando o prop content muda
  useEffect(() => {
    if (editor && content !== editor.getHTML()) {
      // Evitar loops infinitos verificando se o conteúdo realmente mudou
      const currentEditorContent = editor.getHTML();
      const normalizedContent = content.trim();
      const normalizedEditorContent = currentEditorContent.trim();
      
      if (normalizedContent !== normalizedEditorContent) {
        console.log('🔄 [TiptapBaseEditor] Atualizando conteúdo do editor');
        editor.commands.setContent(content);
      }
    }
  }, [content, editor]);

  // Expor métodos através da ref
  useImperativeHandle(ref, () => ({
    editor,
    insertImage: (url: string, alt?: string) => {
      if (editor) {
        editor.chain().focus().setImage({ src: url, alt }).run();
      }
    },
    insertYouTube: (url: string) => {
      if (editor) {
        editor.chain().focus().setYouTubeVideo({ src: url }).run();
      }
    },
    focus: () => {
      if (editor) {
        editor.commands.focus();
      }
    },
    getHTML: () => {
      return editor?.getHTML() || '';
    },
    setContent: (content: string) => {
      if (editor) {
        editor.commands.setContent(content);
      }
    },
  }), [editor]);

  return (
    <div className="tiptap-wrapper border border-gray-200 rounded-lg overflow-hidden">
      <EditorContent editor={editor} />
    </div>
  );
});

TiptapBaseEditor.displayName = 'TiptapBaseEditor';

export default TiptapBaseEditor;