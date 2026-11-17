import { useRef, useState } from 'react';
import { Alert, Button, Checkbox, Group, Modal, Select, Stack, Textarea, TextInput } from '@mantine/core';
import { useClinicMutation } from '../hooks/useClinic';
import { getErrorMessage } from '../utils/pocketbaseErrors.js';

// Campos e layout Mantine compartilhados pelos formulários já previstos nas telas.
export function RecordForm({ opened, onClose, title, fields, initialValues, save, onSaved }) {
  const [values, setValues] = useState(initialValues);
  const [error, setError] = useState(null);
  const lock = useRef(false);
  const mutation = useClinicMutation(save);
  const submit = async (event) => {
    event.preventDefault();
    if (lock.current) return;
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
          {fields.map(({ name, type, onValueChange, ...field }) => {
            const value = values[name];
            const set = (next) => setValues((current) => ({ ...current, ...onValueChange?.(next), [name]: next }));
            if (type === 'checkbox') return <Checkbox key={name} {...field} checked={Boolean(value)} onChange={(event) => set(event.currentTarget.checked)} disabled={mutation.isPending} />;
            if (type === 'select') return <Select key={name} {...field} searchable allowDeselect={!field.required} value={value || null} onChange={set} disabled={mutation.isPending} />;
            const Input = type === 'textarea' ? Textarea : TextInput;
            return <Input key={name} {...field} type={type || 'text'} value={value ?? ''} onChange={(event) => set(event.currentTarget.value)} disabled={mutation.isPending} />;
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
