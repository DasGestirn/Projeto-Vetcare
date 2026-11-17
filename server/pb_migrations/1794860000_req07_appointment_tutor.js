/// <reference path="../pb_data/types.d.ts" />

// REQ 07 — Agendar Consulta.
// O requisito relaciona animal, tutor, veterinário, data e horário. A coleção `appointments`
// (1794820000_integrate_clinic.js) chegava ao tutor só pelo animal; esta migração grava o tutor na
// própria consulta, preenchido pelo backend a partir do animal (pb_hooks/lib/validateAppointment.js).
// Assim o histórico mantém o tutor da época mesmo se o animal mudar de tutor (ADR-005).
// Também impede que um animal tenha duas consultas ativas no mesmo horário, como já ocorria com o
// veterinário, e acrescenta o tutor aos campos que o cancelamento não pode alterar.
const authenticated = "(@request.auth.role = 'administracao' || @request.auth.role = 'veterinario' || @request.auth.role = 'recepcao')";
const cancelOnly = (fields) => `${authenticated} && @request.body.status = 'Cancelada' && ${fields.map((field) => `@request.body.${field}:changed = false`).join(' && ')}`;

migrate((app) => {
  const tutors = app.findCollectionByNameOrId('tutors');
  let appointments = app.findCollectionByNameOrId('appointments');
  appointments.fields.add(new RelationField({ name: 'tutor', collectionId: tutors.id, maxSelect: 1, cascadeDelete: false }));
  app.save(appointments);

  // Consultas já existentes recebem o tutor atual do animal.
  for (const record of app.findAllRecords('appointments')) {
    const animal = app.findRecordById('animals', record.getString('animal'));
    record.set('tutor', animal.getString('tutor'));
    app.saveNoValidate(record);
  }

  appointments = app.findCollectionByNameOrId('appointments');
  const tutor = appointments.fields.getByName('tutor');
  tutor.required = true;
  appointments.fields.add(tutor);
  appointments.addIndex('idx_appointments_tutor', false, 'tutor', '');
  appointments.addIndex('idx_appointments_animal_slot', true, 'animal, date, time', "status != 'Cancelada'");
  appointments.updateRule = cancelOnly(['animal', 'tutor', 'veterinarian', 'date', 'time', 'type']);
  app.save(appointments);
}, (app) => {
  const appointments = app.findCollectionByNameOrId('appointments');
  appointments.removeIndex('idx_appointments_animal_slot');
  appointments.removeIndex('idx_appointments_tutor');
  appointments.fields.removeByName('tutor');
  appointments.updateRule = cancelOnly(['animal', 'veterinarian', 'date', 'time', 'type']);
  app.save(appointments);
});
