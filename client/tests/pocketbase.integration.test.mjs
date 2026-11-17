import assert from 'node:assert/strict';
import { test } from 'node:test';
import { spawn } from 'node:child_process';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { resolve, join, dirname, basename } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createServer } from 'node:net';
import { setTimeout as delay } from 'node:timers/promises';
import PocketBase from 'pocketbase';
import { pb } from '../src/pocketbase.js';
import { authService } from '../src/services/authService.js';
import { userService } from '../src/services/userService.js';
import { clinicService } from '../src/services/clinicService.js';
import { requireRole, guestLoader } from '../src/utils/authLoaders.js';
import { dateKey, financialSummary, formatCpf, formatPhone, monthBounds, onlyDigits } from '../src/utils/format.js';
import { getErrorMessage } from '../src/utils/pocketbaseErrors.js';
import { isValidCpf, isValidPhone } from '../src/utils/validation.js';

const root = resolve(fileURLToPath(new URL('../..', import.meta.url)));
const executable = process.env.POCKETBASE_BIN || join(root, 'server', process.platform === 'win32' ? 'pocketbase.exe' : 'pocketbase');

test('Integração real com PocketBase isolado (sem alterar server/pb_data)', async (t) => {
  const directory = await mkdtemp(join(tmpdir(), 'vetcare-test-'));
  const probe = createServer();
  await new Promise((done) => probe.listen(0, '127.0.0.1', done));
  const port = probe.address().port;
  await new Promise((done) => probe.close(done));
  const url = `http://127.0.0.1:${port}`;
  let server;
  let serverError = '';
  const stop = async () => {
    if (server && server.exitCode === null) {
      const exited = new Promise((done) => server.once('exit', done));
      server.kill();
      await exited;
    }
  };
  const start = async () => {
    server = spawn(executable, ['serve', '--http', `127.0.0.1:${port}`, '--dir', directory,
      '--migrationsDir', join(root, 'server/pb_migrations'), '--hooksDir', join(root, 'server/pb_hooks'), '--automigrate=false'], { windowsHide: true, stdio: ['ignore', 'pipe', 'pipe'] });
    server.on('error', (error) => { serverError = error.message; });
    server.stderr.on('data', (data) => { serverError += data.toString(); });
    for (let attempt = 0; attempt < 100; attempt++) {
      if (serverError || server.exitCode !== null) throw new Error(`Falha ao iniciar PocketBase: ${serverError || 'verifique as migrações'}`);
      try { if ((await fetch(`${url}/api/health`)).ok) return; } catch { /* aguarda inicialização */ }
      await delay(100);
    }
    throw new Error('PocketBase não iniciou no prazo esperado.');
  };
  t.after(async () => {
    pb.authStore.clear();
    await stop();
    assert.equal(dirname(directory), resolve(tmpdir()));
    assert.ok(basename(directory).startsWith('vetcare-test-'));
    await rm(directory, { recursive: true, force: true });
  });
  await start();
  pb.baseURL = url;
  const admin = new PocketBase(url);
  const reception = new PocketBase(url);
  const vet = new PocketBase(url);
  const anonymous = new PocketBase(url);
  await admin.collection('users').authWithPassword('adm.lucio@vetcare.com', 'lucio123456');
  await reception.collection('users').authWithPassword('rec.priscila@vetcare.com', 'priscila123456');
  await vet.collection('users').authWithPassword('vet.emily@vetcare.com', 'emily123456');
  const as = (actor) => pb.authStore.save(actor.authStore.token, actor.authStore.record);
  const denied = (error) => [400, 403, 404].includes(error.status);
  let tutor, animal, payment, visit, vaccine, prescription;
  const today = dateKey();

  await t.test('Instalação limpa preserva três contas e atribui os perfis corretos', async () => {
    const users = await admin.collection('users').getFullList();
    assert.equal(users.length, 3);
    assert.equal(admin.authStore.record.role, 'administracao');
    assert.equal(reception.authStore.record.role, 'recepcao');
    assert.equal(vet.authStore.record.role, 'veterinario');
  });

  await t.test('CRUD de usuários pelo serviço, senha opcional e persistência em nova sessão', async () => {
    as(admin);
    const data = { name: 'Usuário de teste', email: 'integration@example.test', role: 'recepcao', password: 'integration123', passwordConfirm: 'integration123' };
    const created = await userService.createUser(data);
    assert.ok((await userService.listUsers()).some((user) => user.id === created.id));
    await userService.updateUser(created.id, { ...data, name: 'Nome atualizado', password: '', passwordConfirm: '' });
    const independent = new PocketBase(url);
    await independent.collection('users').authWithPassword(data.email, data.password);
    assert.equal(independent.authStore.record.name, 'Nome atualizado');
    await assert.rejects(() => userService.createUser(data), (error) => error.status === 400);
    await assert.rejects(() => userService.updateUser(created.id, { ...data, passwordConfirm: 'diferente' }), /senhas não coincidem/);
    await userService.updateUser(created.id, { ...data, password: 'updated12345', passwordConfirm: 'updated12345' });
    await assert.rejects(() => independent.collection('users').authWithPassword(data.email, data.password));
    await independent.collection('users').authWithPassword(data.email, 'updated12345');
    await userService.deleteUser(created.id);
    await assert.rejects(() => admin.collection('users').getOne(created.id), (error) => error.status === 404);
    await assert.rejects(() => userService.deleteUser(admin.authStore.record.id), denied);
  });

  await t.test('Recepção e veterinário não administram usuários nem elevam o próprio perfil', async () => {
    for (const actor of [reception, vet]) {
      await assert.rejects(() => actor.collection('users').update(actor.authStore.record.id, { role: 'administracao' }), denied);
      await assert.rejects(() => actor.collection('users').create({ name: 'Intruso', email: 'blocked@example.test', role: 'administracao', password: 'blocked12345', passwordConfirm: 'blocked12345' }), denied);
      await assert.rejects(() => actor.collection('users').delete(admin.authStore.record.id), denied);
    }
    assert.ok(!(await reception.collection('users').getFullList()).some((record) => record.id === admin.authStore.record.id));
  });

  await t.test('Cadastros reais de tutores e animais com relações, edição e busca', async () => {
    as(reception);
    tutor = await clinicService.saveTutor(null, { name: 'Tutor integração', cpf: '390.533.447-05', phone: '71999999999' });
    tutor = await clinicService.saveTutor(tutor.id, { ...tutor, name: 'Tutor atualizado', phone: '71988888888' });
    animal = await clinicService.saveAnimal(null, { name: 'Animal integração', species: 'Cão', breed: 'SRD', sex: 'Macho', birthDate: '2020-01-01', tutor: tutor.id, active: true });
    animal = await clinicService.saveAnimal(animal.id, { ...animal, name: 'Animal atualizado' });
    const loaded = (await clinicService.animals()).find((record) => record.id === animal.id);
    assert.equal(loaded.expand.tutor.name, 'Tutor atualizado');
    assert.equal(loaded.name, 'Animal atualizado');
    assert.ok((await clinicService.tutors()).some((record) => record.id === tutor.id));
    await assert.rejects(() => clinicService.saveAnimal(null, { ...animal, birthDate: '2026-02-31' }), (error) => error.status === 400);
  });

  await t.test('REQ 04 — Tutor normaliza dados, valida CPF e telefone e impede CPF duplicado', async () => {
    as(reception);
    const created = await clinicService.saveTutor(null, {
      name: '  Maria   da Silva ', cpf: '111.444.777-35', phone: '(71) 3333-4444', email: ' Maria@Exemplo.COM ', address: ' Rua A, 10 ',
    });
    assert.deepEqual(
      [created.name, created.cpf, created.phone, created.email, created.address],
      ['Maria da Silva', '11144477735', '7133334444', 'maria@exemplo.com', 'Rua A, 10'],
    );
    // A normalização também vale para clientes da API que não usam o serviço do frontend.
    const raw = await reception.collection('tutors').create({ name: 'Cliente API', cpf: '935.411.347-80', phone: '(71) 98765-4321' });
    assert.deepEqual([raw.cpf, raw.phone], ['93541134780', '71987654321']);

    const invalid = (field, code) => (error) => error.status === 400 && error.response?.data?.[field]?.code === code;
    const base = { name: 'Inválido', cpf: '52998224725', phone: '71912345678' };
    await assert.rejects(() => clinicService.saveTutor(null, { ...base, cpf: '111.444.777-36' }), invalid('cpf', 'invalid_cpf'));
    await assert.rejects(() => clinicService.saveTutor(null, { ...base, cpf: '000.000.000-00' }), invalid('cpf', 'invalid_cpf'));
    await assert.rejects(() => clinicService.saveTutor(null, { ...base, cpf: '' }), invalid('cpf', 'validation_required'));
    await assert.rejects(() => clinicService.saveTutor(null, { ...base, phone: '7199' }), invalid('phone', 'invalid_phone'));
    await assert.rejects(() => clinicService.saveTutor(null, { ...base, phone: '' }), invalid('phone', 'validation_required'));
    await assert.rejects(() => clinicService.saveTutor(null, { ...base, email: 'sem-arroba' }), invalid('email', 'validation_is_email'));
    await assert.rejects(() => clinicService.saveTutor(null, { ...base, name: '   ' }), invalid('name', 'validation_required'));
    const invalidCpf = await clinicService.saveTutor(null, { ...base, cpf: '111.444.777-36' }).catch((error) => error);
    assert.equal(getErrorMessage(invalidCpf), 'CPF: Informe um CPF válido.');

    const duplicate = (error) => invalid('cpf', 'validation_not_unique')(error) && getErrorMessage(error) === 'CPF: já existe um registro com este valor.';
    await assert.rejects(() => clinicService.saveTutor(null, { ...base, cpf: '111.444.777-35' }), duplicate);
    await assert.rejects(() => clinicService.saveTutor(raw.id, { ...raw, cpf: created.cpf }), duplicate);
    // Editar mantendo o próprio CPF não é duplicidade.
    assert.equal((await clinicService.saveTutor(created.id, { ...created, phone: '71988887777' })).phone, '71988887777');
    // O índice único também barra cadastros simultâneos com o mesmo CPF.
    const attempts = await Promise.allSettled([1, 2].map(() => clinicService.saveTutor(null, base)));
    assert.equal(attempts.filter((result) => result.status === 'fulfilled').length, 1);
    await clinicService.deleteTutor(attempts.find((result) => result.status === 'fulfilled').value.id);

    // Sem permissão, a resposta não revela se o CPF já está cadastrado.
    const anonymousAttempt = await anonymous.collection('tutors').create({ ...base, cpf: created.cpf }).catch((error) => error);
    assert.ok(denied(anonymousAttempt));
    assert.equal(anonymousAttempt.response?.data?.cpf, undefined);
    await clinicService.deleteTutor(created.id);
    await clinicService.deleteTutor(raw.id);
  });

  await t.test('REQ 04 — Exclusão de tutor respeita perfis e vínculos com animais e pagamentos', async () => {
    as(vet);
    // Veterinário consulta, cadastra e altera tutores (CRU), mas não exclui.
    let byVet = await clinicService.saveTutor(null, { name: 'Tutor do veterinário', cpf: '52998224725', phone: '71912345678' });
    byVet = await clinicService.saveTutor(byVet.id, { ...byVet, name: 'Tutor do veterinário editado' });
    assert.ok((await clinicService.tutors()).some((record) => record.name === 'Tutor do veterinário editado'));
    await assert.rejects(() => clinicService.deleteTutor(byVet.id), denied);

    as(reception);
    const withAnimal = await clinicService.deleteTutor(tutor.id).catch((error) => error);
    assert.equal(withAnimal.status, 400);
    assert.match(getErrorMessage(withAnimal, 'Tutor vinculado.'), /Tutor vinculado/);
    const linkedPayment = await clinicService.savePayment(null, { tutor: byVet.id, date: today, amount: '1', status: 'Pendente' });
    await assert.rejects(() => clinicService.deleteTutor(byVet.id), (error) => error.status === 400);
    await reception.collection('payments').delete(linkedPayment.id);
    await clinicService.deleteTutor(byVet.id);
    await assert.rejects(() => reception.collection('tutors').getOne(byVet.id), (error) => error.status === 404);
    assert.ok(await reception.collection('tutors').getOne(tutor.id));

    as(admin);
    const byAdmin = await clinicService.saveTutor(null, { name: 'Tutor temporário', cpf: '52998224725', phone: '7133334444' });
    await clinicService.deleteTutor(byAdmin.id);
    await assert.rejects(() => anonymous.collection('tutors').delete(tutor.id), denied);
    assert.equal((await anonymous.collection('tutors').getList(1, 10)).totalItems, 0);
  });

  await t.test('REQ 05 — Animal exige sexo e tutor, normaliza textos e recusa nascimento futuro', async () => {
    as(reception);
    const base = { name: '  Thor ', species: ' Cão ', breed: ' Labrador   Retriever ', sex: 'Macho', birthDate: '', tutor: tutor.id, active: true };
    const created = await clinicService.saveAnimal(null, base);
    assert.deepEqual([created.name, created.species, created.breed, created.sex], ['Thor', 'Cão', 'Labrador Retriever', 'Macho']);
    // A normalização também vale para clientes da API que não usam o serviço do frontend.
    const raw = await reception.collection('animals').create({ name: ' Mel  ', species: 'Gato', sex: 'Fêmea', tutor: tutor.id, active: true });
    assert.equal(raw.name, 'Mel');

    const invalid = (field, code) => (error) => error.status === 400 && error.response?.data?.[field]?.code === code;
    await assert.rejects(() => clinicService.saveAnimal(null, { ...base, sex: '' }), invalid('sex', 'validation_required'));
    await assert.rejects(() => clinicService.saveAnimal(null, { ...base, sex: 'Outro' }), invalid('sex', 'validation_invalid_value'));
    await assert.rejects(() => clinicService.saveAnimal(null, { ...base, tutor: '' }), invalid('tutor', 'validation_required'));
    await assert.rejects(() => clinicService.saveAnimal(null, { ...base, species: '  ' }), invalid('species', 'validation_required'));
    const future = await clinicService.saveAnimal(null, { ...base, birthDate: '2999-01-01' }).catch((error) => error);
    assert.ok(invalid('birthDate', 'invalid_date')(future));
    assert.equal(getErrorMessage(future), 'Data de nascimento: A data de nascimento não pode ser futura.');
    const missingSex = await clinicService.saveAnimal(null, { ...base, sex: '' }).catch((error) => error);
    assert.equal(getErrorMessage(missingSex), 'Sexo: preenchimento obrigatório.');
    assert.equal((await clinicService.saveAnimal(created.id, { ...created, birthDate: today })).birthDate, today);
    await clinicService.deleteAnimal(created.id);
    await clinicService.deleteAnimal(raw.id);
  });

  await t.test('REQ 05 — Exclusão de animal respeita perfis e preserva animais com histórico', async () => {
    as(vet);
    // Veterinário consulta, cadastra e altera animais (CRU), mas não exclui.
    let byVet = await clinicService.saveAnimal(null, { name: 'Pipoca', species: 'Gato', breed: '', sex: 'Fêmea', birthDate: '', tutor: tutor.id, active: true });
    byVet = await clinicService.saveAnimal(byVet.id, { ...byVet, name: 'Pipoca editada' });
    assert.equal(byVet.name, 'Pipoca editada');
    await assert.rejects(() => clinicService.deleteAnimal(byVet.id), denied);
    const vaccination = await clinicService.saveClinical('vaccinations', null, { animal: byVet.id, veterinarian: vet.authStore.record.id, date: today, name: 'V4', nextDate: '' });

    as(reception);
    // Com registro clínico vinculado, o PocketBase recusa a exclusão; o cadastro pode ser inativado.
    const blocked = await clinicService.deleteAnimal(byVet.id).catch((error) => error);
    assert.equal(blocked.status, 400);
    assert.match(getErrorMessage(blocked, 'Animal com histórico.'), /Animal com histórico/);
    assert.equal((await clinicService.setAnimalActive(byVet.id, false)).active, false);
    assert.equal((await reception.collection('vaccinations').getOne(vaccination.id)).animal, byVet.id);

    // Sem vínculos, recepção e administração excluem.
    const free = await clinicService.saveAnimal(null, { name: 'Sem vínculo', species: 'Cão', sex: 'Macho', tutor: tutor.id, active: true });
    await clinicService.deleteAnimal(free.id);
    await assert.rejects(() => reception.collection('animals').getOne(free.id), (error) => error.status === 404);
    as(admin);
    const byAdmin = await clinicService.saveAnimal(null, { name: 'Temporário', species: 'Ave', sex: 'Macho', tutor: tutor.id, active: true });
    await clinicService.deleteAnimal(byAdmin.id);
    await assert.rejects(() => anonymous.collection('animals').delete(animal.id), denied);
  });

  await t.test('Veterinários vêm das contas reais; recepção só consulta e administração edita', async () => {
    as(reception);
    assert.equal((await clinicService.veterinarians())[0].id, vet.authStore.record.id);
    await assert.rejects(() => clinicService.saveVeterinarian(vet.authStore.record.id, { name: 'Mudança indevida', specialty: '', phone: '' }), denied);
    as(admin);
    const updated = await clinicService.saveVeterinarian(vet.authStore.record.id, { name: 'Dra. Emily', specialty: 'Clínica geral', phone: '71911111111' });
    assert.equal(updated.specialty, 'Clínica geral');
  });

  await t.test('Agenda persiste, impede conflito concorrente e permite cancelar e reutilizar horário', async () => {
    as(reception);
    const payload = { animal: animal.id, veterinarian: vet.authStore.record.id, date: today, time: '09:00', type: 'Consulta' };
    const attempts = await Promise.allSettled([clinicService.schedule(payload), clinicService.schedule(payload)]);
    assert.equal(attempts.filter((result) => result.status === 'fulfilled').length, 1);
    const appointment = attempts.find((result) => result.status === 'fulfilled').value;
    const loaded = (await clinicService.appointments(today, today)).find((record) => record.id === appointment.id);
    assert.equal(loaded.expand.animal.expand.tutor.id, tutor.id);
    await assert.rejects(() => reception.collection('appointments').update(appointment.id, { status: 'Cancelada', time: '10:00' }), denied);
    await clinicService.cancel(appointment.id);
    assert.equal((await reception.collection('appointments').getOne(appointment.id)).status, 'Cancelada');
    await clinicService.schedule(payload);
    assert.equal((await clinicService.appointments(today, today)).filter((record) => record.status === 'Agendada').length, 1);
  });

  await t.test('Atendimentos, vacinas e prescrições reais respeitam os perfis de leitura e escrita', async () => {
    as(vet);
    const author = { animal: animal.id, veterinarian: vet.authStore.record.id, date: today };
    visit = await clinicService.saveClinical('medical_records', null, { ...author, title: 'Consulta', notes: 'Registro de integração.' });
    vaccine = await clinicService.saveClinical('vaccinations', null, { ...author, name: 'Vacina teste', nextDate: '' });
    prescription = await clinicService.saveClinical('prescriptions', null, { ...author, title: 'Prescrição teste', instructions: 'Instruções de integração.', active: true });
    await clinicService.saveClinical('vaccinations', vaccine.id, { ...author, name: 'Vacina atualizada', nextDate: today });
    await clinicService.saveClinical('prescriptions', prescription.id, { ...author, title: 'Prescrição teste', instructions: 'Instruções atualizadas.', active: false });
    assert.equal((await clinicService.clinical('vaccinations', animal.id))[0].name, 'Vacina atualizada');
    assert.equal((await clinicService.clinical('prescriptions', animal.id))[0].active, false);
    await assert.rejects(() => reception.collection('medical_records').getOne(visit.id), denied);
    assert.equal((await reception.collection('vaccinations').getOne(vaccine.id)).id, vaccine.id);
    assert.equal((await reception.collection('prescriptions').getOne(prescription.id)).id, prescription.id);
    await assert.rejects(() => reception.collection('vaccinations').create({ ...author, name: 'Indevida' }), denied);
    await assert.rejects(() => admin.collection('medical_records').create({ ...author, title: 'Indevido', notes: 'Indevido' }), denied);
    await assert.rejects(() => vet.collection('vaccinations').create({ ...author, name: 'Inválida', nextDate: '2000-01-01' }), (error) => error.status === 400);
  });

  await t.test('Pagamentos e indicadores usam valores persistidos em centavos e período selecionado', async () => {
    as(reception);
    payment = await clinicService.savePayment(null, { tutor: tutor.id, date: today, amount: '10.10', status: 'Pendente' });
    assert.equal(payment.amountCents, 1010);
    payment = await clinicService.savePayment(payment.id, { tutor: tutor.id, date: today, amount: '30.30', status: 'Pago' });
    assert.equal(payment.amountCents, 3030);
    await assert.rejects(() => vet.collection('payments').getOne(payment.id), denied);
    await assert.rejects(() => vet.collection('payments').create({ tutor: tutor.id, date: today, amountCents: 500, status: 'Pago' }), denied);
    as(admin);
    const summary = financialSummary(await clinicService.payments(), await clinicService.visits(), new Date());
    assert.equal(summary.revenue, 3030);
    assert.equal(summary.pending, 0);
    assert.equal(summary.visits, 1);
    assert.equal(summary.weeks.reduce((sum, value) => sum + value, 0), 3030);
    const anotherMonth = new Date(new Date().getFullYear(), new Date().getMonth() + 1, 1);
    assert.equal(financialSummary(await clinicService.payments(), [], anotherMonth).revenue, 0);
  });

  await t.test('Acesso anônimo não expõe dados nem permite escrita', async () => {
    assert.equal((await anonymous.collection('animals').getList(1, 10)).totalItems, 0);
    await assert.rejects(() => anonymous.collection('tutors').create({ name: 'Indevido' }), denied);
  });

  await t.test('Rotas revalidam sessão e direcionam cada perfil para uma rota existente', async () => {
    as(admin);
    await assert.rejects(() => guestLoader(), (response) => response.headers?.get('Location') === '/financeiro');
    as(reception);
    await assert.rejects(() => requireRole(['administracao'])(), (response) => response.headers?.get('Location') === '/agenda');
    as(vet);
    assert.equal(await requireRole(['veterinario'])(), null);
  });

  await t.test('Perfil alterado e conta excluída são reconhecidos na revalidação', async () => {
    as(admin);
    const user = await userService.createUser({ name: 'Sessão teste', email: 'session@example.test', role: 'recepcao', password: 'session12345', passwordConfirm: 'session12345' });
    await authService.login({ email: user.email, password: 'session12345' });
    await admin.collection('users').update(user.id, { role: 'veterinario' });
    assert.equal((await authService.refresh()).role, 'veterinario');
    await admin.collection('users').delete(user.id);
    assert.equal(await authService.refresh(), null);
    assert.equal(pb.authStore.isValid, false);
    pb.authStore.save('token-invalido', user);
    assert.equal(await authService.refresh(), null);
  });

  await t.test('Erro de rede é distinguido de sessão inválida e não apaga uma sessão válida', async () => {
    as(admin);
    pb.baseURL = 'http://127.0.0.1:1';
    try {
      await assert.rejects(() => authService.refresh(), (error) => {
        assert.equal(error.status, 0);
        assert.match(getErrorMessage(error), /conectar ao servidor/);
        return true;
      });
      assert.equal(pb.authStore.isValid, true);
    } finally { pb.baseURL = url; }
  });

  await t.test('Dados sobrevivem ao reinício completo do backend', async () => {
    await stop();
    await start();
    const independent = new PocketBase(url);
    await independent.collection('users').authWithPassword('adm.lucio@vetcare.com', 'lucio123456');
    assert.equal((await independent.collection('tutors').getOne(tutor.id)).cpf, '39053344705');
    assert.equal((await independent.collection('animals').getOne(animal.id)).name, 'Animal atualizado');
    assert.equal((await independent.collection('payments').getOne(payment.id)).amountCents, 3030);
    assert.equal((await independent.collection('medical_records').getOne(visit.id)).title, 'Consulta');
    assert.equal((await independent.collection('vaccinations').getOne(vaccine.id)).name, 'Vacina atualizada');
    assert.equal((await independent.collection('prescriptions').getOne(prescription.id)).active, false);
    assert.equal((await independent.collection('appointments').getFullList()).length, 2);
  });
});

