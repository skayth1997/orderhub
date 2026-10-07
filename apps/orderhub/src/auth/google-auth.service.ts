import {
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { User } from '../users/user.entity.js';
import { AuthService } from './auth.service.js';

const AUTH_URL = 'https://accounts.google.com/o/oauth2/v2/auth';
const TOKEN_URL = 'https://oauth2.googleapis.com/token';
const USERINFO_URL = 'https://openidconnect.googleapis.com/v1/userinfo';

@Injectable()
export class GoogleAuthService {
  constructor(
    private readonly config: ConfigService,
    @InjectDataSource()
    private readonly dataSource: DataSource,
    private readonly authService: AuthService,
  ) {}

  private get redirectUri(): string {
    return this.config.getOrThrow('GOOGLE_REDIRECT_URI');
  }

  buildLoginUrl(state: string): string {
    const params = new URLSearchParams({
      client_id: this.config.getOrThrow('GOOGLE_CLIENT_ID'),
      redirect_uri: this.redirectUri,
      response_type: 'code',
      scope: 'openid email',
      state,
    });
    return `${AUTH_URL}?${params.toString()}`;
  }

  async loginWithCode(code: string): Promise<{ accessToken: string }> {
    const tokenResponse = await fetch(TOKEN_URL, {
      method: 'POST',
      headers: { 'content-type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        code,
        client_id: this.config.getOrThrow('GOOGLE_CLIENT_ID'),
        client_secret: this.config.getOrThrow('GOOGLE_CLIENT_SECRET'),
        redirect_uri: this.redirectUri,
        grant_type: 'authorization_code',
      }),
    });
    if (!tokenResponse.ok) {
      throw new UnauthorizedException('Google did not accept the login code');
    }
    const { access_token } = (await tokenResponse.json()) as {
      access_token: string;
    };

    const profileResponse = await fetch(USERINFO_URL, {
      headers: { authorization: `Bearer ${access_token}` },
    });
    if (!profileResponse.ok) {
      throw new UnauthorizedException('Could not read the Google profile');
    }
    const profile = (await profileResponse.json()) as {
      email?: string;
      email_verified?: boolean;
    };
    if (!profile.email || !profile.email_verified) {
      throw new UnauthorizedException('Google email is not verified');
    }

    const user = await this.dataSource
      .getRepository(User)
      .findOneBy({ email: profile.email.toLowerCase() });
    if (!user) {
      throw new ForbiddenException('No account exists for this email');
    }

    return this.authService.createToken(user);
  }
}
