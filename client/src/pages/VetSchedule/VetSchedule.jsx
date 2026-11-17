import { Fragment, useMemo, useRef, useState } from 'react';
import { Alert, Group, Button, Paper, Text, Badge, Modal, TextInput, Select, Stack } from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { PageHeader } from '../../components/PageHeader/PageHeader';
import { QueryState } from '../../components/QueryState';
import { useClinicQuery, useClinicMutation } from '../../hooks/useClinic';
import { clinicService } from '../../services/clinicService.js';
import { dateKey } from '../../utils/format.js';
import { getErrorMessage } from '../../utils/pocketbaseErrors.js';
import classes from './VetSchedule.module.css';

const times = Array.from({ length: 9 }, (_, i) => `${String(i + 9).padStart(2, '0')}:00`);

const WEEKDAY_NAMES = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'];
const WEEKDAY_SHORT = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
const MONTH_NAMES = [
  'janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho',
  'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro',
];

function toKey(date) {
  return dateKey(date);
}

function addDays(date, amount) {
  const next = new Date(date);
  next.setDate(next.getDate() + amount);
  return next;
}

function addMonths(date, amount) {
  const month = new Date(date.getFullYear(), date.getMonth() + amount, 1);
  const lastDay = new Date(month.getFullYear(), month.getMonth() + 1, 0).getDate();
  return new Date(month.getFullYear(), month.getMonth(), Math.min(date.getDate(), lastDay));
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
  const [currentDate, setCurrentDate] = useState(() => new Date());
  const [cancelOpened, { open: openCancel, close: closeCancel }] = useDisclosure(false);
  const [scheduleOpened, { open: openSchedule, close: closeSchedule }] = useDisclosure(false);
  const [cancelTarget, setCancelTarget] = useState(null);
  const [scheduleTarget, setScheduleTarget] = useState(null);
  const [scheduleForm, setScheduleForm] = useState({ animal: '', type: '', date: '', time: '', veterinarian: '' });
  const [formError, setFormError] = useState(null);
  const [feedback, setFeedback] = useState('');
  const lock = useRef(false);
  const start = toKey(startOfWeek(startOfMonth(currentDate)));
  const end = toKey(addDays(startOfWeek(startOfMonth(currentDate)), 41));
  const vetsQuery = useClinicQuery(['veterinarians'], clinicService.veterinarians);
  const animalsQuery = useClinicQuery(['animals'], clinicService.animals);
  const appointmentsQuery = useClinicQuery(['appointments', start, end], (options) => clinicService.appointments(start, end, options));
  const vets = vetsQuery.data || [];
  const animals = animalsQuery.data || [];
  const schedule = useMemo(() => {
    const result = {};
    for (const record of appointmentsQuery.data || []) {
      const animal = record.expand?.animal;
      const entry = { ...record, canceled: record.status === 'Cancelada',
        text: [animal?.name, animal?.species].filter(Boolean).join(' · '),
        sub: [animal?.expand?.tutor?.name, record.type].filter(Boolean).join(' · '),
      };
      const slot = `${record.time}-${record.veterinarian}`;
      result[record.date] ||= {};
      if (!result[record.date][slot] || result[record.date][slot].canceled || !entry.canceled) result[record.date][slot] = entry;
    }
    return result;
  }, [appointmentsQuery.data]);
  const scheduleMutation = useClinicMutation(clinicService.schedule);
  const cancelMutation = useClinicMutation(clinicService.cancel);
  const busy = scheduleMutation.isPending || cancelMutation.isPending;
  const unavailable = vetsQuery.isPending || animalsQuery.isPending || appointmentsQuery.isPending
    || vetsQuery.isError || animalsQuery.isError || appointmentsQuery.isError;
  const selectedAnimal = animals.find((animal) => animal.id === scheduleForm.animal);

  const goToDay = (date) => { setCurrentDate(date); setView('Dia'); };
  const goPrevious = () => setCurrentDate((date) => view === 'Dia' ? addDays(date, -1) : view === 'Semana' ? addDays(date, -7) : addMonths(date, -1));
  const goNext = () => setCurrentDate((date) => view === 'Dia' ? addDays(date, 1) : view === 'Semana' ? addDays(date, 7) : addMonths(date, 1));
  const periodLabel = view === 'Dia' ? formatDayLabel(currentDate) : view === 'Semana' ? formatWeekLabel(currentDate) : formatMonthLabel(currentDate);
  const handleSlotClick = (date, time, veterinarian, appt) => {
    if (busy || unavailable) return;
    setFormError(null);
    if (appt && !appt.canceled) {
      setCancelTarget({ appt, veterinarian });
      openCancel();
    } else {
      setScheduleTarget({ date, time, veterinarian });
      setScheduleForm({ animal: appt?.animal || '', type: appt?.type || '', date: toKey(date), time, veterinarian: veterinarian.id });
      openSchedule();
    }
  };
  const newAppointment = () => {
    setFormError(null);
    setScheduleTarget({});
    setScheduleForm({ animal: '', type: '', date: toKey(currentDate), time: times[0], veterinarian: vets[0]?.id || '' });
    openSchedule();
  };
  const confirmCancel = async () => {
    if (lock.current || !cancelTarget) return;
    lock.current = true;
    setFormError(null);
    try {
      await cancelMutation.mutateAsync(cancelTarget.appt.id);
      closeCancel();
      setFeedback('Atendimento cancelado.');
    } catch (error) { setFormError(getErrorMessage(error)); }
    finally { lock.current = false; }
  };
  const confirmSchedule = async (event) => {
    event.preventDefault();
    if (lock.current) return;
    lock.current = true;
    setFormError(null);
    try {
      await scheduleMutation.mutateAsync({ ...scheduleForm, type: scheduleForm.type.trim() });
      setCurrentDate(new Date(`${scheduleForm.date}T12:00:00`));
      closeSchedule();
      setFeedback('Atendimento agendado.');
    } catch (error) { setFormError(getErrorMessage(error, 'Não foi possível agendar. Verifique se o horário está livre.')); }
    finally { lock.current = false; }
  };
  const setField = (name, value) => setScheduleForm((form) => ({ ...form, [name]: value }));

  return (
    <>
      <PageHeader title="Agenda" actionLabel="Nova consulta" onAction={newAppointment} actionDisabled={unavailable || busy || !vets.length || !animals.length} />
      <Group mb="md" gap="xs">
        <Button variant="default" onClick={goPrevious}>Anterior</Button>
        <Text fw={600} px="xs">{periodLabel}</Text>
        <Button variant="default" onClick={goNext}>Próximo</Button>
        <div className={classes.grow} />
        {['Dia', 'Semana', 'Mês'].map((value) => <Button key={value} variant={view === value ? 'filled' : 'default'} onClick={() => setView(value)}>{value}</Button>)}
      </Group>
      {feedback && <Text c="teal" mb="md" role="status">{feedback}</Text>}
      <Paper withBorder p="lg">
        <QueryState query={vetsQuery} empty={vets.length === 0} emptyMessage="Nenhum veterinário cadastrado. Cadastre um usuário com esse perfil." />
        <QueryState query={animalsQuery} empty={animals.length === 0} emptyMessage="Cadastre os animais em Registros antes de agendar." />
        <QueryState query={appointmentsQuery} />
        {!unavailable && vets.length > 0 && <>
          {view === 'Dia' && <DayView date={currentDate} vets={vets} dayAppointments={schedule[toKey(currentDate)] || {}} onSlotClick={handleSlotClick} disabled={busy || !animals.length} />}
          {view === 'Semana' && <WeekView date={currentDate} schedule={schedule} onSelectDay={goToDay} />}
          {view === 'Mês' && <MonthView date={currentDate} schedule={schedule} onSelectDay={goToDay} />}
        </>}
      </Paper>
      <Modal opened={cancelOpened} onClose={() => { if (!busy) closeCancel(); }} title="Cancelar atendimento" centered closeOnClickOutside={!busy} closeOnEscape={!busy} withCloseButton={!busy}>
        {cancelTarget && <Stack>
          {formError && <Alert color="red" role="alert">{formError}</Alert>}
          <Text size="sm">Tem certeza que deseja cancelar o atendimento de <strong>{cancelTarget.appt.text}</strong> ({cancelTarget.appt.sub}) às {cancelTarget.appt.time} com {cancelTarget.veterinarian.name}?</Text>
          <Group justify="flex-end">
            <Button variant="default" onClick={closeCancel} disabled={busy}>Manter atendimento</Button>
            <Button color="red" onClick={confirmCancel} loading={cancelMutation.isPending}>Cancelar atendimento</Button>
          </Group>
        </Stack>}
      </Modal>
      <Modal opened={scheduleOpened} onClose={() => { if (!busy) closeSchedule(); }} title="Agendar atendimento" centered closeOnClickOutside={!busy} closeOnEscape={!busy} withCloseButton={!busy}>
        {scheduleTarget && <form onSubmit={confirmSchedule}><Stack>
          {formError && <Alert color="red" role="alert">{formError}</Alert>}
          {scheduleTarget.veterinarian ? <Text size="sm" c="dimmed">{scheduleTarget.veterinarian.name} · {scheduleForm.time} · {formatDayLabel(scheduleTarget.date)}</Text> : <>
            <Select label="Veterinário" required allowDeselect={false} data={vets.map((vet) => ({ value: vet.id, label: vet.name }))} value={scheduleForm.veterinarian} onChange={(value) => setField('veterinarian', value)} disabled={busy} />
            <Group grow>
              <TextInput type="date" label="Data" required value={scheduleForm.date} onChange={(event) => setField('date', event.currentTarget.value)} disabled={busy} />
              <Select label="Horário" required allowDeselect={false} data={times} value={scheduleForm.time} onChange={(value) => setField('time', value)} disabled={busy} />
            </Group>
          </>}
          <Group grow>
            <Select label="Animal" searchable required allowDeselect={false} data={animals.map((animal) => ({ value: animal.id, label: `${animal.name} · ${animal.expand?.tutor?.name || '—'}` }))} value={scheduleForm.animal || null} onChange={(value) => setField('animal', value)} disabled={busy} />
            <TextInput label="Espécie" value={selectedAnimal?.species || ''} readOnly />
          </Group>
          <Group grow>
            <TextInput label="Tutor" value={selectedAnimal?.expand?.tutor?.name || ''} readOnly />
            <TextInput label="Tipo de atendimento" required value={scheduleForm.type} onChange={(event) => setField('type', event.currentTarget.value)} disabled={busy} />
          </Group>
          <Group justify="flex-end">
            <Button variant="default" onClick={closeSchedule} disabled={busy}>Cancelar</Button>
            <Button type="submit" loading={scheduleMutation.isPending} disabled={!scheduleForm.animal || !scheduleForm.type.trim()}>Agendar atendimento</Button>
          </Group>
        </Stack></form>}
      </Modal>
    </>
  );
}

function DayView({ date, vets, dayAppointments, onSlotClick, disabled }) {
  return (
    <div className={classes.calendar} style={{ gridTemplateColumns: `90px repeat(${vets.length}, minmax(140px, 1fr))`, overflowX: 'auto' }}>
      <div />
      {vets.map((vet) => <Text key={vet.id} fw={700}>{vet.name}</Text>)}
      {times.map((time) => <Fragment key={time}>
        <Text fw={500} className={classes.time}>{time}</Text>
        {vets.map((vet) => {
          const appt = dayAppointments[`${time}-${vet.id}`];
          const className = appt ? (appt.canceled ? classes.cancel : classes.appointment) : classes.free;
          return <button key={vet.id} type="button" disabled={disabled} className={className} onClick={() => onSlotClick(date, time, vet, appt)}>
            {appt ? <div><Text size="sm" fw={600}>{appt.text}</Text><Text size="xs">{appt.sub}</Text>{appt.canceled && <Badge color="orange" size="xs" mt={4}>Cancelada</Badge>}</div> : <Text size="sm" c="dimmed">Horário livre</Text>}
          </button>;
        })}
      </Fragment>)}
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
