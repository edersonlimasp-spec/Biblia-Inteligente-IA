import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Copy, CheckCircle, Loader2, QrCode, X } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";

interface PixPaymentModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  plan: string;
  planName: string;
  price: string;
  onSuccess?: () => void;
}

interface PixData {
  paymentId: string;
  qrCode: string;
  qrCodeBase64: string;
  expirationDate: string;
  amount: number;
  planName: string;
  status: string;
}

export function PixPaymentModal({ 
  open, 
  onOpenChange, 
  plan, 
  planName, 
  price,
  onSuccess 
}: PixPaymentModalProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [pixData, setPixData] = useState<PixData | null>(null);
  const [copied, setCopied] = useState(false);
  const [checkingStatus, setCheckingStatus] = useState(false);
  const [paymentApproved, setPaymentApproved] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (open) {
      // Reset state when modal opens
      setPixData(null);
      setPaymentApproved(false);
      setCopied(false);
      generatePix();
    }
  }, [open, plan]);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    
    if (pixData && !paymentApproved) {
      interval = setInterval(async () => {
        try {
          setCheckingStatus(true);
          const response = await apiRequest('GET', `/api/mp/pix-status/${pixData.paymentId}`);
          const data = await response.json();
          
          if (data.approved) {
            setPaymentApproved(true);
            clearInterval(interval);
            toast({
              title: "Pagamento Aprovado!",
              description: "Seu plano foi ativado com sucesso.",
            });
            setTimeout(() => {
              onSuccess?.();
              onOpenChange(false);
            }, 2000);
          }
        } catch (error) {
          console.error("Error checking payment status:", error);
        } finally {
          setCheckingStatus(false);
        }
      }, 5000);
    }
    
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [pixData, paymentApproved]);

  const generatePix = async () => {
    setIsLoading(true);
    try {
      const planMap: Record<string, string> = {
        'gold_monthly': 'gold',
        'premium_monthly': 'premium',
        'strong_lifetime': 'vitalicio',
      };
      
      const planId = planMap[plan] || plan;
      
      const response = await apiRequest('POST', '/api/mp/create-pix', { plan: planId });
      const data = await response.json();
      
      if (data.qrCode) {
        setPixData(data);
      } else {
        throw new Error(data.error || "Erro ao gerar Pix");
      }
    } catch (error: any) {
      console.error("Error generating Pix:", error);
      toast({
        title: "Erro",
        description: error.message || "Não foi possível gerar o Pix",
        variant: "destructive",
      });
      onOpenChange(false);
    } finally {
      setIsLoading(false);
    }
  };

  const copyToClipboard = async () => {
    if (!pixData?.qrCode) return;
    
    try {
      await navigator.clipboard.writeText(pixData.qrCode);
      setCopied(true);
      toast({
        title: "Copiado!",
        description: "Código Pix copiado para a área de transferência",
      });
      setTimeout(() => setCopied(false), 3000);
    } catch (error) {
      toast({
        title: "Erro ao copiar",
        description: "Selecione e copie o código manualmente",
        variant: "destructive",
      });
    }
  };

  const handleClose = () => {
    if (!paymentApproved) {
      setPixData(null);
    }
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md" data-testid="modal-pix-payment">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <QrCode className="h-5 w-5 text-primary" />
            Pagamento via Pix
          </DialogTitle>
          <DialogDescription>
            {planName} - {price}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {isLoading && (
            <div className="flex flex-col items-center justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-primary mb-4" />
              <p className="text-sm text-muted-foreground">Gerando QR Code Pix...</p>
            </div>
          )}

          {paymentApproved && (
            <div className="flex flex-col items-center justify-center py-8">
              <CheckCircle className="h-16 w-16 text-green-500 mb-4" />
              <p className="text-lg font-semibold text-green-600">Pagamento Aprovado!</p>
              <p className="text-sm text-muted-foreground">Seu plano foi ativado.</p>
            </div>
          )}

          {pixData && !isLoading && !paymentApproved && (
            <>
              <div className="flex justify-center">
                <div className="bg-white p-4 rounded-lg">
                  <img 
                    src={`data:image/png;base64,${pixData.qrCodeBase64}`}
                    alt="QR Code Pix"
                    className="w-48 h-48"
                    data-testid="img-pix-qrcode"
                  />
                </div>
              </div>

              <div className="text-center text-sm text-muted-foreground">
                <p>Escaneie o QR Code acima ou copie o código abaixo</p>
              </div>

              <div className="relative">
                <div className="bg-muted p-3 rounded-lg text-xs break-all font-mono max-h-24 overflow-y-auto">
                  {pixData.qrCode}
                </div>
                <Button
                  size="sm"
                  variant={copied ? "default" : "outline"}
                  className="absolute top-2 right-2"
                  onClick={copyToClipboard}
                  data-testid="button-copy-pix"
                >
                  {copied ? (
                    <>
                      <CheckCircle className="h-4 w-4 mr-1" />
                      Copiado
                    </>
                  ) : (
                    <>
                      <Copy className="h-4 w-4 mr-1" />
                      Copiar
                    </>
                  )}
                </Button>
              </div>

              <div className="text-center space-y-2">
                <p className="text-xs text-muted-foreground">
                  Após o pagamento, aguarde alguns segundos para confirmação automática.
                </p>
                {checkingStatus && (
                  <div className="flex items-center justify-center gap-2 text-xs text-primary">
                    <Loader2 className="h-3 w-3 animate-spin" />
                    Verificando pagamento...
                  </div>
                )}
              </div>

              <Button
                variant="outline"
                className="w-full"
                onClick={handleClose}
                data-testid="button-close-pix"
              >
                <X className="h-4 w-4 mr-2" />
                Fechar
              </Button>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
