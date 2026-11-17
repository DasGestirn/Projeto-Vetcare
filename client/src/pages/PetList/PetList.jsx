import { useState } from 'react';
import {
  Table, TextInput, Button, Paper, Text, Badge, Avatar,
  Tabs, Grid, Stack, Group,
} from '@mantine/core';
import { PageHeader } from '../../components/PageHeader/PageHeader';
import { QueryState } from '../../components/QueryState';
import { RecordForm } from '../../components/RecordForm';
import { useAuth } from '../../context/AuthContext';
import { useClinicQuery } from '../../hooks/useClinic';
import { clinicService } from '../../services/clinicService.js';
import { animalAge, dateKey, formatDate } from '../../utils/format.js';

const thStyle = { fontSize: 13, fontWeight: 700, color: 'var(--vc-muted)' };

function AnimalDetail({ animal, onBack }) {
  const { user } = useAuth();
  const canWrite = user?.role === 'veterinario';
  const canReadHistory = user?.role !== 'recepcao';
  const [tab, setTab] = useState('historico');
  const [editor, setEditor] = useState(null);
  const [feedback, setFeedback] = useState('');
  const historyQuery = useClinicQuery(['medical_records', animal.id], (options) => clinicService.clinical('medical_records', animal.id, options), canReadHistory);
  const vaccinesQuery = useClinicQuery(['vaccinations', animal.id], (options) => clinicService.clinical('vaccinations', animal.id, options));
  const prescriptionsQuery = useClinicQuery(['prescriptions', animal.id], (options) => clinicService.clinical('prescriptions', animal.id, options));
  const history = historyQuery.data || [];
  const vaccines = vaccinesQuery.data || [];
  const prescriptions = prescriptionsQuery.data || [];
  const activePrescriptions = prescriptions.filter((record) => record.active);
  const openEditor = (collection, record = null) => { setFeedback(''); setEditor({ collection, record }); };
  const editorRecords = editor?.collection === 'vaccinations' ? vaccines : prescriptions;
  const names = { medical_records: 'atendimento', vaccinations: 'vacina', prescriptions: 'prescrição' };
  const fields = editor ? [
    ...(editor.record && editorRecords.length > 1 ? [{ name: 'recordId', label: 'Registro', type: 'select', required: true,
      data: editorRecords.map((record) => ({ value: record.id, label: `${record.name || record.title} · ${formatDate(record.date)}` })),
      onValueChange: (id) => editorRecords.find((record) => record.id === id),
    }] : []),
    { name: editor.collection === 'vaccinations' ? 'name' : 'title', label: editor.collection === 'vaccinations' ? 'Vacina' : 'Título', required: true },
    { name: 'date', label: 'Data', type: 'date', required: true, max: dateKey() },
    ...(editor.collection === 'vaccinations' ? [{ name: 'nextDate', label: 'Previsão da próxima dose', type: 'date' }] : [
      { name: editor.collection === 'prescriptions' ? 'instructions' : 'notes', label: editor.collection === 'prescriptions' ? 'Prescrição' : 'Observações do atendimento', type: 'textarea', required: true, minRows: 4 },
    ]),
    ...(editor.collection === 'prescriptions' ? [{ name: 'active', label: 'Ativa', type: 'checkbox' }] : []),
  ] : [];

  return (
    <>
      <PageHeader title="Prontuário" actionLabel={canWrite ? 'Registrar Atendimento' : undefined} onAction={() => openEditor('medical_records')} />
      <Button variant="subtle" onClick={onBack} mb="md" px={0}>Voltar para todos os prontuários</Button>
      {feedback && <Text c="teal" mb="md" role="status">{feedback}</Text>}
      <Grid>
        <Grid.Col span={{ base: 12, md: 8 }}>
          <Stack>
            <Paper withBorder p="lg">
              <Group>
                <Avatar radius="xl" size="lg">{animal.name[0]}</Avatar>
                <div style={{ flex: 1 }}>
                  <Text fw={700} size="lg">{animal.name}</Text>
                  <Text size="sm" c="dimmed">{animal.species} · {animal.breed || '—'} · {animalAge(animal.birthDate)} · Tutor: {animal.expand?.tutor?.name || '—'}</Text>
                </div>
                <Badge color={animal.active ? 'brand' : 'gray'}>{animal.active ? 'Ativo' : 'Inativo'}</Badge>
              </Group>
            </Paper>
            <Tabs value={tab} onChange={setTab}>
              <Tabs.List>
                <Tabs.Tab value="historico">Histórico</Tabs.Tab>
                <Tabs.Tab value="vacinas">Vacinas</Tabs.Tab>
                <Tabs.Tab value="prescricoes">Prescrições</Tabs.Tab>
              </Tabs.List>
              <Tabs.Panel value="historico" pt="md">
                {canReadHistory ? <Stack>
                  <QueryState query={historyQuery} empty={history.length === 0} emptyMessage="Nenhum atendimento registrado." />
                  {!historyQuery.isError && history.map((record) => <Paper key={record.id} withBorder p="lg">
                    <Group justify="space-between"><Text fw={700}>{record.title}</Text><Text size="xs" c="dimmed">{formatDate(record.date)}</Text></Group>
                    <Text size="sm" mt="xs" style={{ whiteSpace: 'pre-wrap' }}>{record.notes}</Text>
                  </Paper>)}
                </Stack> : <Text c="dimmed">Seu perfil não permite consultar o histórico clínico.</Text>}
              </Tabs.Panel>
              <Tabs.Panel value="vacinas" pt="md">
                <Paper withBorder p="lg">
                  <Text fw={700} mb="xs">Vacinas</Text>
                  <QueryState query={vaccinesQuery} empty={vaccines.length === 0} emptyMessage="Nenhuma vacina registrada." />
                  {!vaccinesQuery.isError && vaccines.map((record) => <Text key={record.id} size="sm">{record.name} · Aplicada: {formatDate(record.date)} · Próxima: {formatDate(record.nextDate)}</Text>)}
                </Paper>
              </Tabs.Panel>
              <Tabs.Panel value="prescricoes" pt="md">
                <Paper withBorder p="lg">
                  <Text fw={700} mb="xs">Prescrições</Text>
                  <QueryState query={prescriptionsQuery} empty={prescriptions.length === 0} emptyMessage="Nenhuma prescrição registrada." />
                  {!prescriptionsQuery.isError && prescriptions.map((record) => <div key={record.id}>
                    <Text fw={600} size="sm">{record.title} · {formatDate(record.date)} · {record.active ? 'Ativa' : 'Inativa'}</Text>
                    <Text size="sm" style={{ whiteSpace: 'pre-wrap' }}>{record.instructions}</Text>
                  </div>)}
                </Paper>
              </Tabs.Panel>
            </Tabs>
          </Stack>
        </Grid.Col>
        <Grid.Col span={{ base: 12, md: 4 }}>
          <Stack>
            <Paper withBorder p="lg">
              <Text fw={700} mb="xs">Vacinas</Text>
              <QueryState query={vaccinesQuery} empty={vaccines.length === 0} emptyMessage="Nenhuma vacina registrada." />
              {!vaccinesQuery.isError && vaccines.map((record) => <Group key={record.id} justify="space-between" mb="sm">
                <Text size="sm">{record.name}</Text><Text size="xs" c="dimmed">Próxima: {formatDate(record.nextDate)}</Text>
              </Group>)}
              {canWrite && <>
                <Button fullWidth mb="xs" onClick={() => openEditor('vaccinations')}>Registrar vacina</Button>
                <Button fullWidth variant="default" disabled={!vaccines.length || vaccinesQuery.isError} onClick={() => openEditor('vaccinations', vaccines[0])}>Editar vacina</Button>
              </>}
            </Paper>
            <Paper withBorder p="lg">
              <Text fw={700} mb="xs">Prescrições</Text>
              <QueryState query={prescriptionsQuery} empty={activePrescriptions.length === 0} emptyMessage="Nenhuma prescrição ativa." />
              {!prescriptionsQuery.isError && activePrescriptions.map((record) => <Text key={record.id} size="sm" mb="sm">{record.title}</Text>)}
              {canWrite && <>
                <Button fullWidth mb="xs" onClick={() => openEditor('prescriptions')}>Emitir prescrição</Button>
                <Button fullWidth variant="default" disabled={!prescriptions.length || prescriptionsQuery.isError} onClick={() => openEditor('prescriptions', prescriptions[0])}>Editar prescrição</Button>
              </>}
            </Paper>
          </Stack>
        </Grid.Col>
      </Grid>
      {editor && <RecordForm key={`${editor.collection}-${editor.record?.id || 'new'}`} opened onClose={() => setEditor(null)}
        title={`${editor.record ? 'Editar' : 'Registrar'} ${names[editor.collection]}`} fields={fields}
        initialValues={{ name: '', title: '', notes: '', instructions: '', date: dateKey(), nextDate: '', active: true, ...editor.record, recordId: editor.record?.id || '' }}
        save={(data) => clinicService.saveClinical(editor.collection, data.recordId || undefined, {
          animal: animal.id, veterinarian: data.veterinarian || user.id, date: data.date,
          ...(editor.collection === 'vaccinations' ? { name: data.name.trim(), nextDate: data.nextDate || '' }
            : editor.collection === 'prescriptions' ? { title: data.title.trim(), instructions: data.instructions.trim(), active: data.active }
              : { title: data.title.trim(), notes: data.notes.trim() }),
        })} onSaved={() => setFeedback('Registro salvo.')} />}
    </>
  );
}

