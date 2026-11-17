import { useState } from 'react';
import { Tabs, Paper, TextInput, Table, Button, Badge, Text, Group } from '@mantine/core';
import { PageHeader } from '../../components/PageHeader/PageHeader';
import { useNavigate, useSearchParams } from 'react-router';
import { useAuth } from '../../context/AuthContext';
import { useClinicQuery } from '../../hooks/useClinic';
import { clinicService } from '../../services/clinicService.js';
import { QueryState } from '../../components/QueryState';
import { RecordForm } from '../../components/RecordForm';
import { animalAge, dateKey, formatCpf, formatDate, formatMoney, formatPhone } from '../../utils/format.js';
import { isValidCpf, isValidPhone } from '../../utils/validation.js';
import { TutorDeleteModal } from './TutorDeleteModal';

const thStyle = { fontSize: 13, fontWeight: 700, color: 'var(--vc-muted)' };

// RBAC (docs/RBAC.md): os três perfis mantêm tutores, mas só administração e recepção excluem.
const TUTOR_DELETE_ROLES = ['administracao', 'recepcao'];

const TABS = [
  { value: 'tutores', label: 'Tutores', placeholder: 'Buscar por nome, CPF ou telefone' },
  { value: 'animais', label: 'Animais', placeholder: 'Buscar animal ou tutor' },
  { value: 'veterinarios', label: 'Veterinários', placeholder: 'Buscar veterinário' },
  { value: 'pagamentos', label: 'Pagamentos', placeholder: 'Buscar pagamento' },
];

function matches(query, ...values) {
  return values.join(' ').toLowerCase().includes(query.toLowerCase());
}