test('REQ 04 — Máscaras e validações de CPF e telefone no frontend', () => {
  assert.equal(onlyDigits('(71) 9.87-65'), '7198765');
  assert.equal(formatCpf('52998224725'), '529.982.247-25');
  assert.equal(formatCpf('5299'), '529.9');
  assert.equal(formatCpf('529.982.247-2599'), '529.982.247-25');
  assert.equal(formatPhone('71987654321'), '(71) 98765-4321');
  assert.equal(formatPhone('7133334444'), '(71) 3333-4444');
  assert.equal(formatPhone('719'), '(71) 9');
  assert.equal(formatPhone(''), '');
  assert.ok(isValidCpf('529.982.247-25'));
  for (const cpf of ['529.982.247-24', '111.111.111-11', '1234', '']) assert.ok(!isValidCpf(cpf), cpf);
  assert.ok(isValidPhone('(71) 98765-4321'));
  assert.ok(isValidPhone('(71) 3333-4444'));
  for (const phone of ['(71) 8765-432', '(01) 98765-4321', '(71) 88765-4321', '']) assert.ok(!isValidPhone(phone), phone);
});

test('Datas locais e limites de mês não dependem de conversão UTC', () => {
  assert.equal(dateKey(new Date(2026, 0, 1)), '2026-01-01');
  assert.deepEqual(monthBounds(new Date(2026, 11, 31)), { start: '2026-12-01', end: '2027-01-01' });
});
