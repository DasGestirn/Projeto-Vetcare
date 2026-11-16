import { pb } from '../pocketbase.js';

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
  saveTutor: (id, data) => save('tutors', id, { name: data.name.trim(), phone: data.phone.trim() }),
  saveAnimal: (id, data) => save('animals', id, {
    name: data.name.trim(), species: data.species.trim(), breed: data.breed.trim(),
    birthDate: data.birthDate || '', tutor: data.tutor, active: data.active,
  }),
  saveVeterinarian: (id, data) => save('users', id, { name: data.name.trim(), specialty: data.specialty.trim(), phone: data.phone.trim() }),
  savePayment: (id, data) => save('payments', id, {
    tutor: data.tutor, date: data.date, amountCents: Math.round(Number(data.amount) * 100), status: data.status,
  }),
  schedule: (data) => pb.collection('appointments').create({ ...data, status: 'Agendada' }),
  cancel: (id) => pb.collection('appointments').update(id, { status: 'Cancelada' }),
  saveClinical: (collection, id, data) => save(collection, id, data),
};
