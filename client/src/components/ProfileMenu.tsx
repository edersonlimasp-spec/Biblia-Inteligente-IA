import { User, LogIn, LogOut, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useAuth } from "@/hooks/useAuth";
import { getLoginUrl, getLogoutUrl } from "@/lib/authUtils";

export function ProfileMenu() {
  const { user, isLoading, isAuthenticated } = useAuth();

  if (isLoading) {
    return (
      <Button variant="ghost" size="icon" className="h-8 w-8" disabled>
        <Loader2 className="h-4 w-4 animate-spin" />
      </Button>
    );
  }

  if (!isAuthenticated) {
    return (
      <Button
        variant="ghost"
        size="icon"
        className="h-8 w-8"
        data-testid="button-login"
        onClick={() => window.location.href = getLoginUrl()}
      >
        <LogIn className="h-4 w-4" />
      </Button>
    );
  }

  const displayName = user?.firstName || user?.name || user?.email || "Usuário";
  const initials = displayName.charAt(0).toUpperCase();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 rounded-full"
          data-testid="button-profile"
        >
          <Avatar className="h-7 w-7">
            <AvatarImage src={user?.profileImageUrl || undefined} alt={displayName} />
            <AvatarFallback className="text-xs bg-primary/10">
              {initials}
            </AvatarFallback>
          </Avatar>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        <div className="px-2 py-1.5">
          <p className="text-sm font-medium truncate" data-testid="text-user-name">
            {displayName}
          </p>
          {user?.email && (
            <p className="text-xs text-muted-foreground truncate" data-testid="text-user-email">
              {user.email}
            </p>
          )}
        </div>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          className="cursor-pointer text-destructive focus:text-destructive"
          onClick={() => window.location.href = getLogoutUrl()}
          data-testid="button-logout"
        >
          <LogOut className="mr-2 h-4 w-4" />
          Sair
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
