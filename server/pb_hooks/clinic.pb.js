/// <reference path="../pb_data/types.d.ts" />

onRecordCreateRequest((event) => {
  require(`${__hooks}/lib/validateClinic.js`).validate(event.record);
  return event.next();
}, 'animals', 'appointments', 'medical_records', 'vaccinations', 'prescriptions', 'payments');

onRecordUpdateRequest((event) => {
  require(`${__hooks}/lib/validateClinic.js`).validate(event.record);
  return event.next();
}, 'animals', 'appointments', 'medical_records', 'vaccinations', 'prescriptions', 'payments');
