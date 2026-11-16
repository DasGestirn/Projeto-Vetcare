import { Fragment, useState } from 'react';
import { Group, Button, Paper, Text, Badge } from '@mantine/core';
import { PageHeader } from '../../components/PageHeader/PageHeader';
import classes from './VetSchedule.module.css';

const vets = ['Dra. Ana Lima', 'Dr. Paulo Reis'];
const times = ['09:00', '10:00', '11:00', '14:00'];
const appointments = {
  '09:00-0': { text: 'Thor · Cão', sub: 'Marina Souza · Consulta' },
  '11:00-0': { text: 'Bidu · Cão', sub: 'Ana Prado · Retorno', canceled: true },
  '10:00-1': { text: 'Mel · Gata', sub: 'Carlos Lima · Vacinação' },
  '11:00-1': { text: 'Luna · Gata', sub: 'Rita Alves · Consulta' },
};

export function VetSchedule() {
  const [view, setView] = useState('Dia');
  const [date, setDate] = useState(8);

  return (
    <>
      <PageHeader
        title="Agenda"
        actionLabel="Nova consulta"
        onAction={() => alert('Formulário de nova consulta (em breve).')}
      />

      <Group mb="md" gap="xs">
        <Button variant="default" onClick={() => setDate((d) => d - 1)}>Anterior</Button>
        <Text fw={600} px="xs">Quinta, {String(date).padStart(2, '0')} de outubro</Text>
        <Button variant="default" onClick={() => setDate((d) => d + 1)}>Próximo</Button>
        <div className={classes.grow} />
        {['Dia', 'Semana', 'Mês'].map((v) => (
          <Button
            key={v}
            variant={view === v ? 'filled' : 'default'}
            onClick={() => setView(v)}
          >
            {v}
          </Button>
        ))}
      </Group>

      <Paper withBorder p="lg">
        <div className={classes.calendar}>
          <div />
          {vets.map((vet) => <Text key={vet} fw={700}>{vet}</Text>)}

          {times.map((time) => (
            <Fragment key={time}>
              <Text fw={500} className={classes.time}>{time}</Text>
              {vets.map((vet, vetIndex) => {
                const appt = appointments[`${time}-${vetIndex}`];
                const className = appt
                  ? (appt.canceled ? classes.cancel : classes.appointment)
                  : classes.free;

                return (
                  <div key={vet} className={className}>
                    {appt ? (
                      <div>
                        <Text size="sm" fw={600}>{appt.text}</Text>
                        <Text size="xs">{appt.sub}</Text>
                        {appt.canceled && <Badge color="orange" size="xs" mt={4}>Cancelada</Badge>}
                      </div>
                    ) : (
                      <Text size="sm" c="dimmed">Horário livre</Text>
                    )}
                  </div>
                );
              })}
            </Fragment>
          ))}
        </div>
      </Paper>
    </>
  );
}
