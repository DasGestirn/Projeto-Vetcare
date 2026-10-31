import { useAuth } from '../context/AuthContext';

export function HasRole({ allowedRoles, children }) {
  const { user } = useAuth();

  if (!user || !allowedRoles.includes(user.role)) {
    return null;
  }

  return children;
}