import React, { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import { RealtimeChat } from "@/utils/RealtimeAudio";
interface VoiceInterfaceProps {
  onSpeakingChange?: (speaking: boolean) => void;
}
const VoiceInterface: React.FC<VoiceInterfaceProps> = ({
  onSpeakingChange = () => {}
}) => {
  const {
    toast
  } = useToast();
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
      toast({
        title: "Conectado",
        description: "Interface de voz pronta"
      });
    } catch (error: any) {
      console.error("Error starting conversation:", error);
      toast({
        title: "Erro",
        description: error?.message || "Falha ao iniciar",
        variant: "destructive"
      });
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
    <div className="flex items-center gap-2">
      {!isConnected ? (
        <Button onClick={startConversation} aria-label="Conectar voz">
          Conectar Voz
        </Button>
      ) : (
        <>
          <Button variant="secondary" onClick={endConversation} aria-label="Desconectar voz">
            Desconectar
          </Button>
          <span aria-live="polite" className="text-sm opacity-80">
            {speaking ? "Falando..." : "Aguardando áudio"}
          </span>
        </>
      )}
    </div>
  );
};
export default VoiceInterface;