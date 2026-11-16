import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Table, Paper, TextInput, Badge, Text, Button } from '@mantine/core';
import { pb } from '../../pocketbase';
import { PageHeader } from '../../components/PageHeader/PageHeader';

const thStyle = { fontSize: 13, fontWeight: 700, color: 'var(--vc-muted)' };

const roleLabels = {
  administracao: 'Administrador',
  veterinario: 'Médico veterinário',
  recepcao: 'Recepcionista',
};

export function Usuarios() {
  const [query, setQuery] = useState('');

  const { data: users = [], isLoading, isError } = useQuery({
    queryKey: ['users'],
    queryFn: () => pb.collection('users').getFullList({ sort: 'name' }),
  });

  const filtered = users.filter((user) =>
    `${user.name} ${user.id} ${user.role}`.toLowerCase().includes(query.toLowerCase())
  );

  return (
    <>
      <PageHeader
        title="Usuários"
        actionLabel="Novo usuário"
        onAction={() => alert('Cadastro de usuário (em breve).')}
      />

      <Paper withBorder p="lg">
        <TextInput
          placeholder="Buscar usuário"
          value={query}
          onChange={(event) => setQuery(event.currentTarget.value)}
          mb="md"
          maw={320}
        />

        {isError ? (
          <Text c="red" ta="center" py="md">
            Não foi possível carregar os usuários.
          </Text>
        ) : (
          <Table verticalSpacing="sm" highlightOnHover>
            <Table.Thead>
              <Table.Tr>
                <Table.Th style={thStyle}>Usuário</Table.Th>
                <Table.Th style={thStyle}>Id</Table.Th>
                <Table.Th style={thStyle}>Permissão</Table.Th>
                <Table.Th />
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {filtered.map((user) => (
                <Table.Tr key={user.id}>
                  <Table.Td fw={500}>{user.name || user.username}</Table.Td>
                  <Table.Td><Text size="xs" c="dimmed">{user.id}</Text></Table.Td>
                  <Table.Td>
                    <Badge variant="light">
                      {roleLabels[user.role] || user.role || '—'}
                    </Badge>
                  </Table.Td>
                  <Table.Td>
                    <Button size="xs" variant="default" onClick={() => alert(`Editar ${user.name} (em breve).`)}>
                      Editar
                    </Button>
                  </Table.Td>
                </Table.Tr>
              ))}
            </Table.Tbody>
          </Table>
        )}

        {!isLoading && !isError && filtered.length === 0 && (
          <Text c="dimmed" ta="center" py="md">Nenhum usuário encontrado.</Text>
        )}
      </Paper>
    </>
  );
}
