import { useAuth } from '../context/AuthContext';

export function HasRole({ allowedRoles, children }) {
  const { user } = useAuth();

  if (!user || !allowedRoles.includes(user.perfil)) {
    return null;
  }

  return children;
}