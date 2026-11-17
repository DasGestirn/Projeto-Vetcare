/// <reference path="../pb_data/types.d.ts" />

// REQ 07 — Agendar Consulta: grava o tutor a partir do animal e recusa data ou horário passados,
// animal inativo e horário já ocupado pelo veterinário ou pelo animal.
// Como em tutors.pb.js, onRecordValidate vale para qualquer gravação e roda depois das regras de acesso.
onRecordValidate((event) => {
  const { clinicNow } = require(`${__hooks}/lib/clinicTime.js`);
  require(`${__hooks}/lib/validateAppointment.js`).validate(event.app, event.record, clinicNow());
  return event.next();
}, 'appointments');
