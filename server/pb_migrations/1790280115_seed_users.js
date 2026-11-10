/// <reference path="../pb_data/types.d.ts" />

migrate((app) => {

  const usersCollection = app.findCollectionByNameOrId("users");

  // Usuário 1: Veterinária Emily

  const user1 = new Record(usersCollection, {
    username: "vet_emily",
    role: "veterinario",
    email: "vet.emily@vetcare.com",
    emailVisibility: true,
    name: "Dra. Emily",
    verified: true,
  });
  user1.setPassword("emily123456");
  user1.set("passwordConfirm", "emily123456");

  // Usuário 2: Recepcionista Priscila

  const user2 = new Record(usersCollection, {
    username: "rec_priscila",
    role: "recepcao",
    email: "rec.priscila@vetcare.com",
    emailVisibility: true,
    name: "Priscila",
    verified: true,
  });
  user2.setPassword("priscila123456");
  user2.set("passwordConfirm", "priscila123456");

  // Usuário 3: Administrador Lúcio

  const user3 = new Record(usersCollection, {
    username: "adm_lucio",
    role: "administracao",
    email: "adm.lucio@vetcare.com",
    emailVisibility: true,
    name: "Lúcio",
    verified: true,
  });
  user3.setPassword("lucio123456");
  user3.set("passwordConfirm", "lucio123456");


  app.save(user1);
  app.save(user2);
  app.save(user3);
}, (app) => { // Operação de reversão opcional (down-migration)
  try {

    const record1 = app.findAuthRecordByEmail("users", "vet.emily@vetcare.com");
    app.delete(record1);
    const record2 = app.findAuthRecordByEmail("users", "rec.priscila@vetcare.com");
    app.delete(record2);
    const record3 = app.findAuthRecordByEmail("users", "adm.lucio@vetcare.com");
    app.delete(record3);

  } catch (_) {
  }
})
