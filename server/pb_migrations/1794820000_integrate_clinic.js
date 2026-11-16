/// <reference path="../pb_data/types.d.ts" />

// Migração aditiva: preserva registros existentes e não importa os mocks da interface.
migrate((app) => {
  const admin = "@request.auth.role = 'administracao'";
  const vet = "@request.auth.role = 'veterinario'";
  const staff = "(@request.auth.role = 'administracao' || @request.auth.role = 'recepcao')";
  const clinicalReaders = `(${admin} || ${vet})`;
  const authenticated = `(${admin} || ${vet} || @request.auth.role = 'recepcao')`;
  const users = app.findCollectionByNameOrId('users');

  const role = users.fields.getByName('role');
  role.pattern = '^(administracao|recepcao|veterinario)$';
  role.required = true;
  users.fields.add(role);
  users.fields.add(new TextField({ name: 'phone', max: 40 }));
  users.fields.add(new TextField({ name: 'specialty', max: 120 }));
  users.listRule = `${authenticated} && (${admin} || id = @request.auth.id || role = 'veterinario')`;
  users.viewRule = users.listRule;
  users.createRule = admin;
  users.deleteRule = `${admin} && id != @request.auth.id`;
  users.manageRule = admin;
  const protectedFields = ['role', 'email', 'verified', 'emailVisibility'];
  users.updateRule = `${admin} || (${vet} && role = 'veterinario' && ${protectedFields.map((field) => `@request.body.${field}:changed = false`).join(' && ')} && @request.body.password:isset = false && @request.body.passwordConfirm:isset = false)`;
  app.save(users);

  // O seed histórico foi executado antes da criação de role. Corrige apenas perfis vazios.
  const initialRoles = {
    'vet.emily@vetcare.com': 'veterinario',
    'rec.priscila@vetcare.com': 'recepcao',
    'adm.lucio@vetcare.com': 'administracao',
  };
  for (const email in initialRoles) {
    const records = app.findRecordsByFilter('users', 'email = {:email} && role = ""', '', 0, 0, { email });
    for (const record of records) {
      record.set('role', initialRoles[email]);
      app.save(record);
    }
  }

  const text = (name, required = false, max = 200) => ({ type: 'text', name, required, max });
  const day = (name, required = true) => ({ ...text(name, required, 10), pattern: '^\\d{4}-\\d{2}-\\d{2}$' });
  const relation = (name, collection, required = true) => ({
    type: 'relation', name, required, collectionId: collection.id, maxSelect: 1, cascadeDelete: false,
  });
  function create(name, fields, rules, indexes = []) {
    const collection = new Collection({
      type: 'base', name,
      fields: [...fields,
        { type: 'autodate', name: 'created', onCreate: true },
        { type: 'autodate', name: 'updated', onCreate: true, onUpdate: true },
      ],
      ...rules, indexes,
    });
    app.save(collection);
    return collection;
  }
  const masterRules = {
    listRule: authenticated, viewRule: authenticated, createRule: authenticated,
    updateRule: authenticated, deleteRule: staff,
  };
  const tutors = create('tutors', [text('name', true), text('phone', false, 40)], masterRules);
  const animals = create('animals', [
    text('name', true), text('species', true, 80), text('breed'), day('birthDate', false),
    relation('tutor', tutors), { type: 'bool', name: 'active' },
  ], masterRules, ['CREATE INDEX idx_animals_tutor ON animals (tutor)']);

  const appointmentsFields = [
    relation('animal', animals), relation('veterinarian', users), day('date'),
    { ...text('time', true, 5), pattern: '^(09|1[0-7]):00$' }, text('type', true, 120),
    { type: 'select', name: 'status', required: true, maxSelect: 1, values: ['Agendada', 'Cancelada'] },
  ];
  create('appointments', appointmentsFields, {
    listRule: authenticated, viewRule: authenticated,
    createRule: `${authenticated} && veterinarian.role = 'veterinario'`,
    updateRule: `${authenticated} && @request.body.status = 'Cancelada' && ${['animal', 'veterinarian', 'date', 'time', 'type'].map((field) => `@request.body.${field}:changed = false`).join(' && ')}`,
    deleteRule: null,
  }, [
    "CREATE UNIQUE INDEX idx_appointments_slot ON appointments (veterinarian, date, time) WHERE status != 'Cancelada'",
    'CREATE INDEX idx_appointments_date ON appointments (date)',
  ]);

  const clinicalRules = {
    listRule: clinicalReaders, viewRule: clinicalReaders,
    createRule: `${vet} && @request.body.veterinarian = @request.auth.id`,
    updateRule: `${vet} && @request.body.veterinarian:changed = false && @request.body.animal:changed = false`,
    deleteRule: null,
  };
  const authorFields = [relation('animal', animals), relation('veterinarian', users), day('date')];
  create('medical_records', [...authorFields, text('title', true), text('notes', true, 10000)], clinicalRules,
    ['CREATE INDEX idx_medical_records_animal_date ON medical_records (animal, date)']);
  create('vaccinations', [...authorFields, text('name', true), day('nextDate', false)],
    { ...clinicalRules, listRule: authenticated, viewRule: authenticated });
  create('prescriptions', [...authorFields, text('title', true), text('instructions', true, 10000), { type: 'bool', name: 'active' }],
    { ...clinicalRules, listRule: authenticated, viewRule: authenticated });
  create('payments', [
    relation('tutor', tutors), day('date'),
    { type: 'number', name: 'amountCents', required: true, onlyInt: true, min: 1, max: 100000000000 },
    { type: 'select', name: 'status', required: true, maxSelect: 1, values: ['Pago', 'Pendente'] },
  ], { listRule: staff, viewRule: staff, createRule: staff, updateRule: staff, deleteRule: staff },
  ['CREATE INDEX idx_payments_date ON payments (date)']);
});
