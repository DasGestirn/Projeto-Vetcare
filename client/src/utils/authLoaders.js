import { redirect } from 'react-router';
import { pb } from '../pocketbase';

// Verifica se está logado. Se não estiver, vai mandar para o login
export function requireAuth() {
  if (!pb.authStore.isValid) {
    throw redirect('/login');
  }
  return pb.authStore.model;
}

export function requireRole(allowedRoles) {
  return () => {
    const user = requireAuth();
    
    if (!allowedRoles.includes(user.role)) {

      if (user.role === 'veterinario') throw redirect('/agenda');
      if (user.role === 'administracao') throw redirect('/dashboard');
      if (user.role === 'recepcao') throw redirect('/recepcao');

      throw redirect('/login');
    }
    
    return null; 
  };
}

export function guestLoader() {
  if (pb.authStore.isValid) {
    const role = pb.authStore.model.role;
    if (role === 'administracao') throw redirect('/dashboard');
    if (role === 'veterinario') throw redirect('/agenda');
    if (role === 'recepcao') throw redirect('/recepcao');
  }
  return null;
}