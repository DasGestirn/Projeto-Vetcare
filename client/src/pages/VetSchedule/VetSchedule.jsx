import { Fragment, useState } from 'react';
import { Group, Button, Paper, Text, Badge, Modal, TextInput, Stack } from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { PageHeader } from '../../components/PageHeader/PageHeader';
import classes from './VetSchedule.module.css';

const vets = ['Dra. Ana Lima', 'Dr. Paulo Reis'];
const times = Array.from({ length: 9 }, (_, i) => `${String(i + 9).padStart(2, '0')}:00`);

const initialSchedule = {
  '2026-10-08': {
    '09:00-0': { text: 'Thor · Cão', sub: 'Marina Souza · Consulta' },
    '11:00-0': { text: 'Bidu · Cão', sub: 'Ana Prado · Retorno', canceled: true },
    '10:00-1': { text: 'Mel · Gata', sub: 'Carlos Lima · Vacinação' },
    '11:00-1': { text: 'Luna · Gata', sub: 'Rita Alves · Consulta' },
  },
};

const WEEKDAY_NAMES = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'];
const WEEKDAY_SHORT = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
const MONTH_NAMES = [
  'janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho',
  'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro',
];

function toKey(date) {
  return date.toISOString().slice(0, 10);
}

function addDays(date, amount) {
  const next = new Date(date);
  next.setDate(next.getDate() + amount);
  return next;
}

function addMonths(date, amount) {
  const next = new Date(date);
  next.setMonth(next.getMonth() + amount);
  return next;
}

function startOfWeek(date) {
  const day = date.getDay();
  const diff = day === 0 ? -6 : 1 - day; // semana começando na segunda-feira
  return addDays(date, diff);
}

