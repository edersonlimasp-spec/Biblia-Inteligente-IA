import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { SearchInput } from "@/components/ui/search-input";
import { Skeleton } from "@/components/ui/skeleton";
import { useState } from "react";
import { Lock, Unlock, Edit2 } from "lucide-react";
import type { User } from "@shared/schema";

interface AdminUsersProps {
  isSuperAdmin: boolean;
}

interface UsersResponse {
  users: User[];
  total: number;
}

export function AdminUsers({ isSuperAdmin }: AdminUsersProps) {
  const [searchEmail, setSearchEmail] = useState("");
  const [page, setPage] = useState(1);
  const pageSize = 10;

  const { data, isLoading } = useQuery<UsersResponse>({
    queryKey: ['/api/admin/users', searchEmail, page],
  });

  const users = data?.users || [];
  const total = data?.total || 0;
  const totalPages = Math.ceil(total / pageSize);

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Gestão de Usuários</CardTitle>
          <CardDescription>Pesquise e gerencie usuários do aplicativo</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Search Input */}
          <SearchInput
            placeholder="Buscar por email..."
            value={searchEmail}
            onChange={(e) => {
              setSearchEmail(e.target.value);
              setPage(1);
            }}
            showIcon={true}
            iconPosition="left"
            singleLine={true}
            minHeight="44px"
            maxHeight="44px"
            data-testid="input-search-users"
          />

          {/* Users Table */}
          {isLoading ? (
            <div className="space-y-2">
              {[1, 2, 3].map(i => (
                <Skeleton key={i} className="h-16 w-full" />
              ))}
            </div>
          ) : users.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="border-b">
                  <tr>
                    <th className="text-left py-2 px-4">Email</th>
                    <th className="text-left py-2 px-4">Nome</th>
                    <th className="text-left py-2 px-4">Função</th>
                    <th className="text-left py-2 px-4">Status</th>
                    <th className="text-left py-2 px-4">Cadastro</th>
                    <th className="text-left py-2 px-4">Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map(user => (
                    <tr key={user.id} className="border-b hover:bg-muted/50" data-testid={`row-user-${user.id}`}>
                      <td className="py-2 px-4">{user.email}</td>
                      <td className="py-2 px-4">{user.name}</td>
                      <td className="py-2 px-4">
                        <span className="text-xs bg-primary/10 text-primary px-2 py-1 rounded">
                          {user.role === 'super_admin' ? '👑 Super' : user.role === 'admin' ? '🔑 Admin' : 'Usuário'}
                        </span>
                      </td>
                      <td className="py-2 px-4">
                        <span className={`text-xs ${user.isBlocked ? 'text-red-600' : 'text-green-600'}`}>
                          {user.isBlocked ? '🚫 Bloqueado' : '✅ Ativo'}
                        </span>
                      </td>
                      <td className="py-2 px-4 text-xs text-muted-foreground">
                        {new Date(user.createdAt).toLocaleDateString('pt-BR')}
                      </td>
                      <td className="py-2 px-4">
                        <div className="flex gap-1">
                          <Button 
                            variant="ghost" 
                            size="sm"
                            data-testid={`button-edit-user-${user.id}`}
                          >
                            <Edit2 className="h-4 w-4" />
                          </Button>
                          {!user.isBlocked ? (
                            <Button 
                              variant="ghost" 
                              size="sm"
                              data-testid={`button-block-user-${user.id}`}
                            >
                              <Lock className="h-4 w-4 text-red-600" />
                            </Button>
                          ) : (
                            <Button 
                              variant="ghost" 
                              size="sm"
                              data-testid={`button-unblock-user-${user.id}`}
                            >
                              <Unlock className="h-4 w-4 text-green-600" />
                            </Button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              Nenhum usuário encontrado
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">
                Página {page} de {totalPages} ({total} usuários no total)
              </p>
              <div className="flex gap-2">
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  disabled={page === 1}
                  data-testid="button-prev-page"
                >
                  Anterior
                </Button>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                  data-testid="button-next-page"
                >
                  Próxima
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
