import { AppShell } from '@mantine/core';
import { Outlet } from 'react-router';
import { Sidebar } from '../Sidebar/Sidebar';

export function MainLayout() {
  return (
    <AppShell
      navbar={{ width: 300, breakpoint: 'sm' }}
      padding="md"
    >
      <AppShell.Navbar>
        <Sidebar />
      </AppShell.Navbar>

      <AppShell.Main>
        <Outlet />
      </AppShell.Main>
    </AppShell>
  );
}