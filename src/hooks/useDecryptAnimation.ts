import { useState, useEffect } from 'react';

/**
 * Hook customizado para animação de descriptografia de texto
 * @param text - Texto original a ser descriptografado
 * @param duration - Duração da animação em milissegundos (padrão: 2500ms)
 * @returns Texto atual da animação
 */
export function useDecryptAnimation(text: string, duration: number = 2500) {
  const [displayText, setDisplayText] = useState('');
  const [isAnimating, setIsAnimating] = useState(true);

  // Caracteres para simular criptografia
  const cryptoChars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%&*+=?';

  useEffect(() => {
    if (!text || !isAnimating) return;

    // Gerar texto criptografado preservando espaços e estrutura
    const generateCryptoText = (originalText: string) => {
      return originalText.split('').map(char => {
        // Preservar espaços, quebras de linha e pontuação
        if (char === ' ' || char === '\n' || char === '\r' || /[.,!?;:]/.test(char)) {
          return char;
        }
        // Substituir apenas letras e números por caracteres criptografados
        return cryptoChars[Math.floor(Math.random() * cryptoChars.length)];
      }).join('');
    };

    // Inicializar com texto completamente criptografado mantendo estrutura
    setDisplayText(generateCryptoText(text));

    const totalSteps = 30; // Número de passos da animação
    const stepDuration = duration / totalSteps;
    let currentStep = 0;

    const animationInterval = setInterval(() => {
      currentStep++;
      
      // Calcular quantos caracteres devem estar descriptografados
      const revealedCount = Math.floor((currentStep / totalSteps) * text.length);
      
      let newText = '';
      
      for (let i = 0; i < text.length; i++) {
        const char = text[i];
        
        // Sempre preservar espaços, quebras de linha e pontuação
        if (char === ' ' || char === '\n' || char === '\r' || /[.,!?;:]/.test(char)) {
          newText += char;
        } else if (i < revealedCount) {
          // Caractere já descriptografado
          newText += char;
        } else if (i === revealedCount && currentStep < totalSteps) {
          // Caractere sendo descriptografado (efeito de transição)
          newText += Math.random() > 0.5 ? char : cryptoChars[Math.floor(Math.random() * cryptoChars.length)];
        } else {
          // Caractere ainda criptografado
          newText += cryptoChars[Math.floor(Math.random() * cryptoChars.length)];
        }
      }
      
      setDisplayText(newText);
      
      // Finalizar animação
      if (currentStep >= totalSteps) {
        clearInterval(animationInterval);
        setDisplayText(text);
        setIsAnimating(false);
      }
    }, stepDuration);

    // Cleanup
    return () => {
      clearInterval(animationInterval);
    };
  }, [text, duration, isAnimating]);

  return displayText;
}