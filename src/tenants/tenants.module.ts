import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Tenant } from './tenant.entity.js';

@Module({
  imports: [TypeOrmModule.forFeature([Tenant])],
})
export class TenantsModule {}
