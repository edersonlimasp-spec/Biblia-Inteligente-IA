import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Plus, Pencil, Trash2, Eye, Loader2, Tag, Check, X, Calendar, Users, Percent, DollarSign } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface Coupon {
  id: number;
  code: string;
  discountType: 'PERCENT' | 'FIXED';
  discountValue: number;
  maxUsesTotal: number | null;
  maxUsesPerUser: number | null;
  validFrom: string | null;
  validUntil: string | null;
  applicablePlans: string[] | null;
  firstPurchaseOnly: boolean;
  active: boolean;
  createdAt: string;
  usageCount?: number;
}

interface Redemption {
  id: number;
  couponId: number;
  userId: number;
  transactionId: string | null;
  discountAmount: number;
  redeemedAt: string;
  userEmail?: string;
}

export function AdminCoupons() {
  const { toast } = useToast();
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isViewOpen, setIsViewOpen] = useState(false);
  const [selectedCoupon, setSelectedCoupon] = useState<Coupon | null>(null);
  const [formData, setFormData] = useState<Partial<Coupon>>({
    code: "",
    discountType: "PERCENT",
    discountValue: 10,
    maxUsesTotal: null,
    maxUsesPerUser: null,
    validFrom: null,
    validUntil: null,
    applicablePlans: null,
    firstPurchaseOnly: false,
    active: true,
  });

  const { data: coupons = [], isLoading } = useQuery<Coupon[]>({
    queryKey: ['/api/admin/coupons'],
  });

  const { data: redemptions = [], isLoading: isLoadingRedemptions } = useQuery<Redemption[]>({
    queryKey: ['/api/admin/coupons', selectedCoupon?.id, 'redemptions'],
    enabled: !!selectedCoupon && isViewOpen,
  });

  const createMutation = useMutation({
    mutationFn: async (data: Partial<Coupon>) => {
      const res = await apiRequest('POST', '/api/admin/coupons', data);
      return res.json();
    },
    onSuccess: () => {
      toast({ title: "Cupom criado com sucesso!" });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/coupons'] });
      setIsCreateOpen(false);
      resetForm();
    },
    onError: (error: any) => {
      toast({ title: "Erro ao criar cupom", description: error.message, variant: "destructive" });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: Partial<Coupon> }) => {
      const res = await apiRequest('PUT', `/api/admin/coupons/${id}`, data);
      return res.json();
    },
    onSuccess: () => {
      toast({ title: "Cupom atualizado com sucesso!" });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/coupons'] });
      setIsEditOpen(false);
      setSelectedCoupon(null);
      resetForm();
    },
    onError: (error: any) => {
      toast({ title: "Erro ao atualizar cupom", description: error.message, variant: "destructive" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      const res = await apiRequest('DELETE', `/api/admin/coupons/${id}`);
      return res.json();
    },
    onSuccess: () => {
      toast({ title: "Cupom excluído com sucesso!" });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/coupons'] });
    },
    onError: (error: any) => {
      toast({ title: "Erro ao excluir cupom", description: error.message, variant: "destructive" });
    },
  });

  const resetForm = () => {
    setFormData({
      code: "",
      discountType: "PERCENT",
      discountValue: 10,
      maxUsesTotal: null,
      maxUsesPerUser: null,
      validFrom: null,
      validUntil: null,
      applicablePlans: null,
      firstPurchaseOnly: false,
      active: true,
    });
  };

  const openEdit = (coupon: Coupon) => {
    setSelectedCoupon(coupon);
    // Para FIXED, converter de centavos para reais ao exibir
    const displayValue = coupon.discountType === 'FIXED' 
      ? coupon.discountValue / 100 
      : coupon.discountValue;
    
    setFormData({
      code: coupon.code,
      discountType: coupon.discountType,
      discountValue: displayValue,
      maxUsesTotal: coupon.maxUsesTotal,
      maxUsesPerUser: coupon.maxUsesPerUser,
      validFrom: coupon.validFrom ? new Date(coupon.validFrom).toISOString().split('T')[0] : null,
      validUntil: coupon.validUntil ? new Date(coupon.validUntil).toISOString().split('T')[0] : null,
      applicablePlans: coupon.applicablePlans,
      firstPurchaseOnly: coupon.firstPurchaseOnly,
      active: coupon.active,
    });
    setIsEditOpen(true);
  };

  const openView = (coupon: Coupon) => {
    setSelectedCoupon(coupon);
    setIsViewOpen(true);
  };

  const handleSubmit = (isEdit: boolean) => {
    if (!formData.code || !formData.discountValue) {
      toast({ title: "Preencha todos os campos obrigatórios", variant: "destructive" });
      return;
    }

    // Para FIXED, converter de reais para centavos ao salvar
    const discountValueInCents = formData.discountType === 'FIXED' 
      ? Math.round(Number(formData.discountValue) * 100) 
      : Number(formData.discountValue);

    const payload = {
      ...formData,
      discountValue: discountValueInCents,
      maxUsesTotal: formData.maxUsesTotal ? Number(formData.maxUsesTotal) : null,
      maxUsesPerUser: formData.maxUsesPerUser ? Number(formData.maxUsesPerUser) : null,
    };

    if (isEdit && selectedCoupon) {
      updateMutation.mutate({ id: selectedCoupon.id, data: payload });
    } else {
      createMutation.mutate(payload);
    }
  };

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return "-";
    return new Date(dateStr).toLocaleDateString('pt-BR');
  };

  const formatCurrency = (cents: number) => {
    return `R$ ${(cents / 100).toFixed(2).replace('.', ',')}`;
  };

  const CouponForm = ({ isEdit = false }: { isEdit?: boolean }) => (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Código do Cupom *</Label>
          <Input
            value={formData.code}
            onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
            placeholder="EX: DESCONTO20"
            className="uppercase"
            data-testid="input-coupon-code-form"
          />
        </div>
        <div className="space-y-2">
          <Label>Tipo de Desconto *</Label>
          <Select
            value={formData.discountType}
            onValueChange={(v) => setFormData({ ...formData, discountType: v as 'PERCENT' | 'FIXED' })}
          >
            <SelectTrigger data-testid="select-discount-type">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="PERCENT">Percentual (%)</SelectItem>
              <SelectItem value="FIXED">Valor Fixo (R$)</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Valor do Desconto * {formData.discountType === 'FIXED' ? '(em R$)' : '(em %)'}</Label>
          <div className="relative">
            <Input
              type="number"
              step={formData.discountType === 'FIXED' ? "0.01" : "1"}
              value={formData.discountValue || ""}
              onChange={(e) => setFormData({ ...formData, discountValue: Number(e.target.value) })}
              placeholder={formData.discountType === 'PERCENT' ? "10" : "5.00"}
              data-testid="input-discount-value"
            />
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">
              {formData.discountType === 'PERCENT' ? '%' : 'R$'}
            </span>
          </div>
          {formData.discountType === 'FIXED' && formData.discountValue && (
            <p className="text-xs text-muted-foreground">
              Será salvo como: {formatCurrency(Math.round(formData.discountValue * 100))}
            </p>
          )}
        </div>
        <div className="space-y-2">
          <Label>Planos Aplicáveis</Label>
          <Select
            value={formData.applicablePlans?.join(',') || 'all'}
            onValueChange={(v) => setFormData({ ...formData, applicablePlans: v === 'all' ? null : v.split(',') })}
          >
            <SelectTrigger data-testid="select-applicable-plans">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos os planos</SelectItem>
              <SelectItem value="gold">Apenas Gold</SelectItem>
              <SelectItem value="premium">Apenas Premium</SelectItem>
              <SelectItem value="vitalicio">Apenas Vitalício</SelectItem>
              <SelectItem value="gold,gold_anual">Gold (mensal e anual)</SelectItem>
              <SelectItem value="premium,premium_anual">Premium (mensal e anual)</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Máximo de Usos (Total)</Label>
          <Input
            type="number"
            value={formData.maxUsesTotal || ""}
            onChange={(e) => setFormData({ ...formData, maxUsesTotal: e.target.value ? Number(e.target.value) : null })}
            placeholder="Ilimitado"
            data-testid="input-max-uses-total"
          />
        </div>
        <div className="space-y-2">
          <Label>Máximo por Usuário</Label>
          <Input
            type="number"
            value={formData.maxUsesPerUser || ""}
            onChange={(e) => setFormData({ ...formData, maxUsesPerUser: e.target.value ? Number(e.target.value) : null })}
            placeholder="Ilimitado"
            data-testid="input-max-uses-per-user"
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Válido a partir de</Label>
          <Input
            type="date"
            value={formData.validFrom || ""}
            onChange={(e) => setFormData({ ...formData, validFrom: e.target.value || null })}
            data-testid="input-valid-from"
          />
        </div>
        <div className="space-y-2">
          <Label>Válido até</Label>
          <Input
            type="date"
            value={formData.validUntil || ""}
            onChange={(e) => setFormData({ ...formData, validUntil: e.target.value || null })}
            data-testid="input-valid-until"
          />
        </div>
      </div>

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Switch
            checked={formData.firstPurchaseOnly}
            onCheckedChange={(v) => setFormData({ ...formData, firstPurchaseOnly: v })}
            data-testid="switch-first-purchase-only"
          />
          <Label>Apenas primeira compra</Label>
        </div>
        <div className="flex items-center gap-2">
          <Switch
            checked={formData.active}
            onCheckedChange={(v) => setFormData({ ...formData, active: v })}
            data-testid="switch-active"
          />
          <Label>Ativo</Label>
        </div>
      </div>

      <div className="flex justify-end gap-2 pt-4">
        <Button variant="outline" onClick={() => isEdit ? setIsEditOpen(false) : setIsCreateOpen(false)}>
          Cancelar
        </Button>
        <Button
          onClick={() => handleSubmit(isEdit)}
          disabled={createMutation.isPending || updateMutation.isPending}
          data-testid="button-save-coupon"
        >
          {(createMutation.isPending || updateMutation.isPending) && (
            <Loader2 className="h-4 w-4 animate-spin mr-2" />
          )}
          {isEdit ? "Salvar Alterações" : "Criar Cupom"}
        </Button>
      </div>
    </div>
  );

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Cupons de Desconto</h2>
          <p className="text-muted-foreground">Gerencie cupons promocionais para campanhas de marketing</p>
        </div>
        <Button onClick={() => { resetForm(); setIsCreateOpen(true); }} data-testid="button-create-coupon">
          <Plus className="h-4 w-4 mr-2" />
          Novo Cupom
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary/10 rounded-lg">
                <Tag className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold">{coupons.length}</p>
                <p className="text-sm text-muted-foreground">Total de Cupons</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-500/10 rounded-lg">
                <Check className="h-5 w-5 text-green-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">{coupons.filter(c => c.active).length}</p>
                <p className="text-sm text-muted-foreground">Cupons Ativos</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-500/10 rounded-lg">
                <Users className="h-5 w-5 text-blue-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">{coupons.reduce((acc, c) => acc + (c.usageCount || 0), 0)}</p>
                <p className="text-sm text-muted-foreground">Total de Resgates</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-orange-500/10 rounded-lg">
                <Percent className="h-5 w-5 text-orange-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">{coupons.filter(c => c.discountType === 'PERCENT').length}</p>
                <p className="text-sm text-muted-foreground">Cupons Percentuais</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Coupons Table */}
      <Card>
        <CardHeader>
          <CardTitle>Lista de Cupons</CardTitle>
          <CardDescription>Todos os cupons cadastrados no sistema</CardDescription>
        </CardHeader>
        <CardContent>
          {coupons.length === 0 ? (
            <div className="text-center py-8">
              <Tag className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
              <p className="text-muted-foreground">Nenhum cupom cadastrado</p>
              <Button variant="outline" className="mt-4" onClick={() => setIsCreateOpen(true)}>
                Criar primeiro cupom
              </Button>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Código</TableHead>
                  <TableHead>Desconto</TableHead>
                  <TableHead>Validade</TableHead>
                  <TableHead>Usos</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {coupons.map((coupon) => (
                  <TableRow key={coupon.id} data-testid={`row-coupon-${coupon.id}`}>
                    <TableCell className="font-mono font-bold">{coupon.code}</TableCell>
                    <TableCell>
                      <Badge variant="secondary">
                        {coupon.discountType === 'PERCENT' ? (
                          <><Percent className="h-3 w-3 mr-1" />{coupon.discountValue}%</>
                        ) : (
                          <><DollarSign className="h-3 w-3 mr-1" />{formatCurrency(coupon.discountValue)}</>
                        )}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1 text-sm">
                        <Calendar className="h-3 w-3" />
                        {formatDate(coupon.validFrom)} - {formatDate(coupon.validUntil)}
                      </div>
                    </TableCell>
                    <TableCell>
                      {coupon.usageCount || 0} / {coupon.maxUsesTotal || '∞'}
                    </TableCell>
                    <TableCell>
                      <Badge variant={coupon.active ? "default" : "secondary"}>
                        {coupon.active ? "Ativo" : "Inativo"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => openView(coupon)}
                          data-testid={`button-view-coupon-${coupon.id}`}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => openEdit(coupon)}
                          data-testid={`button-edit-coupon-${coupon.id}`}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => {
                            if (confirm(`Excluir cupom ${coupon.code}?`)) {
                              deleteMutation.mutate(coupon.id);
                            }
                          }}
                          data-testid={`button-delete-coupon-${coupon.id}`}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Create Dialog */}
      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Criar Novo Cupom</DialogTitle>
            <DialogDescription>
              Configure os detalhes do cupom de desconto
            </DialogDescription>
          </DialogHeader>
          <CouponForm />
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Editar Cupom</DialogTitle>
            <DialogDescription>
              Atualize as configurações do cupom {selectedCoupon?.code}
            </DialogDescription>
          </DialogHeader>
          <CouponForm isEdit />
        </DialogContent>
      </Dialog>

      {/* View Redemptions Dialog */}
      <Dialog open={isViewOpen} onOpenChange={setIsViewOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Resgates do Cupom {selectedCoupon?.code}</DialogTitle>
            <DialogDescription>
              Histórico de usos deste cupom
            </DialogDescription>
          </DialogHeader>
          <div className="mt-4">
            {isLoadingRedemptions ? (
              <div className="flex justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin" />
              </div>
            ) : redemptions.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                Nenhum resgate registrado para este cupom
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Usuário</TableHead>
                    <TableHead>Desconto</TableHead>
                    <TableHead>Transação</TableHead>
                    <TableHead>Data</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {redemptions.map((r) => (
                    <TableRow key={r.id}>
                      <TableCell>{r.userEmail || `ID: ${r.userId}`}</TableCell>
                      <TableCell>{formatCurrency(r.discountAmount)}</TableCell>
                      <TableCell className="font-mono text-xs">{r.transactionId || "-"}</TableCell>
                      <TableCell>{new Date(r.redeemedAt).toLocaleString('pt-BR')}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
