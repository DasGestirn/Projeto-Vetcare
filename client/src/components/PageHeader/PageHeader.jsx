import { Group, Title, Button } from '@mantine/core';

export function PageHeader({ title, actionLabel, onAction, actionDisabled = false }) {
  return (
    <Group justify="space-between" mb="lg" wrap="wrap">
      <Title order={2}>{title}</Title>
      {actionLabel && (
        <Button onClick={onAction} disabled={actionDisabled}>
          {actionLabel}
        </Button>
      )}
    </Group>
  );
}
