import { redirect } from 'react-router';
import { authService } from '../services/authService.js';
import { getRoleHomePath } from './roles.js';

export async function requireAuth() {
  const user = await authService.refresh();
  if (!user) throw redirect('/login');
  return user;
}

export function requireRole(allowedRoles) {
  return async () => {
    const user = await requireAuth();
    if (!allowedRoles.includes(user.role)) throw redirect(getRoleHomePath(user.role));
    return null;
  };
}

export async function guestLoader() {
  const user = await authService.refresh();
  if (user) throw redirect(getRoleHomePath(user.role));
  return null;
}