export function PetList() {
  const [query, setQuery] = useState('');
  const [selectedId, setSelectedId] = useState(null);
  const [creating, setCreating] = useState(false);
  const animalsQuery = useClinicQuery(['animals'], clinicService.animals);
  const tutorsQuery = useClinicQuery(['tutors'], clinicService.tutors);
  const animals = animalsQuery.data || [];
  const selected = animals.find((animal) => animal.id === selectedId);
  if (selected) return <AnimalDetail animal={selected} onBack={() => setSelectedId(null)} />;
  const filtered = animals.filter((animal) => [animal.name, animal.species, animal.breed, animal.expand?.tutor?.name].join(' ').toLowerCase().includes(query.toLowerCase()));
  return (
    <>
      <PageHeader title="Prontuários" actionLabel="Novo prontuário" onAction={() => setCreating(true)} />
      <Paper withBorder p="lg">
        <TextInput placeholder="Buscar prontuário" value={query} onChange={(event) => setQuery(event.currentTarget.value)} mb="md" maw={320} />
        <QueryState query={animalsQuery} empty={filtered.length === 0} emptyMessage="Nenhum prontuário encontrado." />
        {!animalsQuery.isPending && !animalsQuery.isError && <Table verticalSpacing="sm" highlightOnHover>
          <Table.Thead><Table.Tr>
            {['Nome', 'Espécie', 'Raça', 'Idade', 'Tutor'].map((label) => <Table.Th key={label} style={thStyle}>{label}</Table.Th>)}
            <Table.Th />
          </Table.Tr></Table.Thead>
          <Table.Tbody>{filtered.map((animal) => <Table.Tr key={animal.id}>
            <Table.Td fw={500}>{animal.name}</Table.Td><Table.Td>{animal.species}</Table.Td><Table.Td>{animal.breed}</Table.Td>
            <Table.Td>{animalAge(animal.birthDate)}</Table.Td><Table.Td>{animal.expand?.tutor?.name || '—'}</Table.Td>
            <Table.Td><Button size="xs" variant="default" onClick={() => setSelectedId(animal.id)}>Visualizar</Button></Table.Td>
          </Table.Tr>)}</Table.Tbody>
        </Table>}
      </Paper>
      {creating && <RecordForm opened onClose={() => setCreating(false)} title="Novo prontuário"
        initialValues={{ name: '', species: '', breed: '', birthDate: '', tutor: '', active: true }}
        fields={[
          { name: 'name', label: 'Nome', required: true }, { name: 'species', label: 'Espécie', required: true }, { name: 'breed', label: 'Raça' },
          { name: 'birthDate', label: 'Data de nascimento', type: 'date', max: dateKey() },
          { name: 'tutor', label: 'Tutor', type: 'select', required: true,
            data: (tutorsQuery.data || []).map(({ id, name }) => ({ value: id, label: name })), description: 'Tutores cadastrados em Registros.' },
        ]}
        save={(data) => clinicService.saveAnimal(null, data)} onSaved={(animal) => setSelectedId(animal.id)} />}
    </>
  );
}
