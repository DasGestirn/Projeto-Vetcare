import { useLocation, useNavigate } from 'react-router';
import {
  IconCalendar,
  IconPaw,
  IconClipboardList,
  IconReportMoney,
  IconUsers,
  IconLogout,
  IconUser
} from '@tabler/icons-react';
import { Group, Text, Stack } from '@mantine/core';
import { useAuth } from '../../context/AuthContext';
import classes from './Sidebar.module.css';

// Mapeamento de rotas e permissões por perfil (RBAC), conforme regra do protótipo:
// recepcao -> Agenda + Registros | veterinario -> Agenda + Prontuários (Animais) | administracao -> Registros + Financeiro + Usuários
const navigationData = [
  {
    link: '/agenda',
    label: 'Agenda Clínica',
    icon: IconCalendar,
    roles: ['veterinario', 'recepcao']
  },
  {
    link: '/animais',
    label: 'Prontuários',
    icon: IconPaw,
    roles: ['veterinario']
  },
  {
    link: '/registros',
    label: 'Registros',
    icon: IconClipboardList,
    roles: ['administracao', 'recepcao']
  },
  {
    link: '/financeiro',
    label: 'Financeiro',
    icon: IconReportMoney,
    roles: ['administracao']
  },
  { 
    link: '/usuarios', 
    label: 'Usuários', 
    icon: IconUsers, 
    roles: ['administracao'] 
  },
];

export function Sidebar() {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  // Filtra as opções de menu exibidas de acordo com a role do usuário logado
  const filteredLinks = navigationData.filter((item) =>
    item.roles.includes(user?.role)
  );

  const links = filteredLinks.map((item) => {
    const isActive = location.pathname === item.link;

    return (
      <a
        className={classes.link}
        data-active={isActive || undefined}
        href={item.link}
        key={item.label}
        onClick={(event) => {
          event.preventDefault();
          navigate(item.link);
        }}
      >
        <item.icon className={classes.linkIcon} stroke={1.5} />
        <span>{item.label}</span>
      </a>
    );
  });

  return (
    <nav className={classes.navbar}>
      <div className={classes.navbarMain}>
        <Group className={classes.header} justify="space-between">
          <Text fw={700} size="lg" c="white">
            VetCare
          </Text>
        </Group>
        {links}
      </div>

      <div className={classes.footer}>
        {/* Identificação do usuário logado */}
        <div className={classes.link} style={{ cursor: 'default' }}>
          <IconUser className={classes.linkIcon} stroke={1.5} />
          <Stack gap={0}>
            <Text size="sm" fw={500} c="white">
              {user?.name || 'Usuário'}
            </Text>
            <Text size="xs" c="#cfe6e0" style={{ textTransform: 'capitalize' }}>
              {user?.role}
            </Text>
          </Stack>
        </div>

        <a
          href="#logout"
          className={classes.link}
          onClick={(event) => {
            event.preventDefault();
            logout();
          }}
        >
          <IconLogout className={classes.linkIcon} stroke={1.5} />
          <span>Sair</span>
        </a>
      </div>
    </nav>
  );
}