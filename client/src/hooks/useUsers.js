import { useState, useEffect, useCallback, useMemo } from 'react';
import { userService } from '../services/userService';

export function useUsers() {
  const [users, setUsers] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchUsers = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const records = await userService.listUsers();
      setUsers(records);
    } catch (err) {
      setError(err?.message || 'Erro ao carregar usuários.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const filteredUsers = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    if (!term) return users;
    return users.filter(
      (u) =>
        u.name?.toLowerCase().includes(term) ||
        u.email?.toLowerCase().includes(term) ||
        u.id?.toLowerCase().includes(term)
    );
  }, [users, searchTerm]);

  const addUser = async (userData) => {
    if (userData.password !== userData.passwordConfirm) {
      throw new Error('As senhas não coincidem.');
    }
    await userService.createUser(userData);
    await fetchUsers();
  };

  const editUser = async (id, userData) => {
    if (userData.password && userData.password !== userData.passwordConfirm) {
      throw new Error('As senhas não coincidem.');
    }
    await userService.updateUser(id, userData);
    await fetchUsers();
  };

  const removeUser = async (id) => {
    await userService.deleteUser(id);
    await fetchUsers();
  };

  return {
    users: filteredUsers,
    searchTerm,
    setSearchTerm,
    loading,
    error,
    addUser,
    editUser,
    removeUser,
  };
}