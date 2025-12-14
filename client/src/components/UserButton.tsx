import { useAuth } from "@/contexts/AuthContext";
import { useRequireAuth } from "@/contexts/AuthGateContext";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { LogIn, LogOut, User, Settings, CreditCard } from "lucide-react";

interface UserButtonProps {
  onNavigateToLogin?: () => void;
  onNavigateToSettings?: () => void;
  onNavigateToSubscriptions?: () => void;
  showSettingsOption?: boolean;
  showSubscriptionOption?: boolean;
}

export function UserButton({
  onNavigateToLogin,
  onNavigateToSettings,
  onNavigateToSubscriptions,
  showSettingsOption = false,
  showSubscriptionOption = false,
}: UserButtonProps) {
  const { user, logout } = useAuth();
  const { requireAuth } = useRequireAuth();

  const getInitials = (name: string | undefined | null, email: string | null) => {
    if (name) {
      return name
        .split(" ")
        .map((n) => n[0])
        .slice(0, 2)
        .join("")
        .toUpperCase();
    }
    return (email || "U").charAt(0).toUpperCase();
  };

  const handleLoginClick = () => {
    if (onNavigateToLogin) {
      onNavigateToLogin();
    } else {
      requireAuth(() => {}, "acessar sua conta");
    }
  };

  if (!user) {
    return (
      <Button
        variant="ghost"
        size="sm"
        onClick={handleLoginClick}
        data-testid="button-login-header"
        className="h-8 gap-1.5"
      >
        <LogIn className="h-4 w-4" />
        <span className="hidden sm:inline">Entrar</span>
      </Button>
    );
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 rounded-full"
          data-testid="button-user-menu"
        >
          <Avatar className="h-8 w-8">
            <AvatarFallback className="bg-primary text-primary-foreground text-xs">
              {getInitials(user.name, user.email)}
            </AvatarFallback>
          </Avatar>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <div className="flex items-center gap-2 p-2">
          <Avatar className="h-8 w-8">
            <AvatarFallback className="bg-primary text-primary-foreground text-xs">
              {getInitials(user.name, user.email)}
            </AvatarFallback>
          </Avatar>
          <div className="flex flex-col">
            <span className="text-sm font-medium truncate max-w-[160px]">
              {user.name || (user.email ? user.email.split("@")[0] : "Usuário")}
            </span>
            <span className="text-xs text-muted-foreground truncate max-w-[160px]">
              {user.email || ""}
            </span>
          </div>
        </div>
        <DropdownMenuSeparator />
        {showSettingsOption && onNavigateToSettings && (
          <DropdownMenuItem onClick={onNavigateToSettings} data-testid="menu-settings">
            <Settings className="h-4 w-4 mr-2" />
            Configurações
          </DropdownMenuItem>
        )}
        {showSubscriptionOption && onNavigateToSubscriptions && (
          <DropdownMenuItem onClick={onNavigateToSubscriptions} data-testid="menu-subscription">
            <CreditCard className="h-4 w-4 mr-2" />
            Assinatura
          </DropdownMenuItem>
        )}
        {(showSettingsOption || showSubscriptionOption) && <DropdownMenuSeparator />}
        <DropdownMenuItem onClick={logout} data-testid="menu-logout">
          <LogOut className="h-4 w-4 mr-2" />
          Sair
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
