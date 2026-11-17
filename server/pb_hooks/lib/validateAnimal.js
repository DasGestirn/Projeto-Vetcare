// REQ 05 — Normalização e validação dos dados do animal no backend.
// Formato e existência da data de nascimento já são verificados em validateClinic.js; aqui ficam
// as regras próprias do cadastro. Sexo e tutor são exigidos pela própria coleção.
const clean = (value) => String(value || '').trim().replace(/\s+/g, ' ');

function validate(record, today) {
  for (const field of ['name', 'species', 'breed']) record.set(field, clean(record.getString(field)));

  const birthDate = record.getString('birthDate');
  if (birthDate && birthDate > today) {
    throw new BadRequestError('Dados do animal inválidos.', {
      birthDate: new ValidationError('invalid_date', 'A data de nascimento não pode ser futura.'),
    });
  }
}

module.exports = { validate };
