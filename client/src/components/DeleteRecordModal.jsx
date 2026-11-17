import { useState } from 'react';
import { Alert, Button, Group, Modal, Stack, Text } from '@mantine/core';
import { useClinicMutation } from '../hooks/useClinic';
import { getErrorMessage } from '../utils/pocketbaseErrors.js';

const noop = async () => {};

// Confirmação de exclusão dos cadastros (REQ 05 e REQ 06).
// O PocketBase recusa a exclusão de registros referenciados por relações obrigatórias, como um animal
// com consultas; nesse caso aparece `blockedMessage`. `alternative` oferece uma ação que preserva o
// histórico (por exemplo, inativar o animal) em vez de excluir.
export function DeleteRecordModal({ title, children, remove, deletedMessage, blockedMessage, alternative, onClose, onDone }) {
  const [error, setError] = useState(null);
  const removal = useClinicMutation(remove);
  const keep = useClinicMutation(alternative?.run ?? noop);
  const pending = removal.isPending || keep.isPending;

  const run = async (mutation, message) => {
    setError(null);
    try {
      await mutation.mutateAsync();
      onDone?.(message);
      onClose();
    } catch (failure) {
      setError(getErrorMessage(failure, blockedMessage));
    }
  };

  return (
    <Modal opened onClose={() => { if (!pending) onClose(); }} title={title} centered
      closeOnClickOutside={!pending} closeOnEscape={!pending} withCloseButton={!pending}>
      <Stack gap="sm">
        {error && <Alert color="red" role="alert">{error}</Alert>}
        <Text size="sm" component="div">{children}</Text>
        <Group justify="flex-end" mt="md">
          <Button variant="default" disabled={pending} onClick={onClose}>Cancelar</Button>
          {alternative && (
            <Button variant="light" disabled={removal.isPending} loading={keep.isPending} onClick={() => run(keep, alternative.doneMessage)}>
              {alternative.label}
            </Button>
          )}
          <Button color="red" disabled={keep.isPending} loading={removal.isPending} onClick={() => run(removal, deletedMessage)}>
            Excluir
          </Button>
        </Group>
      </Stack>
    </Modal>
  );
}
