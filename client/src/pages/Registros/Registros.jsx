import { useState } from 'react';
import { Tabs, Paper, TextInput, Table, Button, Badge, Text } from '@mantine/core';
import { PageHeader } from '../../components/PageHeader/PageHeader';

const thStyle = { fontSize: 13, fontWeight: 700, color: 'var(--vc-muted)' };

const tutors = [
  { name: 'Marina Souza', phone: '(71) 99999-0001', animals: 'Thor' },
  { name: 'Carlos Lima', phone: '(71) 99999-0002', animals: 'Mel, Pipoca' },
  { name: 'Ana Prado', phone: '(71) 99999-0003', animals: 'Bidu' },
  { name: 'Rita Alves', phone: '(71) 99999-0004', animals: 'Luna' },
];

const animals = [
  { name: 'Thor', species: 'Cão', breed: 'Labrador', age: '4 anos', tutor: 'Marina Souza' },
  { name: 'Mel', species: 'Gata', breed: 'SRD', age: '2 anos', tutor: 'Juliana Lombroso' },
  { name: 'Bidu', species: 'Cão', breed: 'Poodle', age: '7 anos', tutor: 'Ana Prado' },
  { name: 'Pipoca', species: 'Cão', breed: 'Shih Tzu', age: '3 anos', tutor: 'Anderson Simas' },
];

const veterinarians = [
  { name: 'Dra. Ana Lima', specialty: 'Clínica Geral', phone: '(71) 98888-0001' },
  { name: 'Dr. Paulo Reis', specialty: 'Cirurgia', phone: '(71) 98888-0002' },
  { name: 'Dra. Emily', specialty: 'Dermatologia', phone: '(71) 98888-0003' },
];

const paymentsList = [
  { tutor: 'Marina Souza', date: '05/10/2026', amount: '180', status: 'Pago' },
  { tutor: 'Carlos Lima', date: '06/10/2026', amount: '95', status: 'Pendente' },
  { tutor: 'Rita Alves', date: '07/10/2026', amount: '240', status: 'Pago' },
];

const TABS = [
  { value: 'tutores', label: 'Tutores', placeholder: 'Buscar tutor ou animal' },
  { value: 'animais', label: 'Animais', placeholder: 'Buscar animal ou tutor' },
  { value: 'veterinarios', label: 'Veterinários', placeholder: 'Buscar veterinário' },
  { value: 'pagamentos', label: 'Pagamentos', placeholder: 'Buscar pagamento' },
];

function matches(query, ...values) {
  return values.join(' ').toLowerCase().includes(query.toLowerCase());
}

export function Registros() {
  const [tab, setTab] = useState('tutores');
  const [query, setQuery] = useState('');

  const handleTabChange = (value) => {
    setTab(value);
    setQuery('');
  };

  const filteredTutors = tutors.filter((t) => matches(query, t.name, t.phone, t.animals));
  const filteredAnimals = animals.filter((a) => matches(query, a.name, a.species, a.breed, a.tutor));
  const filteredVets = veterinarians.filter((v) => matches(query, v.name, v.specialty, v.phone));
  const filteredPayments = paymentsList.filter((p) => matches(query, p.tutor, p.status, p.date));

  const activeTab = TABS.find((t) => t.value === tab);

  return (
    <>
      <PageHeader
        title="Registros"
        actionLabel="Novo tutor"
        onAction={() => alert('Cadastro de tutor (em breve).')}
      />

      <Tabs value={tab} onChange={handleTabChange} mb="md">
        <Tabs.List>
          {TABS.map((t) => (
            <Tabs.Tab key={t.value} value={t.value}>{t.label}</Tabs.Tab>
          ))}
        </Tabs.List>
      </Tabs>

      <Paper withBorder p="lg">
        <TextInput
          placeholder={activeTab.placeholder}
          value={query}
          onChange={(event) => setQuery(event.currentTarget.value)}
          mb="md"
          maw={320}
        />

        {tab === 'tutores' && (
          <Table verticalSpacing="sm" highlightOnHover>
            <Table.Thead>
              <Table.Tr>
                <Table.Th style={thStyle}>Tutor</Table.Th>
                <Table.Th style={thStyle}>Telefone</Table.Th>
                <Table.Th style={thStyle}>Animais</Table.Th>
                <Table.Th />
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {filteredTutors.map((tutor) => (
                <Table.Tr key={tutor.name}>
                  <Table.Td fw={500}>{tutor.name}</Table.Td>
                  <Table.Td>{tutor.phone}</Table.Td>
                  <Table.Td><Badge variant="light">{tutor.animals}</Badge></Table.Td>
                  <Table.Td>
                    <Button size="xs" variant="default" onClick={() => alert(`Editar ${tutor.name} (em breve).`)}>
                      Editar
                    </Button>
                  </Table.Td>
                </Table.Tr>
              ))}
            </Table.Tbody>
          </Table>
        )}

        {tab === 'animais' && (
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
                <Table.Tr key={animal.name}>
                  <Table.Td fw={500}>{animal.name}</Table.Td>
                  <Table.Td>{animal.species}</Table.Td>
                  <Table.Td>{animal.breed}</Table.Td>
                  <Table.Td>{animal.age}</Table.Td>
                  <Table.Td>{animal.tutor}</Table.Td>
                  <Table.Td>
                    <Button size="xs" variant="default" onClick={() => alert(`Editar ${animal.name} (em breve).`)}>
                      Editar
                    </Button>
                  </Table.Td>
                </Table.Tr>
              ))}
            </Table.Tbody>
          </Table>
        )}

        {tab === 'veterinarios' && (
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
                <Table.Tr key={vet.name}>
                  <Table.Td fw={500}>{vet.name}</Table.Td>
                  <Table.Td>{vet.specialty}</Table.Td>
                  <Table.Td>{vet.phone}</Table.Td>
                  <Table.Td>
                    <Button size="xs" variant="default" onClick={() => alert(`Editar ${vet.name} (em breve).`)}>
                      Editar
                    </Button>
                  </Table.Td>
                </Table.Tr>
              ))}
            </Table.Tbody>
          </Table>
        )}

        {tab === 'pagamentos' && (
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
                <Table.Tr key={`${payment.tutor}-${payment.date}`}>
                  <Table.Td fw={500}>{payment.tutor}</Table.Td>
                  <Table.Td>{payment.date}</Table.Td>
                  <Table.Td>R$ {payment.amount}</Table.Td>
                  <Table.Td>
                    <Badge color={payment.status === 'Pago' ? 'brand' : 'orange'} variant="light">
                      {payment.status}
                    </Badge>
                  </Table.Td>
                  <Table.Td>
                    <Button size="xs" variant="default" onClick={() => alert(`Editar pagamento de ${payment.tutor} (em breve).`)}>
                      Editar
                    </Button>
                  </Table.Td>
                </Table.Tr>
              ))}
            </Table.Tbody>
          </Table>
        )}

        {filteredTutors.length === 0 && tab === 'tutores' && (
          <Text c="dimmed" ta="center" py="md">Nenhum tutor encontrado.</Text>
        )}
        {filteredAnimals.length === 0 && tab === 'animais' && (
          <Text c="dimmed" ta="center" py="md">Nenhum animal encontrado.</Text>
        )}
        {filteredVets.length === 0 && tab === 'veterinarios' && (
          <Text c="dimmed" ta="center" py="md">Nenhum veterinário encontrado.</Text>
        )}
        {filteredPayments.length === 0 && tab === 'pagamentos' && (
          <Text c="dimmed" ta="center" py="md">Nenhum pagamento encontrado.</Text>
        )}
      </Paper>
    </>
  );
}
