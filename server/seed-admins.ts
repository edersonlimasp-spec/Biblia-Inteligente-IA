/**
 * SEED DE USUÁRIOS ADMINISTRATIVOS
 * 
 * Este script cria automaticamente os usuários admin se eles não existirem.
 * É IDEMPOTENTE - pode ser executado múltiplas vezes sem duplicar usuários.
 * 
 * Contas fixas antigas desativadas (ver LEGACY_ADMINS).
 */

import { db } from './db';
import { users } from '@shared/schema';
import { eq, sql } from 'drizzle-orm';
import bcrypt from 'bcryptjs';
import { randomBytes } from 'crypto';

interface AdminUserSeed {
  email: string;
  name: string;
  password: string;
  role: 'admin' | 'super_admin';
}

// Definição dos usuários administrativos fixos
// Contas fixas antigas foram DESATIVADAS por segurança (senhas estavam escritas no código).
// Acesso ao painel agora é só pelas contas reais em OWNER_ACCOUNTS (fim do arquivo).
const ADMIN_USERS: AdminUserSeed[] = [];

// Contas administrativas antigas com senha pública no código: perdem o acesso ao painel.
// - admin@meuapp.com e admin@biblical.app: viram usuário comum e recebem senha aleatória (ninguém entra).
// - googleplay@meuapp.com: vira usuário comum mas mantém a senha, para o login de revisão das lojas continuar.
const LEGACY_ADMINS: { email: string; keepLogin: boolean }[] = [
  { email: 'admin@meuapp.com', keepLogin: false },
  { email: 'admin@biblical.app', keepLogin: false },
  { email: 'googleplay@meuapp.com', keepLogin: true },
];

async function retireLegacyAdmins(): Promise<void> {
  for (const legacy of LEGACY_ADMINS) {
    try {
      const found = await db
        .select({ id: users.id, role: users.role })
        .from(users)
        .where(eq(users.email, legacy.email))
        .limit(1);
      if (found.length === 0 || found[0].role === 'user') continue; // já desativada
      const patch: { role: string; password?: string } = { role: 'user' };
      if (!legacy.keepLogin) patch.password = await bcrypt.hash(randomBytes(32).toString('hex'), 10);
      await db.update(users).set(patch).where(eq(users.id, found[0].id));
      console.log(`  🔒 ${legacy.email}: acesso administrativo removido`);
    } catch (error) {
      console.error(`  ❌ Erro ao desativar ${legacy.email}:`, error);
    }
  }
}

/**
 * Cria os usuários administrativos se não existirem
 * Esta função é IDEMPOTENTE - pode ser chamada múltiplas vezes sem efeitos colaterais
 */
export async function seedAdminUsers(): Promise<void> {
  await retireLegacyAdmins();
  console.log('🔐 Verificando usuários administrativos...');

  for (const adminUser of ADMIN_USERS) {
    try {
      // 1. Verificar se o usuário já existe
      const existingUser = await db
        .select()
        .from(users)
        .where(eq(users.email, adminUser.email))
        .limit(1);

      if (existingUser.length > 0) {
        const user = existingUser[0];
        console.log(`  ✅ ${adminUser.email} já existe (role: ${user.role})`);
        
        // Verificar se a senha está correta - se não, atualizar
        const isPasswordValid = user.password
          ? await bcrypt.compare(adminUser.password, user.password)
          : false;
        if (!isPasswordValid) {
          console.log(`  🔄 Atualizando senha de ${adminUser.email}...`);
          const newHash = await bcrypt.hash(adminUser.password, 10);
          await db
            .update(users)
            .set({ password: newHash, role: adminUser.role })
            .where(eq(users.id, user.id));
          console.log(`  ✅ Senha atualizada com sucesso!`);
        }
        
        // Garantir que tem o role correto
        if (user.role !== adminUser.role) {
          console.log(`  🔄 Atualizando role de ${adminUser.email} para ${adminUser.role}...`);
          await db
            .update(users)
            .set({ role: adminUser.role })
            .where(eq(users.id, user.id));
        }
        
        continue;
      }

      // 2. Criar o usuário com senha hash
      console.log(`  📝 Criando usuário ${adminUser.email}...`);
      
      const hashedPassword = await bcrypt.hash(adminUser.password, 10);
      
      // Log para debug (sem mostrar senha real)
      console.log(`  🔑 Hash gerado para ${adminUser.email}: ${hashedPassword.substring(0, 20)}...`);
      
      await db.insert(users).values({
        name: adminUser.name,
        email: adminUser.email,
        password: hashedPassword,
        role: adminUser.role,
        trialStartDate: new Date(),
      });

      console.log(`  ✅ Usuário ${adminUser.email} criado com sucesso (role: ${adminUser.role})`);
      
    } catch (error) {
      console.error(`  ❌ Erro ao criar/verificar ${adminUser.email}:`, error);
    }
  }

  console.log('🔐 Verificação de usuários administrativos concluída!');
}

/**
 * Função de teste para verificar se o login funciona
 * Útil para debug em produção
 */
export async function testAdminLogin(email: string, password: string): Promise<boolean> {
  console.log(`\n🧪 TESTE DE LOGIN: ${email}`);
  
  // 1. Buscar usuário
  const userResult = await db
    .select()
    .from(users)
    .where(eq(users.email, email))
    .limit(1);

  if (userResult.length === 0) {
    console.log(`  ❌ Usuário NÃO encontrado no banco`);
    return false;
  }

  const user = userResult[0];
  console.log(`  ✅ Usuário encontrado: ID=${user.id}, Role=${user.role}`);
  if (!user.password) {
    console.log(`  ❌ Usuário não possui senha cadastrada (login social?)`);
    return false;
  }
  console.log(`  📊 Hash no banco: ${user.password.substring(0, 30)}...`);

  // 2. Testar senha
  const isValid = await bcrypt.compare(password, user.password);
  console.log(`  🔐 Resultado bcrypt.compare: ${isValid ? 'VÁLIDO ✅' : 'INVÁLIDO ❌'}`);

  return isValid;
}

/**
 * Contas reais do dono do app com acesso total ao painel administrativo.
 * Só ALTERA O PAPEL de quem já tem conta: nunca cria usuário nem mexe em senha.
 * Idempotente: roda a cada inicialização e não faz nada se o papel já estiver certo.
 */
const OWNER_ACCOUNTS: { email: string; role: 'admin' | 'super_admin' }[] = [
  { email: 'edersonlima.sp@gmail.com', role: 'super_admin' },
];

export async function promoteOwnerAccounts(): Promise<void> {
  for (const owner of OWNER_ACCOUNTS) {
    try {
      const found = await db
        .select({ id: users.id, role: users.role })
        .from(users)
        .where(sql`lower(trim(${users.email})) = ${owner.email.toLowerCase()}`)
        .limit(1);
      if (found.length === 0) {
        console.log(`  ⏳ ${owner.email}: conta ainda não existe (será promovida após o cadastro)`);
        continue;
      }
      if (found[0].role === owner.role) continue;
      await db.update(users).set({ role: owner.role }).where(eq(users.id, found[0].id));
      console.log(`  👑 ${owner.email}: papel atualizado para ${owner.role}`);
    } catch (error) {
      console.error(`  ❌ Erro ao promover ${owner.email}:`, error);
    }
  }
}
