function validate(record) {
  for (const field of ['date', 'birthDate', 'nextDate']) {
    const value = record.getString(field);
    if (!value) continue;
    const parsed = new Date(`${value}T00:00:00Z`);
    if (!/^\d{4}-\d{2}-\d{2}$/.test(value) || Number.isNaN(parsed.getTime()) || parsed.toISOString().slice(0, 10) !== value) {
      throw new BadRequestError('Data inválida.', { [field]: new ValidationError('invalid_date', 'Informe uma data válida.') });
    }
  }
  if (record.getString('nextDate') && record.getString('nextDate') < record.getString('date')) {
    throw new BadRequestError('Data inválida.', { nextDate: new ValidationError('invalid_date', 'A próxima dose deve ser posterior ou igual à aplicação.') });
  }
}

module.exports = { validate };
