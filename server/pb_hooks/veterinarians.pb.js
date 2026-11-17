/// <reference path="../pb_data/types.d.ts" />

// REQ 06 — Manter Veterinário: os dados profissionais (CRMV, especialidade e telefone) ficam na
// coleção `users`. Como em tutors.pb.js, onRecordValidate vale para qualquer gravação (API, painel
// administrativo e tela de Usuários) e roda depois das regras de acesso.
// A exclusão de veterinários com consultas ou registros clínicos é barrada pelo próprio PocketBase
// (relações obrigatórias sem cascata).
onRecordValidate((event) => {
  require(`${__hooks}/lib/validateVeterinarian.js`).validate(event.app, event.record);
  return event.next();
}, 'users');
