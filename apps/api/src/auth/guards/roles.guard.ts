import { Injectable, CanActivate, ExecutionContext, SetMetadata } from '@nestjs/common'
import { Reflector } from '@nestjs/core'

// Key used to store roles metadata set by the @Roles() decorator
export const ROLES_KEY = 'roles'

// Decorator to specify which roles are allowed to access a route
// Usage: @Roles('admin')
// Must use Nest's SetMetadata: it attaches metadata to the handler function,
// which is where Reflector.getAllAndOverride reads it from. Reflect.metadata
// writes to the prototype keyed by method name and is invisible to the guard.
export function Roles(...roles: string[]) {
  return SetMetadata(ROLES_KEY, roles)
}

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    // Get the roles required for this route from metadata
    const requiredRoles = this.reflector.getAllAndOverride<string[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ])

    // If no @Roles() decorator is present, allow all authenticated users
    if (!requiredRoles) return true

    const request = context
      .switchToHttp()
      .getRequest<{ session?: { user?: { role?: string | string[] } } }>()

    const role = request.session?.user?.role
    const normalizedRole = Array.isArray(role) ? role[0] : role ?? ''

    return requiredRoles.includes(normalizedRole)
  }
}