export function Registros() {
  const [params] = useSearchParams();
  const [tab, setTab] = useState(TABS.some((item) => item.value === params.get('tab')) ? params.get('tab') : 'tutores');
  const [query, setQuery] = useState('');
  const [editing, setEditing] = useState(null);
  const [deletingTutor, setDeletingTutor] = useState(null);
  const [notice, setNotice] = useState(null);
  const { user } = useAuth();
  const navigate = useNavigate();
  const tutorsQuery = useClinicQuery(['tutors'], clinicService.tutors);
  const animalsQuery = useClinicQuery(['animals'], clinicService.animals);
  const vetsQuery = useClinicQuery(['veterinarians'], clinicService.veterinarians);
  const paymentsQuery = useClinicQuery(['payments'], clinicService.payments);
  const tutors = (tutorsQuery.data || []).map((tutor) => {
    const animalNames = (animalsQuery.data || []).filter((animal) => animal.tutor === tutor.id).map((animal) => animal.name);
    return { ...tutor, animalNames, animals: animalNames.join(', ') || '—' };
  });
  const animals = (animalsQuery.data || []).map((animal) => ({ ...animal, tutorName: animal.expand?.tutor?.name || '—', age: animalAge(animal.birthDate) }));
  const veterinarians = vetsQuery.data || [];
  const paymentsList = (paymentsQuery.data || []).map((payment) => ({ ...payment, tutorName: payment.expand?.tutor?.name || '—' }));
  const activeQuery = { tutores: tutorsQuery, animais: animalsQuery, veterinarios: vetsQuery, pagamentos: paymentsQuery }[tab];
  const canEditVet = user?.role !== 'recepcao';
  const canDeleteTutor = TUTOR_DELETE_ROLES.includes(user?.role);

  const handleTabChange = (value) => {
    setTab(value);
    setQuery('');
  };

  const filteredTutors = tutors.filter((t) => matches(query, t.name, t.cpf, formatCpf(t.cpf), t.phone, formatPhone(t.phone), t.email, t.animals));
  const filteredAnimals = animals.filter((a) => matches(query, a.name, a.species, a.breed, a.tutorName));
  const filteredVets = veterinarians.filter((v) => matches(query, v.name, v.specialty, v.phone));
  const filteredPayments = paymentsList.filter((p) => matches(query, p.tutorName, p.status, formatDate(p.date)));

  const tutorOptions = tutors.map(({ id, name }) => ({ value: id, label: name }));
  const fields = {
    tutores: [
      { name: 'name', label: 'Nome completo', required: true, maxLength: 200 },
      { name: 'cpf', label: 'CPF', required: true, placeholder: '000.000.000-00', inputMode: 'numeric', format: formatCpf,
        validate: (value) => isValidCpf(value) ? null : 'Informe um CPF válido.' },
      { name: 'phone', label: 'Telefone', required: true, placeholder: '(00) 00000-0000', inputMode: 'tel', format: formatPhone,
        validate: (value) => isValidPhone(value) ? null : 'Informe um telefone válido com DDD.' },
      { name: 'email', label: 'E-mail', type: 'email', placeholder: 'tutor@exemplo.com' },
      { name: 'address', label: 'Endereço', type: 'textarea', maxLength: 300, autosize: true, minRows: 2 },
    ],
    animais: [
      { name: 'name', label: 'Nome', required: true }, { name: 'species', label: 'Espécie', required: true },
      { name: 'breed', label: 'Raça' }, { name: 'birthDate', label: 'Data de nascimento', type: 'date', max: dateKey() },
      { name: 'tutor', label: 'Tutor', type: 'select', required: true, data: tutorOptions },
      { name: 'active', label: 'Ativo', type: 'checkbox' },
    ],
    veterinarios: [{ name: 'name', label: 'Nome', required: true }, { name: 'specialty', label: 'Especialidade' }, { name: 'phone', label: 'Telefone' }],
    pagamentos: [
      { name: 'tutor', label: 'Tutor', type: 'select', required: true, data: tutorOptions },
      { name: 'date', label: 'Data', type: 'date', required: true },
      { name: 'amount', label: 'Valor (R$)', type: 'number', min: '0.01', step: '0.01', required: true },
      { name: 'status', label: 'Status', type: 'select', required: true, data: ['Pago', 'Pendente'] },
    ],
  };
  const labels = { tutores: 'tutor', animais: 'animal', veterinarios: 'veterinário', pagamentos: 'pagamento' };
  const savers = { tutores: clinicService.saveTutor, animais: clinicService.saveAnimal, veterinarios: clinicService.saveVeterinarian, pagamentos: clinicService.savePayment };

  const activeTab = TABS.find((t) => t.value === tab);

  return (
    <>
      <PageHeader
        title="Registros"
        actionLabel={tab === 'veterinarios' ? (user?.role === 'administracao' ? 'Novo veterinário' : undefined) : `Novo ${labels[tab]}`}
        onAction={() => tab === 'veterinarios' ? navigate('/usuarios') : setEditing({ tab, record: null })}
      />

      <Tabs value={tab} onChange={handleTabChange} mb="md">
        <Tabs.List>
          {TABS.map((t) => (
            <Tabs.Tab key={t.value} value={t.value}>{t.label}</Tabs.Tab>
          ))}
        </Tabs.List>
      </Tabs>

      <Paper withBorder p="lg">
        {notice && <Text c="teal" mb="md" role="status">{notice}</Text>}
        <TextInput
          placeholder={activeTab.placeholder}
          value={query}
          onChange={(event) => setQuery(event.currentTarget.value)}
          mb="md"
          maw={320}
        />

        <QueryState query={activeQuery} />
        {tab === 'tutores' && !activeQuery.isPending && !activeQuery.isError && (
          <Table verticalSpacing="sm" highlightOnHover>
            <Table.Thead>
              <Table.Tr>
                <Table.Th style={thStyle}>Tutor</Table.Th>
                <Table.Th style={thStyle}>CPF</Table.Th>
                <Table.Th style={thStyle}>Telefone</Table.Th>
                <Table.Th style={thStyle}>Animais</Table.Th>
                <Table.Th />
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {filteredTutors.map((tutor) => (
                <Table.Tr key={tutor.id}>
                  <Table.Td>
                    <Text fw={500} size="sm">{tutor.name}</Text>
                    {tutor.email && <Text size="xs" c="dimmed">{tutor.email}</Text>}
                  </Table.Td>
                  <Table.Td>{formatCpf(tutor.cpf) || '—'}</Table.Td>
                  <Table.Td>{formatPhone(tutor.phone) || '—'}</Table.Td>
                  <Table.Td><Badge variant="light">{tutor.animals}</Badge></Table.Td>
                  <Table.Td>
                    <Group gap="xs" justify="flex-end" wrap="nowrap">
                      <Button size="xs" variant="default" onClick={() => setEditing({ tab, record: tutor })}>
                        Editar
                      </Button>
                      {canDeleteTutor && (
                        <Button size="xs" variant="light" color="red" onClick={() => setDeletingTutor(tutor)}>
                          Excluir
                        </Button>
                      )}
                    </Group>
                  </Table.Td>
                </Table.Tr>
              ))}
            </Table.Tbody>
          </Table>
        )}

        {tab === 'animais' && !activeQuery.isPending && !activeQuery.isError && (
          <Table verticalSpacing="sm" highlightOnHover>
            <Table.Thead>
              <Table.Tr>
                <Table.Th style={thStyle}>Nome</Table.Th>
                <Table.Th style={thStyle}>Espécie</Table.Th>
                <Table.Th style={thStyle}>Raça</Table.Th>
                <Table.Th style={thStyle}>Idade</Table.Th>
                <Table.Th style={thStyle}>Tutor</Table.Th>
                <Table.Th />
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {filteredAnimals.map((animal) => (
                <Table.Tr key={animal.id}>
                  <Table.Td fw={500}>{animal.name}</Table.Td>
                  <Table.Td>{animal.species}</Table.Td>
                  <Table.Td>{animal.breed}</Table.Td>
                  <Table.Td>{animal.age}</Table.Td>
                  <Table.Td>{animal.tutorName}</Table.Td>
                  <Table.Td>
                    <Button size="xs" variant="default" onClick={() => setEditing({ tab, record: animal })}>
                      Editar
                    </Button>
                  </Table.Td>
                </Table.Tr>
              ))}
            </Table.Tbody>
          </Table>
        )}

        {tab === 'veterinarios' && !activeQuery.isPending && !activeQuery.isError && (
          <Table verticalSpacing="sm" highlightOnHover>
            <Table.Thead>
              <Table.Tr>
                <Table.Th style={thStyle}>Veterinário</Table.Th>
                <Table.Th style={thStyle}>Especialidade</Table.Th>
                <Table.Th style={thStyle}>Telefone</Table.Th>
                <Table.Th />
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {filteredVets.map((vet) => (
                <Table.Tr key={vet.id}>
                  <Table.Td fw={500}>{vet.name}</Table.Td>
                  <Table.Td>{vet.specialty}</Table.Td>
                  <Table.Td>{vet.phone}</Table.Td>
                  <Table.Td>
                    {canEditVet && <Button size="xs" variant="default" onClick={() => setEditing({ tab, record: vet })}>
                      Editar
                    </Button>}
                  </Table.Td>
                </Table.Tr>
              ))}
            </Table.Tbody>
          </Table>
        )}

        {tab === 'pagamentos' && !activeQuery.isPending && !activeQuery.isError && (
          <Table verticalSpacing="sm" highlightOnHover>
            <Table.Thead>
              <Table.Tr>
                <Table.Th style={thStyle}>Tutor</Table.Th>
                <Table.Th style={thStyle}>Data</Table.Th>
                <Table.Th style={thStyle}>Valor</Table.Th>
                <Table.Th style={thStyle}>Status</Table.Th>
                <Table.Th />
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {filteredPayments.map((payment) => (
                <Table.Tr key={payment.id}>
                  <Table.Td fw={500}>{payment.tutorName}</Table.Td>
                  <Table.Td>{formatDate(payment.date)}</Table.Td>
                  <Table.Td>{formatMoney(payment.amountCents)}</Table.Td>
                  <Table.Td>
                    <Badge color={payment.status === 'Pago' ? 'brand' : 'orange'} variant="light">
                      {payment.status}
                    </Badge>
                  </Table.Td>
                  <Table.Td>
                    <Button size="xs" variant="default" onClick={() => setEditing({ tab, record: payment })}>
                      Editar
                    </Button>
                  </Table.Td>
                </Table.Tr>
              ))}
            </Table.Tbody>
          </Table>
        )}

        {!activeQuery.isPending && !activeQuery.isError && filteredTutors.length === 0 && tab === 'tutores' && (
          <Text c="dimmed" ta="center" py="md">Nenhum tutor encontrado.</Text>
        )}
        {!activeQuery.isPending && !activeQuery.isError && filteredAnimals.length === 0 && tab === 'animais' && (
          <Text c="dimmed" ta="center" py="md">Nenhum animal encontrado.</Text>
        )}
        {!activeQuery.isPending && !activeQuery.isError && filteredVets.length === 0 && tab === 'veterinarios' && (
          <Text c="dimmed" ta="center" py="md">Nenhum veterinário encontrado.</Text>
        )}
        {!activeQuery.isPending && !activeQuery.isError && filteredPayments.length === 0 && tab === 'pagamentos' && (
          <Text c="dimmed" ta="center" py="md">Nenhum pagamento encontrado.</Text>
        )}
      </Paper>
      {editing && <RecordForm key={`${editing.tab}-${editing.record?.id || 'new'}`}
        opened onClose={() => setEditing(null)} title={`${editing.record ? 'Editar' : 'Novo'} ${labels[editing.tab]}`}
        fields={fields[editing.tab]}
        initialValues={{ name: '', phone: '', species: '', breed: '', birthDate: '', tutor: '', active: true,
          date: dateKey(), status: 'Pendente', specialty: '', cpf: '', email: '', address: '', ...editing.record,
          amount: editing.record ? (editing.record.amountCents || 0) / 100 : '',
          ...(editing.tab === 'tutores' && editing.record
            ? { cpf: formatCpf(editing.record.cpf), phone: formatPhone(editing.record.phone) } : {}),
        }}
        save={(data) => savers[editing.tab](editing.record?.id, data)} onSaved={() => setNotice('Registro salvo.')} />}
      {deletingTutor && <TutorDeleteModal key={deletingTutor.id} tutor={deletingTutor}
        onClose={() => setDeletingTutor(null)} onDeleted={() => setNotice(`Tutor "${deletingTutor.name}" excluído.`)} />}
    </>
  );
}
