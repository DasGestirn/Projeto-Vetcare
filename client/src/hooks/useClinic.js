import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '../context/AuthContext';

export function useClinicQuery(key, fetcher, enabled = true) {
  const { user } = useAuth();
  return useQuery({
    queryKey: ['clinic', user?.id, user?.role, ...key],
    queryFn: ({ signal }) => fetcher({ signal }),
    enabled: Boolean(user) && enabled,
  });
}

export function useClinicMutation(save) {
  const client = useQueryClient();
  return useMutation({
    mutationFn: save,
    onSuccess: () => client.invalidateQueries({ queryKey: ['clinic'] }),
  });
}
