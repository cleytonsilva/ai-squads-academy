import React, { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import { RealtimeChat } from "@/utils/RealtimeAudio";

interface VoiceInterfaceProps {
  onSpeakingChange?: (speaking: boolean) => void;
}

const VoiceInterface: React.FC<VoiceInterfaceProps> = ({ onSpeakingChange = () => {} }) => {
  const { toast } = useToast();
  const [isConnected, setIsConnected] = useState(false);
  const [speaking, setSpeaking] = useState(false);
  const chatRef = useRef<RealtimeChat | null>(null);

  const handleMessage = (event: any) => {
    if (event.type === "response.audio.delta") {
      setSpeaking(true);
      onSpeakingChange(true);
    } else if (event.type === "response.audio.done") {
      setSpeaking(false);
      onSpeakingChange(false);
    }
  };

  const startConversation = async () => {
    try {
      chatRef.current = new RealtimeChat(handleMessage);
      await chatRef.current.init();
      setIsConnected(true);
      toast({ title: "Conectado", description: "Interface de voz pronta" });
    } catch (error: any) {
      console.error("Error starting conversation:", error);
      toast({ title: "Erro", description: error?.message || "Falha ao iniciar", variant: "destructive" });
    }
  };

  const endConversation = () => {
    chatRef.current?.disconnect();
    setIsConnected(false);
    setSpeaking(false);
    onSpeakingChange(false);
  };

  useEffect(() => () => chatRef.current?.disconnect(), []);

  return (
    <div className="fixed bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2">
      <div className="text-xs text-muted-foreground h-4">{speaking ? "Falando…" : ""}</div>
      {!isConnected ? (
        <Button onClick={startConversation} variant="hero">Iniciar Conversa</Button>
      ) : (
        <Button onClick={endConversation} variant="secondary">Encerrar Conversa</Button>
      )}
    </div>
  );
};

export default VoiceInterface;
