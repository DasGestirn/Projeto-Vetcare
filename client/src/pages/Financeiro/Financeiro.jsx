import { useState } from 'react';
import { Group, Button, SimpleGrid, Paper, Text, Badge, Stack } from '@mantine/core';
import { PageHeader } from '../../components/PageHeader/PageHeader';
import classes from './Financeiro.module.css';

const metrics = [
  { label: 'Receita do mês', value: 'R$ 18.450' },
  { label: 'Pagamentos pendentes', value: 'R$ 2.130' },
  { label: 'Consultas realizadas no mês', value: '112' },
];

const weeklyRevenue = [90, 140, 110, 170];

const payments = [
  { name: 'Marina Souza', amount: '180', status: 'Pago' },
  { name: 'Carlos Lima', amount: '95', status: 'Pendente' },
  { name: 'Rita Alves', amount: '240', status: 'Pago' },
];

export function Financeiro() {
  const months = ['Agosto', 'Setembro', 'Outubro'];
  const [monthIndex, setMonthIndex] = useState(2);

  return (
    <>
      <PageHeader
        title="Dashboard financeiro"
        actionLabel="Gerar relatório"
        onAction={() => alert('Relatório gerado (em breve).')}
      />

      <Group mb="md">
        <Button
          variant="default"
          onClick={() => setMonthIndex((i) => Math.max(0, i - 1))}
        >
          Anterior
        </Button>
        <Text fw={600} px="xs">{months[monthIndex]} 2026</Text>
        <Button
          variant="default"
          onClick={() => setMonthIndex((i) => Math.min(months.length - 1, i + 1))}
        >
          Próximo
        </Button>
      </Group>

      <SimpleGrid cols={{ base: 1, sm: 3 }} mb="md">
        {metrics.map((metric) => (
          <Paper key={metric.label} withBorder p="lg">
            <Text size="sm" c="dimmed">{metric.label}</Text>
            <Text size="xl" fw={700} mt={6}>{metric.value}</Text>
          </Paper>
        ))}
      </SimpleGrid>

      <SimpleGrid cols={{ base: 1, md: 2 }} spacing="md">
        <Paper withBorder p="lg">
          <Text fw={700} mb="md">Receita por semana</Text>
          <div className={classes.bars}>
            {weeklyRevenue.map((height, index) => (
              <div key={index} className={classes.barColumn}>
                <div className={classes.bar} style={{ height }} />
                <Text size="xs" c="dimmed">Sem {index + 1}</Text>
              </div>
            ))}
          </div>
        </Paper>

        <Paper withBorder p="lg">
          <Text fw={700} mb="md">Pagamentos recentes</Text>
          <Stack gap={0} mb="md">
            {payments.map((payment) => (
              <Group key={payment.name} justify="space-between" py={10} className={classes.paymentRow}>
                <Text size="sm">{payment.name}</Text>
                <Group gap="xs">
                  <Text size="sm">R$ {payment.amount}</Text>
                  <Badge color={payment.status === 'Pago' ? 'brand' : 'orange'} variant="light">
                    {payment.status}
                  </Badge>
                </Group>
              </Group>
            ))}
          </Stack>
          <Button fullWidth>Ver todos os pagamentos</Button>
        </Paper>
      </SimpleGrid>
    </>
  );
}
