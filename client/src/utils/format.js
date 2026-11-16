export function dateKey(date = new Date()) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

export const formatDate = (value) => value ? value.slice(0, 10).split('-').reverse().join('/') : '—';
export const formatMoney = (cents = 0) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(cents / 100);

export function animalAge(birthDate) {
  if (!birthDate) return '—';
  const birth = new Date(`${birthDate.slice(0, 10)}T12:00:00`);
  const now = new Date();
  let months = (now.getFullYear() - birth.getFullYear()) * 12 + now.getMonth() - birth.getMonth();
  if (now.getDate() < birth.getDate()) months--;
  if (months < 12) return `${Math.max(0, months)} meses`;
  const years = Math.floor(months / 12);
  return `${years} ${years === 1 ? 'ano' : 'anos'}`;
}

export function monthBounds(date) {
  return {
    start: dateKey(new Date(date.getFullYear(), date.getMonth(), 1)),
    end: dateKey(new Date(date.getFullYear(), date.getMonth() + 1, 1)),
  };
}

export function financialSummary(payments, visits, date) {
  const { start, end } = monthBounds(date);
  const inMonth = (row) => row.date >= start && row.date < end;
  const monthly = payments.filter(inMonth);
  const revenue = monthly.filter((p) => p.status === 'Pago').reduce((sum, p) => sum + p.amountCents, 0);
  const pending = monthly.filter((p) => p.status === 'Pendente').reduce((sum, p) => sum + p.amountCents, 0);
  const weeks = Array.from({ length: Math.ceil(new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate() / 7) }, () => 0);
  for (const payment of monthly.filter((p) => p.status === 'Pago')) weeks[Math.floor((Number(payment.date.slice(8, 10)) - 1) / 7)] += payment.amountCents;
  return { revenue, pending, visits: visits.filter(inMonth).length, weeks, payments: monthly };
}

export const onlyDigits = (value) => String(value ?? '').replace(/\D/g, '');

// Máscaras progressivas: aceitam valores parciais durante a digitação.
export function formatCpf(value) {
  const d = onlyDigits(value).slice(0, 11);
  if (d.length <= 3) return d;
  if (d.length <= 6) return `${d.slice(0, 3)}.${d.slice(3)}`;
  if (d.length <= 9) return `${d.slice(0, 3)}.${d.slice(3, 6)}.${d.slice(6)}`;
  return `${d.slice(0, 3)}.${d.slice(3, 6)}.${d.slice(6, 9)}-${d.slice(9)}`;
}

export function formatPhone(value) {
  const d = onlyDigits(value).slice(0, 11);
  if (d.length <= 2) return d && `(${d}`;
  const local = d.slice(2);
  const split = d.length === 11 ? 5 : 4;
  if (local.length <= split) return `(${d.slice(0, 2)}) ${local}`;
  return `(${d.slice(0, 2)}) ${local.slice(0, split)}-${local.slice(split)}`;
}
