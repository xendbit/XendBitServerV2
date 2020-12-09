import { AES, enc } from 'crypto-js';
import { CanActivate, ExecutionContext, Injectable, Logger } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Observable } from 'rxjs';

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(private reflector: Reflector) { }

  private readonly logger = new Logger(AuthGuard.name);

  canActivate(context: ExecutionContext): boolean | Promise<boolean> | Observable<boolean> {
    const roles = this.reflector.get<string[]>('roles', context.getHandler());
    const authHeader = context.switchToHttp().getRequest().headers['api-key'];
    if (!roles) {
      return true;
    } else {
      return this.matchRoles(roles, context.getHandler().name, authHeader);
    }
  }

  matchRoles(roles: string[], handler: string, authHeader: string): boolean {
    let decrypted = "";
    this.logger.log(`authHeader: ${authHeader}`);
    this.logger.log(`roles: ${roles}`);
    if (authHeader !== undefined) {
      decrypted = AES.decrypt(authHeader, process.env.KEY).toString(enc.Utf8);
    }

    if (roles.indexOf('all') >= 0) {
      return true;
    }
    
    if (roles.indexOf('admin') >= 0) {
      return decrypted === process.env.AUTH_TOKEN;
    }

    if(roles.indexOf('api') >= 0) {
      return decrypted === process.env.AUTH_TOKEN;
    }

    switch (handler) {
      case 'someHandlerWithASpecialRole':
        if (decrypted === process.env.AUTH_TOKEN) {
          return true;
        }
    }
    return false;
  }
}
