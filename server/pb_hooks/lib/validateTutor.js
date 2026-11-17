// REQ 04 — Normalização e validação dos dados do tutor no backend.
// O frontend aplica as mesmas regras (client/src/utils/validation.js) antes de enviar; aqui elas
// valem para qualquer cliente da API. O JSVM do PocketBase não importa módulos do client, por isso
// a verificação do CPF é repetida.

const digits = (value) => String(value || '').replace(/\D/g, '');

function isValidCpf(cpf) {
  if (!/^\d{11}$/.test(cpf) || /^(\d)\1{10}$/.test(cpf)) return false;
  for (const length of [9, 10]) {
    let sum = 0;
    for (let i = 0; i < length; i++) sum += Number(cpf[i]) * (length + 1 - i);
    if ((sum * 10) % 11 % 10 !== Number(cpf[length])) return false;
  }
  return true;
}

// DDD (dois dígitos de 1 a 9) + celular com nono dígito ou fixo de 8 dígitos.
const isValidPhone = (phone) => /^[1-9]{2}(9\d{8}|[2-8]\d{7})$/.test(phone);

function normalize(record) {
  record.set('name', record.getString('name').trim().replace(/\s+/g, ' '));
  record.set('cpf', digits(record.getString('cpf')));
  record.set('phone', digits(record.getString('phone')));
  record.set('email', record.getString('email').trim().toLowerCase());
  record.set('address', record.getString('address').trim());
}

function validate(app, record) {
  normalize(record);
  const errors = {};

  // Campos vazios ficam a cargo da validação "required" da própria coleção.
  const cpf = record.getString('cpf');
  if (cpf && !isValidCpf(cpf)) {
    errors.cpf = new ValidationError('invalid_cpf', 'Informe um CPF válido.');
  } else if (cpf) {
    let duplicate = null;
    try {
      duplicate = app.findFirstRecordByFilter('tutors', 'cpf = {:cpf} && id != {:id}', { cpf, id: record.id });
    } catch (_) { /* nenhum outro tutor com este CPF */ }
    if (duplicate) errors.cpf = new ValidationError('validation_not_unique', 'Já existe um tutor com este CPF.');
  }

  const phone = record.getString('phone');
  if (phone && !isValidPhone(phone)) {
    errors.phone = new ValidationError('invalid_phone', 'Informe um telefone válido com DDD.');
  }

  if (Object.keys(errors).length) throw new BadRequestError('Dados do tutor inválidos.', errors);
}

module.exports = { validate, isValidCpf, isValidPhone };
