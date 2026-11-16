/* eslint-disable react-refresh/only-export-components */

import { createContext, useContext, useState, useEffect } from 'react';
import { pb } from '../pocketbase';
import { useQueryClient } from '@tanstack/react-query';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(pb.authStore.record);
  const queryClient = useQueryClient();

  useEffect(() => {
    let previous = pb.authStore.record;
    const unsubscribe = pb.authStore.onChange((_token, record) => {
      if (previous?.id !== record?.id || previous?.role !== record?.role) queryClient.clear();
      previous = record;
      setUser(record);
    }, true);

    return () => unsubscribe();
  }, [queryClient]);

  const logout = () => {
    pb.authStore.clear();
    window.location.href = '/login'; 
  };

  return (
    <AuthContext.Provider value={{ user, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
