/// <reference path="../pb_data/types.d.ts" />

// REQ 06 — Manter Veterinário.
// Veterinários são contas da coleção `users` com perfil `veterinario` (1794820000_integrate_clinic.js),
// que já tinham telefone e especialidade. Esta migração acrescenta o registro profissional (CRMV),
// único entre as contas, e grava telefones somente com dígitos, como no cadastro de tutores.
// O formato do CRMV e do telefone é verificado em pb_hooks/lib/validateVeterinarian.js.
//
// Regras de acesso (docs/RBAC.md: administração CRUD, recepção R, veterinário RU): o veterinário
// passa a alterar somente a própria conta, e o CRMV só é alterado pela administração.
const admin = "@request.auth.role = 'administracao'";
const vet = "@request.auth.role = 'veterinario'";
const passwordUnchanged = '@request.body.password:isset = false && @request.body.passwordConfirm:isset = false';
const unchanged = (fields) => fields.map((field) => `@request.body.${field}:changed = false`).join(' && ');

migrate((app) => {
  // Migração aditiva: contas existentes são preservadas e apenas têm o telefone normalizado.
  for (const record of app.findAllRecords('users')) {
    const digits = record.getString('phone').replace(/\D/g, '');
    if (digits !== record.getString('phone')) {
      record.set('phone', digits);
      app.saveNoValidate(record);
    }
  }

  const users = app.findCollectionByNameOrId('users');
  users.fields.add(new TextField({ name: 'crmv', max: 20, pattern: '^CRMV-[A-Z]{2} [1-9]\\d{0,5}$' }));
  // Índice parcial: contas sem CRMV (administração, recepção e veterinários antigos) não colidem.
  users.addIndex('idx_users_crmv', true, 'crmv', "crmv != ''");
  users.updateRule = `${admin} || (${vet} && id = @request.auth.id && ${unchanged(['role', 'email', 'verified', 'emailVisibility', 'crmv'])} && ${passwordUnchanged})`;
  app.save(users);
}, (app) => {
  const users = app.findCollectionByNameOrId('users');
  users.removeIndex('idx_users_crmv');
  users.fields.removeByName('crmv');
  users.updateRule = `${admin} || (${vet} && role = 'veterinario' && ${unchanged(['role', 'email', 'verified', 'emailVisibility'])} && ${passwordUnchanged})`;
  app.save(users);
});
