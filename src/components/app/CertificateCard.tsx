import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

export default function CertificateCard({
  title,
  holder,
  number,
  issuedAt,
  refEl,
}: {
  title: string;
  holder: string;
  number?: string | null;
  issuedAt: string;
  refEl?: (el: HTMLDivElement | null) => void;
}) {
  return (
    <div ref={refEl} className="p-4 bg-background">
      <Card className="max-w-xl mx-auto border-2">
        <CardHeader>
          <CardTitle className="text-center text-2xl">Certificado Esquads</CardTitle>
          <CardDescription className="text-center">Reconhecimento de Conclusão</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-center mb-4">Conferimos a</p>
          <p className="text-center text-xl font-semibold">{holder}</p>
          <p className="text-center mt-6">pela conclusão bem-sucedida de</p>
          <p className="text-center text-lg font-medium">{title}</p>
          <div className="mt-6 flex items-center justify-between text-sm text-muted-foreground">
            <span>Nº {number || "—"}</span>
            <span>Emitido em {new Date(issuedAt).toLocaleDateString()}</span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
