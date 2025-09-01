import React, { forwardRef, useEffect, useRef } from 'react';
import ReactQuill, { ReactQuillProps } from 'react-quill';
import 'react-quill/dist/quill.snow.css';

/**
 * Wrapper para ReactQuill que resolve o warning do findDOMNode deprecated
 * 
 * CONTEXTO: O react-quill ainda usa findDOMNode internamente, que é deprecado no React 18+.
 * Esta é uma solução temporária até que a biblioteca seja atualizada.
 * 
 * SOLUÇÃO: Interceptamos especificamente os warnings do findDOMNode do ReactQuill
 * sem afetar outros warnings importantes do console.
 */
const ReactQuillWrapper = forwardRef<ReactQuill, ReactQuillProps>(
  (props, ref) => {
    const suppressedWarnings = useRef(new Set<string>());
    
    useEffect(() => {
      // Intercepta apenas warnings específicos do findDOMNode do ReactQuill
      const originalWarn = console.warn;
      
      console.warn = (...args: any[]) => {
        const message = args[0];
        
        // Verifica se é especificamente o warning do findDOMNode do ReactQuill
        if (
          typeof message === 'string' && 
          message.includes('findDOMNode is deprecated') &&
          // Verifica se o stack trace inclui react-quill
          (args[1]?.includes?.('ReactQuill') || 
           new Error().stack?.includes('react-quill'))
        ) {
          // Suprime apenas este warning específico e registra que foi suprimido
          const warningKey = 'react-quill-findDOMNode';
          if (!suppressedWarnings.current.has(warningKey)) {
            suppressedWarnings.current.add(warningKey);
            // Log uma única vez para desenvolvedores saberem que o warning foi suprimido
            console.info(
              '🔇 ReactQuill findDOMNode warning suprimido (conhecido e temporário)'
            );
          }
          return;
        }
        
        // Permite todos os outros warnings passarem normalmente
        originalWarn.apply(console, args);
      };

      // Cleanup: restaura o console.warn original
      return () => {
        console.warn = originalWarn;
      };
    }, []);

    return <ReactQuill ref={ref} {...props} />;
  }
);

ReactQuillWrapper.displayName = 'ReactQuillWrapper';

export default ReactQuillWrapper;
export type { ReactQuillProps };