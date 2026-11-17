// REQ 07 — Regras do agendamento no backend.
// Valem só na criação: depois de agendada, a regra de acesso permite apenas o cancelamento.
// O formato da data é verificado em validateClinic.js e o horário (09:00–17:00) pela própria coleção.
// Os índices únicos de veterinário e de animal por horário barram também agendamentos simultâneos;
// as consultas abaixo existem para devolver uma mensagem clara no caso comum.
function validate(app, record, now) {
  if (!record.isNew()) return;
  record.set('type', record.getString('type').trim().replace(/\s+/g, ' '));
  const errors = {};

  // O tutor da consulta é sempre o tutor do animal no momento do agendamento.
  let animal = null;
  try {
    animal = app.findRecordById('animals', record.getString('animal'));
  } catch (_) { /* animal inexistente: a validação da relação responde */ }
  if (animal) {
    record.set('tutor', animal.getString('tutor'));
    if (!animal.getBool('active')) {
      errors.animal = new ValidationError('inactive_animal', 'O animal está inativo. Reative o cadastro em Registros para agendar.');
    }
  }

  const date = record.getString('date');
  const time = record.getString('time');
  if (date && date < now.date) {
    errors.date = new ValidationError('past_date', 'Não é possível agendar em uma data passada.');
  } else if (date === now.date && time && time <= now.time) {
    errors.time = new ValidationError('past_time', 'Este horário já passou. Escolha um horário futuro.');
  }

  if (date && time && record.getString('status') !== 'Cancelada') {
    const busy = (field) => app.findRecordsByFilter('appointments',
      `${field} = {:value} && date = {:date} && time = {:time} && status != 'Cancelada'`, '', 1, 0,
      { value: record.getString(field), date, time }).length > 0;
    if (busy('veterinarian')) {
      errors.veterinarian = new ValidationError('slot_taken', 'Já possui consulta agendada neste horário.');
    }
    if (!errors.animal && busy('animal')) {
      errors.animal = new ValidationError('animal_busy', 'Já possui consulta agendada neste horário.');
    }
  }

  if (Object.keys(errors).length) throw new BadRequestError('Não foi possível agendar a consulta.', errors);
}

module.exports = { validate };
