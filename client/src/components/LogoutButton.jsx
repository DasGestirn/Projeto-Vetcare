import { Button } from '@mantine/core';
import { useAuth } from '../context/AuthContext';

export function LogoutButton({ 
  variant = 'outline', 
  color = 'red', 
  children = 'Sair', 
  ...props 
}) {
  const { logout } = useAuth();

  return (
    <Button 
      variant={variant} 
      color={color} 
      onClick={logout} 
      {...props}
    >
      {children}
    </Button>
  );
}