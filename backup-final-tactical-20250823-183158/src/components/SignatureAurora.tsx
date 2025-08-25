import React from "react";

const SignatureAurora: React.FC = () => {
  React.useEffect(() => {
    const mql = window.matchMedia("(prefers-reduced-motion: reduce)");
    if (mql.matches) return;

    const onMove = (e: MouseEvent) => {
      const x = (e.clientX / window.innerWidth) * 100;
      const y = (e.clientY / window.innerHeight) * 100;
      document.documentElement.style.setProperty("--pointer-x", `${x}%`);
      document.documentElement.style.setProperty("--pointer-y", `${y}%`);
    };
    window.addEventListener("mousemove", onMove);
    return () => window.removeEventListener("mousemove", onMove);
  }, []);

  return (
    <div
      aria-hidden
      className="pointer-events-none absolute inset-0 -z-10"
      style={{
        backgroundImage:
          `radial-gradient(40rem 30rem at var(--pointer-x, 50%) var(--pointer-y, 50%), hsl(var(--brand) / 0.15), transparent 60%), var(--gradient-primary)`,
        filter: "saturate(1.1)",
        opacity: 0.6,
        transition: "var(--transition-smooth)",
      }}
    />
  );
};

export default SignatureAurora;
