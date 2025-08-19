import React, { forwardRef } from 'react';
import ReactQuill, { ReactQuillProps } from 'react-quill';
import 'react-quill/dist/quill.snow.css';

/**
 * Wrapper para ReactQuill que suprime o aviso findDOMNode deprecated
 * Este é um workaround temporário até que o react-quill seja atualizado
 * para ser compatível com React 18+ sem usar findDOMNode
 */
const ReactQuillWrapper = forwardRef<ReactQuill, ReactQuillProps>(
  (props, ref) => {
    // Suprime temporariamente os avisos do console relacionados ao findDOMNode
    React.useEffect(() => {
      const originalConsoleWarn = console.warn;
      const originalConsoleError = console.error;
      
      console.warn = (...args: any[]) => {
        // Filtra avisos relacionados ao findDOMNode do react-quill
        if (
          typeof args[0] === 'string' && 
          (args[0].includes('findDOMNode is deprecated') || 
           args[0].includes('Warning: findDOMNode is deprecated'))
        ) {
          return; // Suprime o aviso
        }
        originalConsoleWarn.apply(console, args);
      };

      console.error = (...args: any[]) => {
        // Filtra erros relacionados ao findDOMNode do react-quill
        if (
          typeof args[0] === 'string' && 
          (args[0].includes('findDOMNode is deprecated') || 
           args[0].includes('Warning: findDOMNode is deprecated'))
        ) {
          return; // Suprime o erro
        }
        originalConsoleError.apply(console, args);
      };

      // Restaura os console originais quando o componente for desmontado
      return () => {
        console.warn = originalConsoleWarn;
        console.error = originalConsoleError;
      };
    }, []);

    return <ReactQuill ref={ref} {...props} />;
  }
);

ReactQuillWrapper.displayName = 'ReactQuillWrapper';

export default ReactQuillWrapper;
export type { ReactQuillProps };