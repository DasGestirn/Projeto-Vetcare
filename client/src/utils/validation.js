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
