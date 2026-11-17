import { pb } from '../pocketbase.js';
import { isKnownRole } from '../utils/roles.js';

let refreshRequest;

function validateRole(record) {
  if (!isKnownRole(record?.role)) {
    pb.authStore.clear();
    throw new Error('Seu usuário não possui um perfil válido. Solicite a configuração ao administrador.');
  }
  return record;
}

export const authService = {
  async login({ email, password }) {
    const result = await pb.collection('users').authWithPassword(email.trim(), password, { requestKey: null });
    validateRole(result.record);
    return result;
  },
  async refresh() {
    if (!pb.authStore.isValid) {
      pb.authStore.clear();
      return null;
    }
    if (!refreshRequest) {
      refreshRequest = pb.collection('users').authRefresh({ requestKey: null })
        .then(({ record }) => validateRole(record))
        .catch((error) => {
          if ([400, 401, 403, 404].includes(error.status)) {
            pb.authStore.clear();
            return null;
          }
          throw error;
        })
        .finally(() => { refreshRequest = null; });
    }
    return refreshRequest;
  },
};
