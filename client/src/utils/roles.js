export const ROLE_OPTIONS = [
  { value: 'administracao', label: 'Administrador' },
  { value: 'recepcao', label: 'Recepcionista' },
  { value: 'veterinario', label: 'Médico veterinário' },
];

export const ROLE_LABELS = Object.fromEntries(ROLE_OPTIONS.map(({ value, label }) => [value, label]));
export const isKnownRole = (role) => ROLE_OPTIONS.some(({ value }) => value === role);
export const getRoleHomePath = (role) => role === 'administracao' ? '/financeiro' : '/agenda';
