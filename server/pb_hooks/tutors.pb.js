/// <reference path="../pb_data/types.d.ts" />

// REQ 04 — Manter Tutor: normaliza e valida CPF, telefone e e-mail antes de gravar.
// Usa onRecordValidate para valer em qualquer gravação (API, painel administrativo e código do
// servidor) e rodar somente depois das regras de acesso, sem expor a quem não tem permissão se um
// CPF já está cadastrado.
onRecordValidate((event) => {
  require(`${__hooks}/lib/validateTutor.js`).validate(event.app, event.record);
  return event.next();
}, 'tutors');
