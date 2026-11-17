/// <reference path="../pb_data/types.d.ts" />

// REQ 04 — Manter Tutor.
// Completa a coleção `tutors` (criada em 1794820000_integrate_clinic.js) com os dados cadastrais
// do responsável pelo animal. CPF e telefone são armazenados somente com dígitos; a normalização,
// os dígitos verificadores do CPF e a unicidade são verificados em pb_hooks/lib/validateTutor.js.
// As regras de acesso não mudam: os três perfis consultam, cadastram e alteram; apenas
// administração e recepção excluem (docs/RBAC.md). A exclusão é bloqueada pelo PocketBase
// enquanto houver animais ou pagamentos vinculados (relações obrigatórias sem cascata).
migrate((app) => {
  const tutors = app.findCollectionByNameOrId('tutors');

  // Migração aditiva: registros já existentes são preservados e apenas têm o telefone normalizado.
  // A normalização ocorre antes da mudança de esquema para não exigir CPF dos registros antigos.
  for (const record of app.findAllRecords('tutors')) {
    const digits = record.getString('phone').replace(/\D/g, '');
    if (digits !== record.getString('phone')) {
      record.set('phone', digits);
      app.saveNoValidate(record);
    }
  }

  tutors.fields.add(new TextField({ name: 'cpf', required: true, min: 11, max: 11, pattern: '^\\d{11}$' }));
  tutors.fields.add(new EmailField({ name: 'email' }));
  tutors.fields.add(new TextField({ name: 'address', max: 300 }));

  const phone = tutors.fields.getByName('phone');
  phone.required = true;
  phone.min = 10;
  phone.max = 11;
  phone.pattern = '^\\d{10,11}$';
  tutors.fields.add(phone);

  // Índice parcial: tutores antigos ainda sem CPF não colidem entre si.
  tutors.addIndex('idx_tutors_cpf', true, 'cpf', "cpf != ''");
  app.save(tutors);
}, (app) => {
  const tutors = app.findCollectionByNameOrId('tutors');
  tutors.removeIndex('idx_tutors_cpf');
  for (const name of ['cpf', 'email', 'address']) tutors.fields.removeByName(name);

  const phone = tutors.fields.getByName('phone');
  phone.required = false;
  phone.min = 0;
  phone.max = 40;
  phone.pattern = '';
  tutors.fields.add(phone);
  app.save(tutors);
});
