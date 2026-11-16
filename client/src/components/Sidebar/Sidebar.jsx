import { useLocation, useNavigate } from 'react-router';
import { 
  IconLayoutDashboard, 
  IconCalendar, 
  IconPaw, 
  IconLogout, 
  IconUser,
  IconUsers
} from '@tabler/icons-react';
import { Group, Text, Stack } from '@mantine/core';
import { useAuth } from '../../context/AuthContext';
import classes from './Sidebar.module.css';

// Mapeamento de rotas e permissões por perfil (RBAC)
const navigationData = [
  { 
    link: '/dashboard', 
    label: 'Dashboard', 
    icon: IconLayoutDashboard, 
    roles: ['administracao'] 
  },
  { 
    link: '/agenda', 
    label: 'Agenda Clínica', 
    icon: IconCalendar, 
    roles: ['veterinario', 'administracao', 'recepcao'] 
  },
  { 
    link: '/animais', 
    label: 'Pacientes & Animais', 
    icon: IconPaw, 
    roles: ['administracao', 'recepcao', 'veterinario'] 
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
            <Text size="xs" c="black" style={{ textTransform: 'capitalize' }}>
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