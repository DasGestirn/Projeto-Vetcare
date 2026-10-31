/* eslint-disable react-refresh/only-export-components */

import { createContext, useContext, useState, useEffect } from 'react';
import { pb } from '../pocketbase';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(pb.authStore.model);

  useEffect(() => {
    const unsubscribe = pb.authStore.onChange((token, model) => {
      setUser(model);
    });

    return () => unsubscribe();
  }, []);

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