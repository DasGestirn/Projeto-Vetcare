import { useRef, useState } from 'react';
import { useNavigate } from 'react-router';
import {
  Title,
  Button,
  Group,
  Paper,
  TextInput,
  Table,
  Badge,
  Modal,
  Select,
  PasswordInput,
  Stack,
  Text,
  Alert,
  Loader,
  Center,
} from '@mantine/core';
import { IconSearch, IconPlus, IconAlertCircle } from '@tabler/icons-react';
import { useUsers } from '../../hooks/useUsers';
import { useAuth } from '../../context/AuthContext';
import { ROLE_OPTIONS, ROLE_LABELS, getRoleHomePath } from '../../utils/roles.js';
import { getErrorMessage } from '../../utils/pocketbaseErrors.js';
import { pb } from '../../pocketbase.js';

const INITIAL_FORM = {
  name: '',
  email: '',
  role: 'recepcao',
  password: '',
  passwordConfirm: '',
};

export function Users() {
  const { user: currentUser } = useAuth();
  const { users, searchTerm, setSearchTerm, loading, error, refetch, addUser, editUser, removeUser } = useUsers();
  const navigate = useNavigate();
  const operation = useRef(false);

  const [modalOpen, setModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [formData, setFormData] = useState(INITIAL_FORM);
  const [formError, setFormError] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [deletingId, setDeletingId] = useState(null);
  const [feedback, setFeedback] = useState(null);
  const [operationError, setOperationError] = useState(null);

  const openCreateModal = () => {
    setEditingUser(null);
    setFormData(INITIAL_FORM);
    setFormError(null);
    setModalOpen(true);
  };

  const openEditModal = (targetUser) => {
    setEditingUser(targetUser);
    setFormData({
      name: targetUser.name || '',
      email: targetUser.email || '',
      role: targetUser.role || 'recepcao',
      password: '',
      passwordConfirm: '',
    });
    setFormError(null);
    setModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (operation.current) return;
    operation.current = true;
    try {
      setSubmitting(true);
      setFormError(null);
      if (editingUser) {
        const saved = await editUser(editingUser.id, formData);
        if (saved.id === currentUser?.id) {
          if (formData.password) {
            pb.authStore.clear();
            navigate('/login', { replace: true });
          } else if (saved.role !== currentUser.role) {
            navigate(getRoleHomePath(saved.role), { replace: true });
          }
        }
      } else {
        await addUser(formData);
      }
      setModalOpen(false);
      setFormData(INITIAL_FORM);
      setFeedback(editingUser ? 'Usuário atualizado.' : 'Usuário cadastrado.');
    } catch (err) {
      setFormError(getErrorMessage(err, 'Não foi possível salvar o usuário.'));
    } finally {
      operation.current = false;
      setSubmitting(false);
    }
  };

  const handleDelete = async (targetUser) => {
    if (targetUser.id === currentUser?.id) return;
    if (operation.current) return;
    if (!window.confirm(`Deseja realmente excluir o usuário "${targetUser.name}"?`)) return;
    try {
      operation.current = true;
      setDeletingId(targetUser.id);
      setOperationError(null);
      await removeUser(targetUser.id);
      setFeedback('Usuário excluído.');
    } catch (err) {
      setOperationError(getErrorMessage(err, 'Erro ao excluir usuário.'));
    } finally {
      operation.current = false;
      setDeletingId(null);
    }
  };

  return (
    <Stack gap="lg" p="md">
      <Group justify="space-between" align="center">
        <Title order={2}>Usuários</Title>
        <Button
          leftSection={<IconPlus size={16} />}
          color="#11766d"
          onClick={openCreateModal}
          disabled={submitting || Boolean(deletingId)}
        >
          Novo usuário
        </Button>
      </Group>
      {feedback && <Alert color="teal" withCloseButton onClose={() => setFeedback(null)}>{feedback}</Alert>}
      {operationError && <Alert color="red" role="alert">{operationError}</Alert>}

      <Paper withBorder p="md" radius="md">
        <TextInput
          placeholder="Buscar usuário"
          leftSection={<IconSearch size={16} />}
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          mb="md"
          maw={320}
        />

        {error && (
          <Alert icon={<IconAlertCircle size={16} />} color="red" mb="md">
            {error}
            <Button variant="subtle" size="xs" onClick={() => refetch()}>Tentar novamente</Button>
          </Alert>
        )}

        {loading ? (
          <Center py="xl">
            <Loader color="#11766d" />
          </Center>
        ) : (
          <Table verticalSpacing="sm" highlightOnHover>
            <Table.Thead>
              <Table.Tr>
                <Table.Th>Usuário</Table.Th>
                <Table.Th>Id</Table.Th>
                <Table.Th>Permissão</Table.Th>
                <Table.Th style={{ textAlign: 'right' }}>Ações</Table.Th>
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {users.map((u) => (
                <Table.Tr key={u.id}>
                  <Table.Td>
                    <Text fw={500} size="sm">{u.name || 'Sem nome'}</Text>
                    <Text size="xs" c="dimmed">{u.email}</Text>
                  </Table.Td>
                  <Table.Td>
                    <Text size="xs" c="dimmed" ff="monospace">{u.id}</Text>
                  </Table.Td>
                  <Table.Td>
                    <Badge color="teal" variant="light">
                      {ROLE_LABELS[u.role] || u.role || 'Não definida'}
                    </Badge>
                  </Table.Td>
                  <Table.Td>
                    <Group gap="xs" justify="flex-end">
                      <Button variant="default" size="xs" disabled={submitting || Boolean(deletingId)} onClick={() => openEditModal(u)}>
                        Editar
                      </Button>
                      {u.id !== currentUser?.id && (
                        <Button
                          variant="light"
                          color="red"
                          size="xs"
                          onClick={() => handleDelete(u)}
                          loading={deletingId === u.id}
                          disabled={submitting || (Boolean(deletingId) && deletingId !== u.id)}
                        >
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
      </Paper>
      {!loading && !error && users.length === 0 && <Text c="dimmed" ta="center">Nenhum usuário encontrado.</Text>}

      <Modal
        opened={modalOpen}
        onClose={() => { if (!submitting) setModalOpen(false); }}
        closeOnClickOutside={!submitting}
        closeOnEscape={!submitting}
        withCloseButton={!submitting}
        title={editingUser ? 'Editar usuário' : 'Novo usuário'}
        centered
      >
        <form onSubmit={handleSubmit}>
          <Stack gap="sm">
            {formError && (
              <Alert icon={<IconAlertCircle size={16} />} color="red">
                {formError}
              </Alert>
            )}

            <TextInput
              label="Nome"
              placeholder="Nome completo"
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            />

            <TextInput
              label="E-mail"
              type="email"
              placeholder="usuario@vetcare.com"
              required
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            />

            <Select
              label="Permissão (Perfil)"
              data={ROLE_OPTIONS}
              required
              allowDeselect={false}
              value={formData.role}
              onChange={(value) => setFormData({ ...formData, role: value })}
            />

            <PasswordInput
              label="Senha"
              placeholder={editingUser ? 'Deixe em branco para manter a atual' : 'Mínimo 8 caracteres'}
              required={!editingUser}
              minLength={8}
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
            />

            <PasswordInput
              label="Confirmar senha"
              placeholder="Repita a senha"
              required={!editingUser || Boolean(formData.password)}
              minLength={8}
              value={formData.passwordConfirm}
              onChange={(e) => setFormData({ ...formData, passwordConfirm: e.target.value })}
            />

            <Group justify="flex-end" mt="md">
              <Button variant="default" disabled={submitting} onClick={() => setModalOpen(false)}>
                Cancelar
              </Button>
              <Button type="submit" color="#11766d" loading={submitting}>
                Salvar
              </Button>
            </Group>
          </Stack>
        </form>
      </Modal>
    </Stack>
  );
}
