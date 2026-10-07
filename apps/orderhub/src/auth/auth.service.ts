import {
  ConflictException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectDataSource } from '@nestjs/typeorm';
import * as bcrypt from 'bcrypt';
import { DataSource } from 'typeorm';
import { Tenant } from '../tenants/tenant.entity.js';
import { User, UserRole } from '../users/user.entity.js';
import { LoginDto } from './dto/login.dto.js';
import { RegisterDto } from './dto/register.dto.js';

@Injectable()
export class AuthService {
  constructor(
    @InjectDataSource()
    private readonly dataSource: DataSource,
    private readonly jwtService: JwtService,
  ) {}

  async register(dto: RegisterDto) {
    const email = dto.email.toLowerCase();

    const existing = await this.dataSource
      .getRepository(User)
      .findOneBy({ email });
    if (existing) {
      throw new ConflictException('Email is already registered');
    }

    const passwordHash = await bcrypt.hash(dto.password, 10);

    const { tenant, user } = await this.dataSource.transaction(
      async (manager) => {
        const tenant = await manager.save(
          manager.create(Tenant, { name: dto.companyName }),
        );
        const user = await manager.save(
          manager.create(User, {
            email,
            passwordHash,
            role: UserRole.Admin,
            tenantId: tenant.id,
          }),
        );
        return { tenant, user };
      },
    );

    return {
      tenant: { id: tenant.id, name: tenant.name },
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        tenantId: user.tenantId,
      },
    };
  }

  async login(dto: LoginDto) {
    const user = await this.dataSource
      .getRepository(User)
      .findOneBy({ email: dto.email.toLowerCase() });

    const passwordOk =
      user && (await bcrypt.compare(dto.password, user.passwordHash));
    if (!user || !passwordOk) {
      throw new UnauthorizedException('Invalid email or password');
    }

    const accessToken = await this.jwtService.signAsync({
      sub: user.id,
      tenantId: user.tenantId,
      role: user.role,
    });
    return { accessToken };
  }
}
