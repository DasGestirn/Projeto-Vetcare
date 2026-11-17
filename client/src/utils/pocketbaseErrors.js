const FIELD_LABELS = {
  name: 'Nome', email: 'E-mail', role: 'Perfil', password: 'Senha', passwordConfirm: 'Confirmação de senha',
  tutor: 'Tutor', animal: 'Animal', veterinarian: 'Veterinário', date: 'Data', time: 'Horário',
  amountCents: 'Valor', phone: 'Telefone', title: 'Título', notes: 'Observações', instructions: 'Prescrição',
  nextDate: 'Próxima dose', birthDate: 'Data de nascimento', cpf: 'CPF', address: 'Endereço',
};

export function getErrorMessage(error, fallback = 'Não foi possível concluir a operação.') {
  if (error?.isAbort) return 'A solicitação foi cancelada. Tente novamente.';
  if (error?.status === 0) return 'Não foi possível conectar ao servidor. Verifique sua conexão e tente novamente.';
  if (error?.status === 401) return 'Sua sessão expirou. Entre novamente.';
  if (error?.status === 403) return 'Você não tem permissão para realizar esta operação.';
  if (error?.status === 404) return 'Registro não encontrado ou acesso não permitido. Atualize a página.';
  const fields = Object.entries(error?.response?.data || {});
  if (fields.length) {
    return fields.map(([field, detail]) => {
      const label = FIELD_LABELS[field] || field;
      if (detail.code === 'validation_not_unique') return `${label}: já existe um registro com este valor.`;
      if (detail.code === 'validation_values_mismatch') return 'As senhas não coincidem.';
      return `${label}: ${detail.message || 'valor inválido.'}`;
    }).join(' ');
  }
  return error?.status ? fallback : error?.message || fallback;
}
