import { pb } from '../pocketbase';

export const userService = {
  async listUsers() {
    return await pb.collection('users').getFullList({
      sort: '-created',
    });
  },

  async createUser({ name, email, role, password, passwordConfirm }) {
    return await pb.collection('users').create({
      name,
      email,
      role,
      password,
      passwordConfirm,
      emailVisibility: true,
      verified: true,
    });
  },

  async updateUser(id, { name, email, role, password, passwordConfirm }) {
    const payload = {
      name,
      email,
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