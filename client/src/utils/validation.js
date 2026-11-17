import { onlyDigits } from './format.js';

// Mesmas regras aplicadas no backend (server/pb_hooks/lib/validateTutor.js).
export function isValidCpf(value) {
  const cpf = onlyDigits(value);
  if (!/^\d{11}$/.test(cpf) || /^(\d)\1{10}$/.test(cpf)) return false;
  for (const length of [9, 10]) {
    let sum = 0;
    for (let i = 0; i < length; i++) sum += Number(cpf[i]) * (length + 1 - i);
    if ((sum * 10) % 11 % 10 !== Number(cpf[length])) return false;
  }
  return true;
}

// DDD (dois dígitos de 1 a 9) + celular com nono dígito ou fixo de 8 dígitos.
export const isValidPhone = (value) => /^[1-9]{2}(9\d{8}|[2-8]\d{7})$/.test(onlyDigits(value));

const UFS = ['AC', 'AL', 'AM', 'AP', 'BA', 'CE', 'DF', 'ES', 'GO', 'MA', 'MG', 'MS', 'MT', 'PA', 'PB', 'PE',
  'PI', 'PR', 'RJ', 'RN', 'RO', 'RR', 'RS', 'SC', 'SE', 'SP', 'TO'];

// REQ 06 — Mesmas regras de server/pb_hooks/lib/validateVeterinarian.js.
// Aceita "CRMV-BA 1234", "BA 1234", "1234/BA" e variações; o formato gravado é "CRMV-BA 1234".
export function normalizeCrmv(value) {
  const text = String(value ?? '').trim().toUpperCase();
  const letters = text.replace(/CRMV/g, '').replace(/[^A-Z]/g, '');
  const number = text.replace(/\D/g, '').replace(/^0+/, '');
  return letters.length === 2 && number ? `CRMV-${letters} ${number}` : text;
}

export function isValidCrmv(value) {
  const match = /^CRMV-([A-Z]{2}) [1-9]\d{0,5}$/.exec(normalizeCrmv(value));
  return Boolean(match) && UFS.includes(match[1]);
}
