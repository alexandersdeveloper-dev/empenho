import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerModule } from '@nestjs/throttler';
import { SupabaseModule } from './supabase.module';
import { AuthModule } from './modules/auth/auth.module';
import { UsersModule } from './modules/users/users.module';
import { EmpenhosModule } from './modules/empenhos/empenhos.module';
import { CredoresModule } from './modules/credores/credores.module';
import { ClassificacaoModule } from './modules/classificacao/classificacao.module';
import { SubelementosModule } from './modules/subelementos/subelementos.module';
import { ConfigAppModule } from './modules/config/config.module';
import { ImportModule } from './modules/import/import.module';
import { AuditModule } from './modules/audit/audit.module';
import { DepartamentosModule } from './modules/departamentos/departamentos.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),

    // Rate limiting global: 100 req / 15 min por IP
    ThrottlerModule.forRoot([{ ttl: 15 * 60 * 1000, limit: 100 }]),

    SupabaseModule,
    AuthModule,
    UsersModule,
    EmpenhosModule,
    CredoresModule,
    ClassificacaoModule,
    SubelementosModule,
    ConfigAppModule,
    ImportModule,
    AuditModule,
    DepartamentosModule,
  ],
})
export class AppModule {}
