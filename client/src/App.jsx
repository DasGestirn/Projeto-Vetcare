import { createBrowserRouter, redirect, RouterProvider } from 'react-router';
import { Center, Loader } from '@mantine/core';
import { Login } from './pages/Login/Login';
import { VetSchedule } from './pages/VetSchedule/VetSchedule';
import { PetList } from './pages/PetList/PetList';
import { Registros } from './pages/Registros/Registros';
import { Financeiro } from './pages/Financeiro/Financeiro';
import { MainLayout } from './components/Layout/MainLayout';
import { requireRole, guestLoader } from './utils/authLoaders';
import { Users } from './pages/Users/Users';
import { RouteError } from './components/RouteError';

function RouteLoading() {
  return <Center mih="100vh"><Loader /></Center>;
}

const router = createBrowserRouter([
  {
    path: "/",
    hydrateFallbackElement: <RouteLoading />,
    loader: () => redirect("/login"),
  },
  {
    path: "/login",
    hydrateFallbackElement: <RouteLoading />,
    element: <Login />, 
    errorElement: <RouteError />,
    loader: guestLoader, 
  },
  {
    element: <MainLayout />,
    hydrateFallbackElement: <RouteLoading />,
    errorElement: <RouteError />,
    children: [
      {
        path: "/dashboard",
        loader: () => redirect('/financeiro'),
      },
      {
        path: "/agenda",
        element: <VetSchedule />,
        loader: requireRole(['administracao', 'recepcao', 'veterinario']), 
      },
      {
        path: "/animais",
        element: <PetList />,
        loader: requireRole(['administracao', 'recepcao', 'veterinario']),
      },
      {
        path: "/registros",
        element: <Registros />,
        loader: requireRole(['administracao', 'recepcao']),
      },
      {
        path: "/financeiro",
        element: <Financeiro />,
        loader: requireRole(['administracao']),
      },
      {
        path: "/usuarios",
        element: <Users />,
        loader: requireRole(['administracao']),
      },
    ],
  },
  {
    path: "*",
    hydrateFallbackElement: <RouteLoading />,
    loader: () => redirect("/login"),
  }
]);

export default function App() {
  return <RouterProvider router={router} />;
}
