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

export function Registros() {
  const [tab, setTab] = useState('tutores');
  const [query, setQuery] = useState('');

  const filtered = tutors.filter((tutor) =>
    `${tutor.name} ${tutor.phone} ${tutor.animals}`.toLowerCase().includes(query.toLowerCase())
  );

  return (
    <>
      <PageHeader
        title="Registros"
        actionLabel="Novo tutor"
        onAction={() => alert('Cadastro de tutor (em breve).')}
      />

      <Tabs value={tab} onChange={setTab} mb="md">
        <Tabs.List>
          <Tabs.Tab value="tutores">Tutores</Tabs.Tab>
          <Tabs.Tab value="animais">Animais</Tabs.Tab>
          <Tabs.Tab value="veterinarios">Veterinários</Tabs.Tab>
          <Tabs.Tab value="pagamentos">Pagamentos</Tabs.Tab>
        </Tabs.List>
      </Tabs>

      <Paper withBorder p="lg">
        <TextInput
          placeholder="Buscar tutor ou animal"
          value={query}
          onChange={(event) => setQuery(event.currentTarget.value)}
          mb="md"
          maw={320}
        />

        {tab === 'tutores' ? (
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
              {filtered.map((tutor) => (
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
        ) : (
          <Text c="dimmed" ta="center" py="xl">Em breve.</Text>
        )}
      </Paper>
    </>
  );
}
