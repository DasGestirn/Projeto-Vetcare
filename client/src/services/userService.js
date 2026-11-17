import { pb } from '../pocketbase.js';
import { isKnownRole } from '../utils/roles.js';

function validate({ name, email, role, password, passwordConfirm }, creating = false) {
  if (!name?.trim()) throw new Error('Informe o nome do usuário.');
  if (!email?.trim()) throw new Error('Informe o e-mail do usuário.');
  if (!isKnownRole(role)) throw new Error('Selecione um perfil válido.');
  if (creating || password) {
    if (!password || password.length < 8) throw new Error('A senha deve conter pelo menos 8 caracteres.');
    if (password !== passwordConfirm) throw new Error('As senhas não coincidem.');
  }
}

export const userService = {
  async listUsers(options = {}) {
    return await pb.collection('users').getFullList({
      sort: '-created',
      requestKey: null,
      ...options,
    });
  },

  async createUser({ name, email, role, password, passwordConfirm }) {
    validate({ name, email, role, password, passwordConfirm }, true);
    return await pb.collection('users').create({
      name: name.trim(),
      email: email.trim(),
      role,
      password,
      passwordConfirm,
      emailVisibility: true,
      verified: true,
    });
  },

  async updateUser(id, { name, email, role, password, passwordConfirm }) {
    validate({ name, email, role, password, passwordConfirm });
    const payload = {
      name: name.trim(),
      email: email.trim(),
      role,
      emailVisibility: true,
    };

    if (password) {
      payload.password = password;
      payload.passwordConfirm = passwordConfirm;
    }

    return await pb.collection('users').update(id, payload);
  },

  async deleteUser(id) {
    return await pb.collection('users').delete(id);
  },
};
