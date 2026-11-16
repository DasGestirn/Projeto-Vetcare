import { useRef, useState } from 'react';
import { Alert, Button, Checkbox, Group, Modal, Select, Stack, Textarea, TextInput } from '@mantine/core';
import { useClinicMutation } from '../hooks/useClinic';
import { getErrorMessage } from '../utils/pocketbaseErrors.js';

// Campos e layout Mantine compartilhados pelos formulários já previstos nas telas.
// Opcionais por campo: `format(valor)` aplica máscara durante a digitação e
// `validate(valor, valores)` devolve a mensagem de erro exibida no próprio campo.
export function RecordForm({ opened, onClose, title, fields, initialValues, save, onSaved }) {
  const [values, setValues] = useState(initialValues);
  const [error, setError] = useState(null);
  const [fieldErrors, setFieldErrors] = useState({});
  const lock = useRef(false);
  const mutation = useClinicMutation(save);
  const submit = async (event) => {
    event.preventDefault();
    if (lock.current) return;
    const invalid = Object.fromEntries(fields.flatMap(({ name, validate }) => {
      const message = validate?.(values[name], values);
      return message ? [[name, message]] : [];
    }));
    setFieldErrors(invalid);
    if (Object.keys(invalid).length) return;
    lock.current = true;
    setError(null);
    try {
      const record = await mutation.mutateAsync(values);
      onSaved?.(record);
      onClose();
    } catch (failure) {
      setError(getErrorMessage(failure));
    } finally {
      lock.current = false;
    }
  };
  return (
    <Modal opened={opened} onClose={() => { if (!lock.current) onClose(); }} title={title} centered
      closeOnClickOutside={!mutation.isPending} closeOnEscape={!mutation.isPending} withCloseButton={!mutation.isPending}>
      <form onSubmit={submit}>
        <Stack gap="sm">
          {error && <Alert color="red" role="alert">{error}</Alert>}
          {fields.map(({ name, type, onValueChange, format, validate, ...field }) => {
            const value = values[name];
            const set = (raw) => {
              const next = format ? format(raw) : raw;
              setFieldErrors(({ [name]: _cleared, ...rest }) => rest);
              setValues((current) => ({ ...current, ...onValueChange?.(next), [name]: next }));
            };
            const common = { ...field, error: fieldErrors[name], disabled: mutation.isPending };
            if (type === 'checkbox') return <Checkbox key={name} {...common} checked={Boolean(value)} onChange={(event) => set(event.currentTarget.checked)} />;
            if (type === 'select') return <Select key={name} {...common} searchable allowDeselect={!field.required} value={value || null} onChange={set} />;
            const Input = type === 'textarea' ? Textarea : TextInput;
            return <Input key={name} {...common} type={type === 'textarea' ? undefined : type || 'text'} value={value ?? ''} onChange={(event) => set(event.currentTarget.value)} />;
          })}
          <Group justify="flex-end" mt="md">
            <Button variant="default" disabled={mutation.isPending} onClick={onClose}>Cancelar</Button>
            <Button type="submit" loading={mutation.isPending}>Salvar</Button>
          </Group>
        </Stack>
      </form>
    </Modal>
  );
}
