import { useState } from 'react';
import {
  Table, TextInput, Button, Paper, Text, Badge, Avatar,
  Tabs, Grid, Stack, Group,
} from '@mantine/core';
import { PageHeader } from '../../components/PageHeader/PageHeader';

const animals = [
  { name: 'Thor', species: 'Cão', breed: 'Labrador', age: '4 anos', tutor: 'Marina Souza' },
  { name: 'Mel', species: 'Gata', breed: 'SRD', age: '2 anos', tutor: 'Juliana Lombroso' },
  { name: 'Bidu', species: 'Cão', breed: 'Poodle', age: '7 anos', tutor: 'Ana Prado' },
  { name: 'Pipoca', species: 'Cão', breed: 'Shih Tzu', age: '3 anos', tutor: 'Anderson Simas' },
];

const thStyle = { fontSize: 13, fontWeight: 700, color: 'var(--vc-muted)' };

function AnimalDetail({ animal, onBack }) {
  const [tab, setTab] = useState('historico');

  return (
    <>
      <PageHeader
        title="Prontuário"
        actionLabel="Registrar Atendimento"
        onAction={() => alert('Registrar atendimento (em breve).')}
      />

      <Button variant="subtle" onClick={onBack} mb="md" px={0}>
        Voltar para todos os prontuários
      </Button>

      <Grid>
        <Grid.Col span={{ base: 12, md: 8 }}>
          <Stack>
            <Paper withBorder p="lg">
              <Group>
                <Avatar radius="xl" size="lg">{animal.name[0]}</Avatar>
                <div style={{ flex: 1 }}>
                  <Text fw={700} size="lg">{animal.name}</Text>
                  <Text size="sm" c="dimmed">
                    {animal.species} · {animal.breed} · {animal.age} · Tutor: {animal.tutor}
                  </Text>
                </div>
                <Badge>Ativo</Badge>
              </Group>
            </Paper>

            <Tabs value={tab} onChange={setTab}>
              <Tabs.List>
                <Tabs.Tab value="historico">Histórico</Tabs.Tab>
                <Tabs.Tab value="vacinas">Vacinas</Tabs.Tab>
                <Tabs.Tab value="prescricoes">Prescrições</Tabs.Tab>
              </Tabs.List>

              <Tabs.Panel value="historico" pt="md">
                <Stack>
                  <Paper withBorder p="lg">
                    <Group justify="space-between">
                      <Text fw={700}>Consulta de rotina</Text>
                      <Text size="xs" c="dimmed">06/10/2026</Text>
                    </Group>
                    <Text size="sm" mt="xs">
                      Exame físico sem alterações. Peso estável. Retorno em 30 dias.
                    </Text>
                  </Paper>
                  <Paper withBorder p="lg">
                    <Group justify="space-between">
                      <Text fw={700}>Dermatite</Text>
                      <Text size="xs" c="dimmed">12/05/2026</Text>
                    </Group>
                    <Text size="sm" mt="xs">
                      Prescrito tratamento tópico por 10 dias. Evolução favorável.
                    </Text>
                  </Paper>
                </Stack>
              </Tabs.Panel>

              <Tabs.Panel value="vacinas" pt="md">
                <Paper withBorder p="lg">
                  <Text fw={700} mb="xs">Vacinas</Text>
                  <Text size="sm">V10 · Próxima: 12/11</Text>
                  <Text size="sm">Antirrábica · Próxima: 03/2027</Text>
                </Paper>
              </Tabs.Panel>

              <Tabs.Panel value="prescricoes" pt="md">
                <Paper withBorder p="lg">
                  <Text fw={700} mb="xs">Prescrições</Text>
                  <Text size="sm" c="dimmed">Nenhuma prescrição ativa.</Text>
                </Paper>
              </Tabs.Panel>
            </Tabs>
          </Stack>
        </Grid.Col>

        <Grid.Col span={{ base: 12, md: 4 }}>
          <Stack>
            <Paper withBorder p="lg">
              <Text fw={700} mb="xs">Vacinas</Text>
              <Group justify="space-between">
                <Text size="sm">V10</Text>
                <Text size="xs" c="dimmed">Próxima: 12/11</Text>
              </Group>
              <Group justify="space-between" mb="sm">
                <Text size="sm">Antirrábica</Text>
                <Text size="xs" c="dimmed">Próxima: 03/2027</Text>
              </Group>
              <Button fullWidth mb="xs" onClick={() => alert('Registrar vacina (em breve).')}>
                Registrar vacina
              </Button>
              <Button fullWidth variant="default">Editar vacina</Button>
            </Paper>

            <Paper withBorder p="lg">
              <Text fw={700} mb="xs">Prescrições</Text>
              <Text size="sm" c="dimmed" mb="sm">Nenhuma prescrição ativa.</Text>
              <Button fullWidth mb="xs" onClick={() => alert('Emitir prescrição (em breve).')}>
                Emitir prescrição
              </Button>
              <Button fullWidth variant="default">Editar prescrição</Button>
            </Paper>
          </Stack>
        </Grid.Col>
      </Grid>
    </>
  );
}

export function PetList() {
  const [query, setQuery] = useState('');
  const [selected, setSelected] = useState(null);

  if (selected) {
    return <AnimalDetail animal={selected} onBack={() => setSelected(null)} />;
  }

  const filtered = animals.filter((animal) =>
    Object.values(animal).join(' ').toLowerCase().includes(query.toLowerCase())
  );

  return (
    <>
      <PageHeader
        title="Prontuários"
        actionLabel="Novo prontuário"
        onAction={() => alert('Novo prontuário (em breve).')}
      />

      <Paper withBorder p="lg">
        <TextInput
          placeholder="Buscar prontuário"
          value={query}
          onChange={(event) => setQuery(event.currentTarget.value)}
          mb="md"
          maw={320}
        />

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
            {filtered.map((animal) => (
              <Table.Tr key={animal.name}>
                <Table.Td fw={500}>{animal.name}</Table.Td>
                <Table.Td>{animal.species}</Table.Td>
                <Table.Td>{animal.breed}</Table.Td>
                <Table.Td>{animal.age}</Table.Td>
                <Table.Td>{animal.tutor}</Table.Td>
                <Table.Td>
                  <Button size="xs" variant="default" onClick={() => setSelected(animal)}>
                    Visualizar
                  </Button>
                </Table.Td>
              </Table.Tr>
            ))}
          </Table.Tbody>
        </Table>
      </Paper>
    </>
  );
}
