import { Alert, Button, Center, Loader, Text } from '@mantine/core';
import { getErrorMessage } from '../utils/pocketbaseErrors.js';

export function QueryState({ query, empty, emptyMessage = 'Nenhum registro encontrado.' }) {
  if (query.isPending) return <Center py="xl"><Loader /></Center>;
  if (query.isError) return (
    <Alert color="red" mb="md" role="alert">
      {getErrorMessage(query.error, 'Não foi possível carregar os dados.')}
      <Button size="xs" variant="subtle" onClick={() => query.refetch()} ml="sm">Tentar novamente</Button>
    </Alert>
  );
  if (empty) return <Text c="dimmed" ta="center" py="md">{emptyMessage}</Text>;
  return null;
}
