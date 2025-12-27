import { useState } from "react";
import { BarChart3, Users, CreditCard, Gift, LogOut, ArrowLeft, HeartPulse, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/contexts/AuthContext";
import { AdminDashboard } from "./admin/AdminDashboard";
import { AdminUsers } from "./admin/AdminUsers";
import { AdminMonetization } from "./admin/AdminMonetization";
import { AdminBonuses } from "./admin/AdminBonuses";
import { AdminSystemHealth } from "./admin/AdminSystemHealth";
import { AdminCampaigns } from "./admin/AdminCampaigns";

interface AdminPanelProps {
  onBack?: () => void;
}

export function AdminPanel({ onBack }: AdminPanelProps) {
  const { user, isSuperAdmin, logout } = useAuth();
  const [activeTab, setActiveTab] = useState("dashboard");

  if (!user || (!isSuperAdmin && user.role !== 'admin')) {
    return (
      <div className="min-h-screen bg-background dark:bg-background text-foreground dark:text-foreground flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-foreground dark:text-foreground mb-2">Acesso Negado</h1>
          <p className="text-muted-foreground mb-4">Você não tem permissão para acessar o painel administrativo.</p>
          <Button onClick={onBack}>Voltar</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background dark:bg-background text-foreground dark:text-foreground">
      {/* Admin Header */}
      <div className="border-b bg-card dark:bg-card sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 py-5">
          <div className="flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <BarChart3 className="h-8 w-8 text-primary flex-shrink-0" />
                <h1 className="text-xl sm:text-2xl font-bold text-foreground">Painel Administrativo</h1>
              </div>
              <Button variant="ghost" size="icon" onClick={onBack} data-testid="button-admin-back">
                <ArrowLeft className="h-4 w-4" />
              </Button>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">
                {user?.role === 'super_admin' ? '👑 Super Admin' : '🔑 Admin'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Admin Tabs */}
      <div className="max-w-7xl mx-auto px-4 py-6">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-6">
            <TabsTrigger value="dashboard" data-testid="tab-dashboard">
              <BarChart3 className="h-4 w-4 mr-2" />
              Dashboard
            </TabsTrigger>
            <TabsTrigger value="users" data-testid="tab-users">
              <Users className="h-4 w-4 mr-2" />
              Usuários
            </TabsTrigger>
            <TabsTrigger value="monetization" data-testid="tab-monetization">
              <CreditCard className="h-4 w-4 mr-2" />
              Monetização
            </TabsTrigger>
            <TabsTrigger value="campaigns" data-testid="tab-campaigns">
              <Mail className="h-4 w-4 mr-2" />
              Campanhas
            </TabsTrigger>
            <TabsTrigger value="bonuses" data-testid="tab-bonuses">
              <Gift className="h-4 w-4 mr-2" />
              Bônus
            </TabsTrigger>
            <TabsTrigger value="health" data-testid="tab-health">
              <HeartPulse className="h-4 w-4 mr-2" />
              Sistema
            </TabsTrigger>
          </TabsList>

          <TabsContent value="dashboard" className="mt-6">
            <AdminDashboard />
          </TabsContent>

          <TabsContent value="users" className="mt-6">
            <AdminUsers isSuperAdmin={isSuperAdmin} />
          </TabsContent>

          <TabsContent value="monetization" className="mt-6">
            <AdminMonetization />
          </TabsContent>

          <TabsContent value="campaigns" className="mt-6">
            <AdminCampaigns />
          </TabsContent>

          <TabsContent value="bonuses" className="mt-6">
            <AdminBonuses isSuperAdmin={isSuperAdmin} />
          </TabsContent>

          <TabsContent value="health" className="mt-6">
            <AdminSystemHealth />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
