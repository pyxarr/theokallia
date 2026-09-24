import 'reflect-metadata'
/* eslint-disable @typescript-eslint/unbound-method -- this spec deliberately passes raw handler
   references, mirroring exactly what ExecutionContext.getHandler() gives the guard */
import { ExecutionContext } from '@nestjs/common'
import { Reflector } from '@nestjs/core'
import { Roles, RolesGuard, ROLES_KEY } from './roles.guard'

/**
 * Contract tests for @Roles() and RolesGuard.
 *
 * The original defect: @Roles used Reflect.metadata, which stores roles on the
 * class prototype keyed by method name. Nest's Reflector.getAllAndOverride reads
 * the handler function instead, so it always resolved undefined and the guard
 * fell through to "allow" — silently disabling every admin-only endpoint.
 * These tests pin the metadata to the location the guard actually reads.
 */
class AdminRoute {
  @Roles('admin')
  adminOnly() {}

  @Roles('admin', 'editor')
  multiRole() {}

  publicRoute() {}
}

@Roles('admin')
class AdminController {}

type Handler = () => void

function contextFor(
  handler: Handler,
  controller: object,
  role?: string | string[],
): ExecutionContext {
  return {
    getHandler: () => handler,
    getClass: () => controller,
    switchToHttp: () => ({
      getRequest: () => (role === undefined ? {} : { session: { user: { role } } }),
    }),
  } as unknown as ExecutionContext
}

describe('@Roles / RolesGuard', () => {
  const reflector = new Reflector()
  const guard = new RolesGuard(reflector)
  const proto = AdminRoute.prototype

  describe('metadata is readable where Nest looks for it', () => {
    it('stores roles on the handler function', () => {
      expect(reflector.get<string[]>(ROLES_KEY, proto.adminOnly)).toEqual(['admin'])
    })

    it('resolves roles via getAllAndOverride for handler + class', () => {
      expect(
        reflector.getAllAndOverride<string[]>(ROLES_KEY, [proto.adminOnly, AdminRoute]),
      ).toEqual(['admin'])
    })

    it('stores class-level roles on the controller', () => {
      expect(reflector.get<string[]>(ROLES_KEY, AdminController)).toEqual(['admin'])
    })

    it('leaves undecorated routes without roles', () => {
      expect(reflector.get<string[]>(ROLES_KEY, proto.publicRoute)).toBeUndefined()
    })
  })

  describe('authorization', () => {
    it('allows a user holding the required role', () => {
      expect(guard.canActivate(contextFor(proto.adminOnly, AdminRoute, 'admin'))).toBe(true)
    })

    it('denies a user without the required role', () => {
      expect(guard.canActivate(contextFor(proto.adminOnly, AdminRoute, 'user'))).toBe(false)
    })

    it('denies a request with no session', () => {
      expect(guard.canActivate(contextFor(proto.adminOnly, AdminRoute))).toBe(false)
    })

    it('denies an empty-string role', () => {
      expect(guard.canActivate(contextFor(proto.adminOnly, AdminRoute, ''))).toBe(false)
    })

    it('accepts a role supplied as an array', () => {
      expect(guard.canActivate(contextFor(proto.adminOnly, AdminRoute, ['admin']))).toBe(true)
    })

    it('allows any one of the declared roles', () => {
      expect(guard.canActivate(contextFor(proto.multiRole, AdminRoute, 'editor'))).toBe(true)
      expect(guard.canActivate(contextFor(proto.multiRole, AdminRoute, 'admin'))).toBe(true)
    })

    it('allows routes with no @Roles regardless of role', () => {
      expect(guard.canActivate(contextFor(proto.publicRoute, AdminRoute, 'user'))).toBe(true)
      expect(guard.canActivate(contextFor(proto.publicRoute, AdminRoute))).toBe(true)
    })
  })
})