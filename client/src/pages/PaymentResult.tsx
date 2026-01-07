import { useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { CheckCircle, XCircle, Clock, ArrowLeft, Home } from 'lucide-react';
import { useLocation } from 'wouter';

type PaymentStatus = 'sucesso' | 'erro' | 'pendente';

interface PaymentResultProps {
  status: PaymentStatus;
}

export function PaymentResult({ status }: PaymentResultProps) {
  const [, setLocation] = useLocation();

  useEffect(() => {
    if (status === 'sucesso') {
      setTimeout(() => {
        setLocation('/');
      }, 5000);
    }
  }, [status, setLocation]);

  const content = {
    sucesso: {
      icon: <CheckCircle className="h-16 w-16 text-green-500" />,
      title: 'Pagamento Confirmado!',
      description: 'Sua assinatura foi ativada com sucesso. Aproveite todos os recursos do seu plano!',
      buttonText: 'Ir para o App',
      buttonAction: () => setLocation('/'),
    },
    erro: {
      icon: <XCircle className="h-16 w-16 text-red-500" />,
      title: 'Pagamento não Processado',
      description: 'Houve um problema com o pagamento. Você pode tentar novamente ou escolher outro método de pagamento.',
      buttonText: 'Tentar Novamente',
      buttonAction: () => setLocation('/subscriptions'),
    },
    pendente: {
      icon: <Clock className="h-16 w-16 text-yellow-500" />,
      title: 'Pagamento Pendente',
      description: 'Estamos aguardando a confirmação do seu pagamento. Assim que for confirmado, sua assinatura será ativada automaticamente.',
      buttonText: 'Voltar ao App',
      buttonAction: () => setLocation('/'),
    },
  };

  const current = content[status];

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="max-w-md w-full p-8 text-center" data-testid={`card-payment-${status}`}>
        <div className="flex justify-center mb-6">
          {current.icon}
        </div>
        
        <h1 className="text-2xl font-bold text-foreground mb-4" data-testid={`text-payment-title-${status}`}>
          {current.title}
        </h1>
        
        <p className="text-muted-foreground mb-8" data-testid={`text-payment-description-${status}`}>
          {current.description}
        </p>
        
        <div className="space-y-3">
          <Button
            onClick={current.buttonAction}
            className="w-full"
            data-testid={`button-payment-action-${status}`}
          >
            {status === 'sucesso' ? <Home className="h-4 w-4 mr-2" /> : <ArrowLeft className="h-4 w-4 mr-2" />}
            {current.buttonText}
          </Button>
          
          {status === 'sucesso' && (
            <p className="text-sm text-muted-foreground">
              Redirecionando automaticamente em 5 segundos...
            </p>
          )}
        </div>
      </Card>
    </div>
  );
}

export function PaymentSuccess() {
  return <PaymentResult status="sucesso" />;
}

export function PaymentError() {
  return <PaymentResult status="erro" />;
}

export function PaymentPending() {
  return <PaymentResult status="pendente" />;
}
