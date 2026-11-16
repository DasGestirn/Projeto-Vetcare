import { useRouteError } from 'react-router';
import { Alert, Button, Center, Stack } from '@mantine/core';
import { getErrorMessage } from '../utils/pocketbaseErrors.js';

export function RouteError() {
  const error = useRouteError();
  return (
    <Center mih="100vh" p="xl">
      <Stack>
        <Alert color="red" title="Não foi possível abrir a página">
          {getErrorMessage(error, 'Tente novamente em instantes.')}
        </Alert>
        <Button onClick={() => window.location.reload()}>Tentar novamente</Button>
      </Stack>
    </Center>
  );
}