function startOfMonth(date) {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

function capitalize(text) {
  return text.charAt(0).toUpperCase() + text.slice(1);
}

function formatDayLabel(date) {
  return `${WEEKDAY_NAMES[date.getDay()]}, ${String(date.getDate()).padStart(2, '0')} de ${MONTH_NAMES[date.getMonth()]}`;
}

function formatWeekLabel(date) {
  const start = startOfWeek(date);
  const end = addDays(start, 6);
  const startDay = String(start.getDate()).padStart(2, '0');
  const endDay = String(end.getDate()).padStart(2, '0');

  if (start.getMonth() === end.getMonth()) {
    return `${startDay}-${endDay} de ${capitalize(MONTH_NAMES[end.getMonth()])}`;
  }
  return `${startDay} de ${capitalize(MONTH_NAMES[start.getMonth()])} - ${endDay} de ${capitalize(MONTH_NAMES[end.getMonth()])}`;
}

function formatMonthLabel(date) {
  return `${capitalize(MONTH_NAMES[date.getMonth()])} ${date.getFullYear()}`;
}

function countAppointments(schedule, date) {
  const dayEntries = schedule[toKey(date)] || {};
  return Object.values(dayEntries).filter((entry) => !entry.canceled).length;
}

export function VetSchedule() {
  const [view, setView] = useState('Dia');
  const [currentDate, setCurrentDate] = useState(new Date(2026, 9, 8));
  const [schedule, setSchedule] = useState(initialSchedule);

  const [cancelOpened, { open: openCancel, close: closeCancel }] = useDisclosure(false);
  const [scheduleOpened, { open: openSchedule, close: closeSchedule }] = useDisclosure(false);
  const [cancelTarget, setCancelTarget] = useState(null);
  const [scheduleTarget, setScheduleTarget] = useState(null);
  const [scheduleForm, setScheduleForm] = useState({ animal: '', species: '', tutor: '', type: '' });

  const updateScheduleField = (field) => (event) => {
    const { value } = event.currentTarget;
    setScheduleForm((f) => ({ ...f, [field]: value }));
  };

  const goToDay = (date) => {
    setCurrentDate(date);
    setView('Dia');
  };

  const goPrevious = () => {
    if (view === 'Dia') setCurrentDate((d) => addDays(d, -1));
    else if (view === 'Semana') setCurrentDate((d) => addDays(d, -7));
    else setCurrentDate((d) => addMonths(d, -1));
  };

  const goNext = () => {
    if (view === 'Dia') setCurrentDate((d) => addDays(d, 1));
    else if (view === 'Semana') setCurrentDate((d) => addDays(d, 7));
    else setCurrentDate((d) => addMonths(d, 1));
  };

  const periodLabel = view === 'Dia'
    ? formatDayLabel(currentDate)
    : view === 'Semana'
      ? formatWeekLabel(currentDate)
      : formatMonthLabel(currentDate);

  const handleSlotClick = (date, time, vetIndex, appt) => {
    if (appt && !appt.canceled) {
      setCancelTarget({ date, time, vetIndex, appt });
      openCancel();
    } else {
      setScheduleTarget({ date, time, vetIndex });
      const [animal = '', species = ''] = (appt?.text || '').split(' · ');
      const [tutor = '', type = ''] = (appt?.sub || '').split(' · ');
      setScheduleForm({ animal, species, tutor, type });
      openSchedule();
    }
  };

  const confirmCancel = () => {
    const { date, time, vetIndex } = cancelTarget;
    const key = toKey(date);
    const slotKey = `${time}-${vetIndex}`;

    setSchedule((prev) => ({
      ...prev,
      [key]: {
        ...prev[key],
        [slotKey]: { ...prev[key][slotKey], canceled: true },
      },
    }));
    closeCancel();
  };

  const confirmSchedule = () => {
    const { date, time, vetIndex } = scheduleTarget;
    const key = toKey(date);
    const slotKey = `${time}-${vetIndex}`;
    const text = [scheduleForm.animal.trim(), scheduleForm.species.trim()].filter(Boolean).join(' · ');
    const sub = [scheduleForm.tutor.trim(), scheduleForm.type.trim()].filter(Boolean).join(' · ');

    setSchedule((prev) => ({
      ...prev,
      [key]: {
        ...prev[key],
        [slotKey]: { text, sub },
      },
    }));
    closeSchedule();
  };

  return (
    <>
      <PageHeader
        title="Agenda"
        actionLabel="Nova consulta"
        onAction={() => alert('Formulário de nova consulta (em breve).')}
      />

      <Group mb="md" gap="xs">
        <Button variant="default" onClick={goPrevious}>Anterior</Button>
        <Text fw={600} px="xs">{periodLabel}</Text>
        <Button variant="default" onClick={goNext}>Próximo</Button>
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
        {view === 'Dia' && (
          <DayView
            date={currentDate}
            dayAppointments={schedule[toKey(currentDate)] || {}}
            onSlotClick={handleSlotClick}
          />
        )}
        {view === 'Semana' && <WeekView date={currentDate} schedule={schedule} onSelectDay={goToDay} />}
        {view === 'Mês' && <MonthView date={currentDate} schedule={schedule} onSelectDay={goToDay} />}
      </Paper>

      <Modal opened={cancelOpened} onClose={closeCancel} title="Cancelar atendimento" centered>
        {cancelTarget && (
          <Stack>
            <Text size="sm">
              Tem certeza que deseja cancelar o atendimento de{' '}
              <strong>{cancelTarget.appt.text}</strong> ({cancelTarget.appt.sub}) às {cancelTarget.time} com{' '}
              {vets[cancelTarget.vetIndex]}?
            </Text>
            <Group justify="flex-end">
              <Button variant="default" onClick={closeCancel}>Manter atendimento</Button>
              <Button color="red" onClick={confirmCancel}>Cancelar atendimento</Button>
            </Group>
          </Stack>
        )}
      </Modal>

      <Modal opened={scheduleOpened} onClose={closeSchedule} title="Agendar atendimento" centered>
        {scheduleTarget && (
          <Stack>
            <Text size="sm" c="dimmed">
              {vets[scheduleTarget.vetIndex]} · {scheduleTarget.time} · {formatDayLabel(scheduleTarget.date)}
            </Text>
            <Group grow>
              <TextInput
                label="Animal"
                placeholder="Ex: Thor"
                value={scheduleForm.animal}
                onChange={updateScheduleField('animal')}
              />
              <TextInput
                label="Espécie"
                placeholder="Ex: Cão"
                value={scheduleForm.species}
                onChange={updateScheduleField('species')}
              />
            </Group>
            <Group grow>
              <TextInput
                label="Tutor"
                placeholder="Ex: Marina Souza"
                value={scheduleForm.tutor}
                onChange={updateScheduleField('tutor')}
              />
              <TextInput
                label="Tipo de atendimento"
                placeholder="Ex: Consulta"
                value={scheduleForm.type}
                onChange={updateScheduleField('type')}
              />
            </Group>
            <Group justify="flex-end">
              <Button variant="default" onClick={closeSchedule}>Cancelar</Button>
              <Button
                onClick={confirmSchedule}
                disabled={!scheduleForm.animal.trim() || !scheduleForm.tutor.trim()}
              >
                Agendar atendimento
              </Button>
            </Group>
          </Stack>
        )}
      </Modal>
    </>
  );
}

function DayView({ date, dayAppointments, onSlotClick }) {
  return (
    <div className={classes.calendar}>
      <div />
      {vets.map((vet) => <Text key={vet} fw={700}>{vet}</Text>)}

      {times.map((time) => (
        <Fragment key={time}>
          <Text fw={500} className={classes.time}>{time}</Text>
          {vets.map((vet, vetIndex) => {
            const appt = dayAppointments[`${time}-${vetIndex}`];
            const className = appt
              ? (appt.canceled ? classes.cancel : classes.appointment)
              : classes.free;

            return (
              <button
                key={vet}
                type="button"
                className={className}
                onClick={() => onSlotClick(date, time, vetIndex, appt)}
              >
                {appt ? (
                  <div>
                    <Text size="sm" fw={600}>{appt.text}</Text>
                    <Text size="xs">{appt.sub}</Text>
                    {appt.canceled && <Badge color="orange" size="xs" mt={4}>Cancelada</Badge>}
                  </div>
                ) : (
                  <Text size="sm" c="dimmed">Horário livre</Text>
                )}
              </button>
            );
          })}
        </Fragment>
      ))}
    </div>
  );
}

function WeekView({ date, schedule, onSelectDay }) {
  const start = startOfWeek(date);
  const days = Array.from({ length: 7 }, (_, i) => addDays(start, i));

  return (
    <div className={classes.weekGrid}>
      {days.map((day) => {
        const count = countAppointments(schedule, day);

        return (
          <button
            key={toKey(day)}
            type="button"
            className={classes.dayCard}
            onClick={() => onSelectDay(day)}
          >
            <Text size="xs" c="dimmed">{WEEKDAY_SHORT[day.getDay()]}</Text>
            <Text size="xl" fw={700}>{String(day.getDate()).padStart(2, '0')}</Text>
            <Text size="xs" c="dimmed">
              {count > 0 ? `${count} atendimento${count > 1 ? 's' : ''}` : 'Sem atendimentos'}
            </Text>
          </button>
        );
      })}
    </div>
  );
}

function MonthView({ date, schedule, onSelectDay }) {
  const gridStart = startOfWeek(startOfMonth(date));
  const weeks = Array.from({ length: 6 }, (_, week) =>
    Array.from({ length: 7 }, (_, day) => addDays(gridStart, week * 7 + day))
  );

  return (
    <div className={classes.monthGrid}>
      {weeks[0].map((day) => (
        <Text key={`header-${day.getDay()}`} size="xs" fw={700} c="dimmed" ta="center">
          {WEEKDAY_SHORT[day.getDay()]}
        </Text>
      ))}

      {weeks.flat().map((day) => {
        const inMonth = day.getMonth() === date.getMonth();
        const count = countAppointments(schedule, day);
        const dayClassName = inMonth
          ? classes.monthDay
          : `${classes.monthDay} ${classes.monthDayMuted}`;

        return (
          <button
            key={toKey(day)}
            type="button"
            className={dayClassName}
            onClick={() => onSelectDay(day)}
          >
            <Text size="sm" fw={600}>{day.getDate()}</Text>
            {count > 0 && <span className={classes.monthDayDot} />}
          </button>
        );
      })}
    </div>
  );
}
