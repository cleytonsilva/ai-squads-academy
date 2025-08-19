import { useEffect } from "react";
import HomePage from "@/components/landing/HomePage";

const Index = () => {
  useEffect(() => {
    document.title = "AI Squads Academy — Educação Tech por IA";
  }, []);

  return (
    <HomePage />
  );
};

export default Index;