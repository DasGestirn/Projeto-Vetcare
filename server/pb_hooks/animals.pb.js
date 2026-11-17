/// <reference path="../pb_data/types.d.ts" />

// REQ 05 — Manter Animal: normaliza nome, espécie e raça e impede data de nascimento futura.
// Como em tutors.pb.js, onRecordValidate vale para qualquer gravação e roda depois das regras de acesso.
// A exclusão de animais com consultas ou registros clínicos é barrada pelo próprio PocketBase
// (relações obrigatórias sem cascata); nesses casos o cadastro deve ser inativado.
onRecordValidate((event) => {
  const { clinicNow } = require(`${__hooks}/lib/clinicTime.js`);
  require(`${__hooks}/lib/validateAnimal.js`).validate(event.record, clinicNow().date);
  return event.next();
}, 'animals');
