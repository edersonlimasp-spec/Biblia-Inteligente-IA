import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";

interface StrongModalProps {
  word: string;
  onClose: () => void;
}

export function StrongModal({ word, onClose }: StrongModalProps) {
  // Mock Strong's data
  const strongData = {
    original: "בְּרֵאשִׁית",
    transliteration: "bərēšîṯ",
    strongNumber: "H7225",
    definition: "Início, começo, primícias",
    root: "רֵאשִׁית (reshith)",
    morphology: "Substantivo feminino",
    occurrences: "50 vezes no Antigo Testamento",
  };

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-w-lg" data-testid="modal-strong">
        <DialogHeader>
          <DialogTitle className="text-2xl font-serif text-primary">
            {strongData.original}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <p className="text-sm text-muted-foreground mb-1">Transliteração</p>
            <p className="font-medium">{strongData.transliteration}</p>
          </div>

          <div className="flex items-center gap-2">
            <Badge variant="outline" className="font-mono">
              {strongData.strongNumber}
            </Badge>
            <Badge variant="secondary">{strongData.morphology}</Badge>
          </div>

          <Separator />

          <div>
            <p className="text-sm font-semibold mb-2 text-primary">Definição</p>
            <p className="leading-relaxed">{strongData.definition}</p>
          </div>

          <div>
            <p className="text-sm font-semibold mb-2 text-primary">Raiz</p>
            <p className="font-serif text-lg">{strongData.root}</p>
          </div>

          <div>
            <p className="text-sm font-semibold mb-2 text-primary">Morfologia</p>
            <p>{strongData.morphology}</p>
          </div>

          <div className="bg-muted/50 p-3 rounded-md">
            <p className="text-xs text-muted-foreground">
              Ocorrências: {strongData.occurrences}
            </p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
