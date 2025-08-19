export default function TopNav() {
  return (
    <header className="w-full border-b border-border bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="flex items-center justify-between px-4 py-3">
        <div className="flex items-center gap-3">
          <img 
            src="/lovable-uploads/aeca3981-62ec-4107-85c4-2f118d51554d.png" 
            alt="AI Squads Academy Logo" 
            className="h-8 w-8 object-contain"
          />
          <h1 className="text-xl font-bold text-foreground">AI Squads Academy</h1>
        </div>
      </div>
    </header>
  );
}
