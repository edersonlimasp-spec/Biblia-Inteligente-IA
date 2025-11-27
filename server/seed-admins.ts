/**
 * SEED DE USUÁRIOS ADMINISTRATIVOS
 * 
 * Este script cria automaticamente os usuários admin se eles não existirem.
 * É IDEMPOTENTE - pode ser executado múltiplas vezes sem duplicar usuários.
 * 
 * Usuários criados:
 * 1. admin@meuapp.com / Admin@12345 (super_admin)
 * 2. googleplay@meuapp.com / Play@12345 (admin)
 */

import { db } from './db';
import { users } from '@shared/schema';
import { eq } from 'drizzle-orm';
import bcrypt from 'bcryptjs';

interface AdminUserSeed {
  email: string;
  name: string;
  password: string;
  role: 'admin' | 'super_admin';
}

// Definição dos usuários administrativos fixos
const ADMIN_USERS: AdminUserSeed[] = [
  {
    email: 'admin@meuapp.com',
    name: 'Administrador Principal',
    password: 'Admin@12345',
    role: 'super_admin',
  },
  {
    email: 'googleplay@meuapp.com',
    name: 'Admin Google Play',
    password: 'Play@12345',
    role: 'admin',
  },
  // Mantendo o admin antigo também para compatibilidade
  {
    email: 'admin@biblical.app',
    name: 'Admin Biblical',
    password: 'Admin123456',
    role: 'super_admin',
  },
];

/**
 * Cria os usuários administrativos se não existirem
 * Esta função é IDEMPOTENTE - pode ser chamada múltiplas vezes sem efeitos colaterais
 */
export async function seedAdminUsers(): Promise<void> {
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
        const isPasswordValid = await bcrypt.compare(adminUser.password, user.password);
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
  console.log(`  📊 Hash no banco: ${user.password.substring(0, 30)}...`);

  // 2. Testar senha
  const isValid = await bcrypt.compare(password, user.password);
  console.log(`  🔐 Resultado bcrypt.compare: ${isValid ? 'VÁLIDO ✅' : 'INVÁLIDO ❌'}`);

  return isValid;
}
