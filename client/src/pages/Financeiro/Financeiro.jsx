import { useState } from 'react';
import { useNavigate } from 'react-router';
import { Group, Button, SimpleGrid, Paper, Text, Badge, Stack } from '@mantine/core';
import { PageHeader } from '../../components/PageHeader/PageHeader';
import { QueryState } from '../../components/QueryState';
import { useClinicQuery } from '../../hooks/useClinic';
import { clinicService } from '../../services/clinicService.js';
import { dateKey, financialSummary, formatDate, formatMoney } from '../../utils/format.js';
import classes from './Financeiro.module.css';

function csvCell(value) {
  const text = String(value);
  const safe = /^[=+@-]/.test(text) ? "'" + text : text;
  return '"' + safe.replaceAll('"', '""') + '"';
}

export function Financeiro() {
  const [month, setMonth] = useState(() => new Date(new Date().getFullYear(), new Date().getMonth(), 1));
  const navigate = useNavigate();
  const paymentsQuery = useClinicQuery(['payments'], clinicService.payments);
  const visitsQuery = useClinicQuery(['visits'], clinicService.visits);
  const summary = financialSummary(paymentsQuery.data || [], visitsQuery.data || [], month);
  const loading = paymentsQuery.isPending || visitsQuery.isPending;
  const failed = paymentsQuery.isError || visitsQuery.isError;
  const metrics = [
    { label: 'Receita do mês', value: formatMoney(summary.revenue) },
    { label: 'Pagamentos pendentes', value: formatMoney(summary.pending) },
    { label: 'Consultas realizadas no mês', value: summary.visits },
  ];
  const maxRevenue = Math.max(...summary.weeks, 1);
  const moveMonth = (offset) => setMonth((current) => new Date(current.getFullYear(), current.getMonth() + offset, 1));
  const report = () => {
    const rows = [
      ['Relatório financeiro', month.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })],
      ...metrics.map(({ label, value }) => [label, value]), [],
      ['Data', 'Tutor', 'Valor (R$)', 'Status'],
      ...summary.payments.map((payment) => [formatDate(payment.date), payment.expand?.tutor?.name || '', (payment.amountCents / 100).toFixed(2).replace('.', ','), payment.status]),
    ];
    const csv = rows.map((row) => row.map(csvCell).join(';')).join('\r\n');
    const url = URL.createObjectURL(new Blob(['\uFEFF', csv], { type: 'text/csv;charset=utf-8;' }));
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = `financeiro-${dateKey(month).slice(0, 7)}.csv`;
    anchor.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  };
  return (
    <>
      <PageHeader title="Dashboard financeiro" actionLabel="Gerar relatório" onAction={report} actionDisabled={loading || failed} />
      <Group mb="md">
        <Button variant="default" onClick={() => moveMonth(-1)}>Anterior</Button>
        <Text fw={600} px="xs">{month.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })}</Text>
        <Button variant="default" onClick={() => moveMonth(1)}>Próximo</Button>
      </Group>
      <QueryState query={paymentsQuery} />
      <QueryState query={visitsQuery} />
      <SimpleGrid cols={{ base: 1, sm: 3 }} mb="md">
        {metrics.map((metric) => <Paper key={metric.label} withBorder p="lg">
          <Text size="sm" c="dimmed">{metric.label}</Text>
          <Text size="xl" fw={700} mt={6}>{loading || failed ? '—' : metric.value}</Text>
        </Paper>)}
      </SimpleGrid>
      <SimpleGrid cols={{ base: 1, md: 2 }} spacing="md">
        <Paper withBorder p="lg">
          <Text fw={700} mb="md">Receita por semana</Text>
          {!loading && !failed && summary.revenue === 0 && <Text size="sm" c="dimmed">Nenhuma receita no período.</Text>}
          <div className={classes.bars}>
            {summary.weeks.map((revenue, index) => <div key={index} className={classes.barColumn}>
              <div className={classes.bar} style={{ height: loading || failed ? 0 : revenue / maxRevenue * 170 }} title={formatMoney(revenue)} />
              <Text size="xs" c="dimmed">Sem {index + 1}</Text>
            </div>)}
          </div>
        </Paper>
        <Paper withBorder p="lg">
          <Text fw={700} mb="md">Pagamentos recentes</Text>
          <Stack gap={0} mb="md">
            {!loading && !failed && summary.payments.length === 0 && <Text size="sm" c="dimmed">Nenhum pagamento no período.</Text>}
            {!loading && !failed && summary.payments.slice(0, 3).map((payment) => <Group key={payment.id} justify="space-between" py={10} className={classes.paymentRow}>
              <Text size="sm">{payment.expand?.tutor?.name || '—'}</Text>
              <Group gap="xs">
                <Text size="sm">{formatMoney(payment.amountCents)}</Text>
                <Badge color={payment.status === 'Pago' ? 'brand' : 'orange'} variant="light">{payment.status}</Badge>
              </Group>
            </Group>)}
          </Stack>
          <Button fullWidth onClick={() => navigate('/registros?tab=pagamentos')}>Ver todos os pagamentos</Button>
        </Paper>
      </SimpleGrid>
    </>
  );
}
