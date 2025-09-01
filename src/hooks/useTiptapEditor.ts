import { useEditor, Editor } from '@tiptap/react';
import { useCallback, useEffect, useRef } from 'react';
import { useToast } from "@/hooks/use-toast";

interface UseTiptapEditorProps {
  content: string;
  onChange: (content: string) => void;
  extensions: any[];
  editable?: boolean;
  autosave?: boolean;
  autosaveDelay?: number;
  onSave?: (content: string) => Promise<void>;
  placeholder?: string;
}

interface UseTiptapEditorReturn {
  editor: Editor | null;
  insertImage: (url: string, alt?: string) => void;
  insertYouTube: (url: string) => void;
  getWordCount: () => number;
  getCharacterCount: () => number;
  focus: () => void;
  getHTML: () => string;
  setContent: (content: string) => void;
  isLoading: boolean;
}

/**
 * Hook customizado para gerenciar editores Tiptap
 * Fornece funcionalidades avançadas como autosave, contagem de palavras, etc.
 */
export const useTiptapEditor = ({
  content,
  onChange,
  extensions,
  editable = true,
  autosave = false,
  autosaveDelay = 2000,
  onSave,
  placeholder = 'Digite aqui...'
}: UseTiptapEditorProps) => {
  const { toast } = useToast();
  const autosaveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastSavedContentRef = useRef<string>(content);
  
  const editor = useEditor({
    extensions,
    content,
    editable,
    onUpdate: ({ editor }) => {
      const html = editor.getHTML();
      onChange(html);
      
      // Trigger autosave if enabled
      if (autosave && onSave) {
        if (autosaveTimeoutRef.current) {
          clearTimeout(autosaveTimeoutRef.current);
        }
        
        autosaveTimeoutRef.current = setTimeout(() => {
          if (html !== lastSavedContentRef.current) {
            onSave(html)
              .then(() => {
                lastSavedContentRef.current = html;
                toast({
                  title: "Sucesso!",
                  description: "Conteúdo salvo automaticamente",
                });
              })
              .catch((error) => {
                console.error('Erro no autosave:', error);
                toast({
                  title: "Erro",
                  description: "Erro ao salvar automaticamente",
                  variant: "destructive",
                });
              });
          }
        }, autosaveDelay);
      }
    },
    editorProps: {
      attributes: {
        class: 'tiptap-editor prose prose-lg max-w-none focus:outline-none',
        'data-placeholder': placeholder,
      },
    },
  });

  // Cleanup autosave timeout on unmount
  useEffect(() => {
    return () => {
      if (autosaveTimeoutRef.current) {
        clearTimeout(autosaveTimeoutRef.current);
      }
    };
  }, []);

  // Update content when prop changes (with debounce to prevent infinite loops)
  useEffect(() => {
    if (editor && content !== editor.getHTML()) {
      // Evitar loops infinitos verificando se o conteúdo realmente mudou
      const currentEditorContent = editor.getHTML();
      const normalizedContent = content.trim();
      const normalizedEditorContent = currentEditorContent.trim();
      
      if (normalizedContent !== normalizedEditorContent) {
        console.log('🔄 Atualizando conteúdo do editor Tiptap');
        editor.commands.setContent(content);
        lastSavedContentRef.current = content;
      }
    }
  }, [content, editor]);

  const insertImage = useCallback((url: string, alt?: string) => {
    if (editor) {
      editor.chain().focus().setImage({ src: url, alt }).run();
    }
  }, [editor]);

  const insertYouTube = useCallback((url: string) => {
    if (editor) {
      editor.chain().focus().setYouTubeVideo({ src: url }).run();
    }
  }, [editor]);

  const getWordCount = useCallback(() => {
    if (editor) {
      const text = editor.getText();
      return text.trim().split(/\s+/).filter(word => word.length > 0).length;
    }
    return 0;
  }, [editor]);

  const getCharacterCount = useCallback(() => {
    if (editor) {
      return editor.getText().length;
    }
    return 0;
  }, [editor]);

  const focus = useCallback(() => {
    if (editor) {
      editor.commands.focus();
    }
  }, [editor]);

  const getHTML = useCallback(() => {
    return editor?.getHTML() || '';
  }, [editor]);

  const setContent = useCallback((newContent: string) => {
    if (editor) {
      editor.commands.setContent(newContent);
      lastSavedContentRef.current = newContent;
    }
  }, [editor]);

  return {
    editor,
    insertImage,
    insertYouTube,
    getWordCount,
    getCharacterCount,
    focus,
    getHTML,
    setContent,
    isLoading: !editor,
  };
};

/**
 * Hook simplificado para casos básicos de uso do Tiptap
 */
export const useSimpleTiptapEditor = ({
  content,
  onChange,
  extensions,
  editable = true
}: {
  content: string;
  onChange: (content: string) => void;
  extensions: any[];
  editable?: boolean;
}) => {
  return useTiptapEditor({
    content,
    onChange,
    extensions,
    editable,
    autosave: false,
  });
};

/**
 * Utilitário para migrar conteúdo de outros editores para Tiptap
 */
export const migrateContentToTiptap = (existingContent: any): string => {
  // Se o conteúdo já está em HTML, usar diretamente
  if (typeof existingContent === 'string') {
    return existingContent;
  }
  
  // Se está em formato JSON de outros editores (Quill/TinyMCE), converter
  if (existingContent?.content) {
    return existingContent.content;
  }
  
  // Se é um objeto com HTML
  if (existingContent?.html) {
    return existingContent.html;
  }
  
  // Se é um delta do Quill
  if (existingContent?.ops) {
    // Conversão básica de delta para HTML
    // Em um caso real, seria necessário usar uma biblioteca específica
    return '<p>Conteúdo migrado do Quill</p>';
  }
  
  return '';
};

/**
 * Utilitário para validar conteúdo HTML
 */
export const validateTiptapContent = (content: string): boolean => {
  try {
    // Verificar se é HTML válido básico
    const parser = new DOMParser();
    const doc = parser.parseFromString(content, 'text/html');
    return !doc.querySelector('parsererror');
  } catch {
    return false;
  }
};

/**
 * Utilitário para limpar conteúdo HTML
 */
export const sanitizeTiptapContent = (content: string): string => {
  // Remover scripts e outros elementos perigosos
  const cleanContent = content
    .replace(/<script[^>]*>.*?<\/script>/gi, '')
    .replace(/<iframe[^>]*>.*?<\/iframe>/gi, '')
    .replace(/on\w+="[^"]*"/gi, '')
    .replace(/javascript:/gi, '');
  
  return cleanContent;
};