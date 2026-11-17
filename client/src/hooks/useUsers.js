import { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { userService } from '../services/userService.js';
import { useAuth } from '../context/AuthContext';
import { getErrorMessage } from '../utils/pocketbaseErrors.js';

export function useUsers() {
  const { user } = useAuth();
  const client = useQueryClient();
  const [searchTerm, setSearchTerm] = useState('');
  const query = useQuery({
    queryKey: ['users', user?.id, user?.role],
    queryFn: ({ signal }) => userService.listUsers({ signal }),
    enabled: user?.role === 'administracao',
  });
  const refresh = () => client.invalidateQueries({ queryKey: ['users'] });
  const add = useMutation({ mutationFn: userService.createUser, onSuccess: refresh });
  const edit = useMutation({ mutationFn: ({ id, data }) => userService.updateUser(id, data), onSuccess: refresh });
  const remove = useMutation({ mutationFn: userService.deleteUser, onSuccess: refresh });
  const users = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    return (query.data || []).filter((record) => [record.name, record.email, record.id].some((value) => value?.toLowerCase().includes(term)));
  }, [query.data, searchTerm]);

  return {
    users, searchTerm, setSearchTerm, loading: query.isPending,
    error: query.error ? getErrorMessage(query.error, 'Erro ao carregar usuários.') : null,
    refetch: query.refetch,
    addUser: add.mutateAsync,
    editUser: (id, data) => edit.mutateAsync({ id, data }),
    removeUser: remove.mutateAsync,
  };
}
