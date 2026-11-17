import { pb } from '../pocketbase.js';
import { onlyDigits } from '../utils/format.js';
import { normalizeCrmv } from '../utils/validation.js';

const list = (collection, options = {}) => pb.collection(collection).getFullList({ requestKey: null, ...options });
const save = (collection, id, data) => id ? pb.collection(collection).update(id, data) : pb.collection(collection).create(data);

export const clinicService = {
  tutors: (options) => list('tutors', { sort: 'name', ...options }),
  animals: (options) => list('animals', { sort: 'name', expand: 'tutor', ...options }),
  veterinarians: (options) => list('users', { sort: 'name', filter: "role = 'veterinario'", ...options }),
  payments: (options) => list('payments', { sort: '-date,-created', expand: 'tutor', ...options }),
  appointments: (start, end, options) => list('appointments', {
    filter: pb.filter('date >= {:start} && date <= {:end}', { start, end }),
    sort: 'date,time,created', expand: 'animal,animal.tutor,veterinarian', ...options,
  }),
  clinical: (collection, animal, options) => list(collection, {
    filter: pb.filter('animal = {:animal}', { animal }), sort: '-date,-created', expand: 'veterinarian', ...options,
  }),
  visits: (options) => list('medical_records', { fields: 'id,date', ...options }),
  saveTutor: (id, data) => save('tutors', id, {
    name: data.name.trim(), cpf: onlyDigits(data.cpf), phone: onlyDigits(data.phone),
    email: (data.email || '').trim().toLowerCase(), address: (data.address || '').trim(),
  }),
  deleteTutor: (id) => pb.collection('tutors').delete(id),
  saveAnimal: (id, data) => save('animals', id, {
    name: data.name.trim(), species: data.species.trim(), breed: (data.breed || '').trim(), sex: data.sex,
    birthDate: data.birthDate || '', tutor: data.tutor, active: data.active,
  }),
  setAnimalActive: (id, active) => pb.collection('animals').update(id, { active }),
  deleteAnimal: (id) => pb.collection('animals').delete(id),
  // REQ 06 — Veterinários são contas de `users` com perfil `veterinario`. O CRMV só é enviado quando
  // informado: o próprio veterinário edita os demais dados, mas não altera o CRMV.
  createVeterinarian: (data) => pb.collection('users').create({
    name: data.name.trim(), email: data.email.trim().toLowerCase(), role: 'veterinario',
    crmv: normalizeCrmv(data.crmv), specialty: (data.specialty || '').trim(), phone: onlyDigits(data.phone),
    password: data.password, passwordConfirm: data.passwordConfirm, emailVisibility: true, verified: true,
  }),
  saveVeterinarian: (id, data) => save('users', id, {
    name: data.name.trim(), specialty: (data.specialty || '').trim(), phone: onlyDigits(data.phone),
    ...(data.crmv === undefined ? {} : { crmv: normalizeCrmv(data.crmv) }),
  }),
  deleteVeterinarian: (id) => pb.collection('users').delete(id),
  savePayment: (id, data) => save('payments', id, {
    tutor: data.tutor, date: data.date, amountCents: Math.round(Number(data.amount) * 100), status: data.status,
  }),
  schedule: (data) => pb.collection('appointments').create({ ...data, status: 'Agendada' }),
  cancel: (id) => pb.collection('appointments').update(id, { status: 'Cancelada' }),
  saveClinical: (collection, id, data) => save(collection, id, data),
};
