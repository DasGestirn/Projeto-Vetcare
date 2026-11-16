import { useState } from 'react';
import { Alert, Button, Group, Modal, Stack, Text } from '@mantine/core';
import { useClinicMutation } from '../../hooks/useClinic';
import { clinicService } from '../../services/clinicService.js';
import { getErrorMessage } from '../../utils/pocketbaseErrors.js';

// REQ 04 — Exclusão de tutor. Tutores com animais vinculados não podem ser excluídos;
// o backend também recusa a exclusão quando houver pagamentos associados.
export function TutorDeleteModal({ tutor, onClose, onDeleted }) {
  const [error, setError] = useState(null);
  const mutation = useClinicMutation(clinicService.deleteTutor);
  const linkedAnimals = tutor.animalNames.length;

  const confirm = async () => {
    setError(null);
    try {
      await mutation.mutateAsync(tutor.id);
      onDeleted?.();
      onClose();
    } catch (failure) {
      setError(getErrorMessage(failure, 'Não foi possível excluir: o tutor possui animais ou pagamentos vinculados.'));
    }
  };

  return (
    <Modal opened onClose={() => { if (!mutation.isPending) onClose(); }} title="Excluir tutor" centered
      closeOnClickOutside={!mutation.isPending} closeOnEscape={!mutation.isPending} withCloseButton={!mutation.isPending}>
      <Stack gap="sm">
        {error && <Alert color="red" role="alert">{error}</Alert>}
        {linkedAnimals ? (
          <Text size="sm">
            <Text span fw={700}>{tutor.name}</Text> possui {linkedAnimals === 1 ? '1 animal vinculado' : `${linkedAnimals} animais vinculados`} ({tutor.animalNames.join(', ')}).
            Exclua os animais ou transfira-os para outro tutor antes de excluir este cadastro.
          </Text>
        ) : (
          <Text size="sm">
            Deseja excluir o tutor <Text span fw={700}>{tutor.name}</Text>? Esta ação não pode ser desfeita.
          </Text>
        )}
        <Group justify="flex-end" mt="md">
          <Button variant="default" disabled={mutation.isPending} onClick={onClose}>
            {linkedAnimals ? 'Fechar' : 'Cancelar'}
          </Button>
          {!linkedAnimals && <Button color="red" loading={mutation.isPending} onClick={confirm}>Excluir</Button>}
        </Group>
      </Stack>
    </Modal>
  );
}
