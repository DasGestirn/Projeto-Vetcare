/// <reference path="../pb_data/types.d.ts" />

// REQ 05 — Manter Animal.
// O documento de requisitos pede nome, espécie, raça, sexo e data de nascimento; a coleção `animals`
// (criada em 1794820000_integrate_clinic.js) ainda não tinha o sexo. A migração é aditiva: animais
// já cadastrados são preservados e passam a exigir o sexo na próxima edição.
// As regras de acesso não mudam: os três perfis consultam, cadastram e alteram; apenas
// administração e recepção excluem (docs/RBAC.md).
migrate((app) => {
  const animals = app.findCollectionByNameOrId('animals');
  animals.fields.add(new SelectField({ name: 'sex', required: true, maxSelect: 1, values: ['Macho', 'Fêmea'] }));
  app.save(animals);
}, (app) => {
  const animals = app.findCollectionByNameOrId('animals');
  animals.fields.removeByName('sex');
  app.save(animals);
});
