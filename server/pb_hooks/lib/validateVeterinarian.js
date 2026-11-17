// REQ 06 — Normalização e validação dos dados profissionais das contas (veterinários).
// O frontend aplica as mesmas regras (client/src/utils/validation.js) antes de enviar.
// Telefone e CRMV só são verificados quando mudam: assim, gravações internas do PocketBase na conta
// (troca de senha, verificação de e-mail) não falham por dados antigos fora do padrão.
const { isValidPhone } = require(`${__hooks}/lib/validateTutor.js`);

const UFS = ['AC', 'AL', 'AM', 'AP', 'BA', 'CE', 'DF', 'ES', 'GO', 'MA', 'MG', 'MS', 'MT', 'PA', 'PB', 'PE',
  'PI', 'PR', 'RJ', 'RN', 'RO', 'RR', 'RS', 'SC', 'SE', 'SP', 'TO'];

// Aceita "CRMV-BA 1234", "BA 1234", "1234/BA" e variações; grava como "CRMV-BA 1234".
function normalizeCrmv(value) {
  const text = String(value || '').trim().toUpperCase();
  const letters = text.replace(/CRMV/g, '').replace(/[^A-Z]/g, '');
  const number = text.replace(/\D/g, '').replace(/^0+/, '');
  return letters.length === 2 && number ? `CRMV-${letters} ${number}` : text;
}

const isValidCrmv = (value) => {
  const match = /^CRMV-([A-Z]{2}) [1-9]\d{0,5}$/.exec(value);
  return Boolean(match) && UFS.includes(match[1]);
};

function validate(app, record) {
  record.set('phone', String(record.getString('phone')).replace(/\D/g, ''));
  record.set('specialty', record.getString('specialty').trim().replace(/\s+/g, ' '));
  record.set('crmv', normalizeCrmv(record.getString('crmv')));

  const original = record.original();
  const changed = (field) => record.isNew() || record.getString(field) !== original.getString(field);
  const errors = {};

  const crmv = record.getString('crmv');
  if (crmv && changed('crmv')) {
    if (!isValidCrmv(crmv)) {
      errors.crmv = new ValidationError('invalid_crmv', 'Informe o CRMV com a UF e o número (ex.: CRMV-BA 1234).');
    } else {
      let duplicate = null;
      try {
        duplicate = app.findFirstRecordByFilter('users', 'crmv = {:crmv} && id != {:id}', { crmv, id: record.id });
      } catch (_) { /* nenhuma outra conta com este CRMV */ }
      if (duplicate) errors.crmv = new ValidationError('validation_not_unique', 'Já existe um veterinário com este CRMV.');
    }
  }

  const phone = record.getString('phone');
  if (phone && changed('phone') && !isValidPhone(phone)) {
    errors.phone = new ValidationError('invalid_phone', 'Informe um telefone válido com DDD.');
  }

  if (Object.keys(errors).length) throw new BadRequestError('Dados do veterinário inválidos.', errors);
}

module.exports = { validate, normalizeCrmv, isValidCrmv };
