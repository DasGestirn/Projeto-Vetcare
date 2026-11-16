import { createBrowserRouter, redirect, RouterProvider } from 'react-router';
import { Login } from './pages/Login/Login';
import { VetSchedule } from './pages/VetSchedule/VetSchedule';
import { PetList } from './pages/PetList/PetList';
import { Registros } from './pages/Registros/Registros';
import { Financeiro } from './pages/Financeiro/Financeiro';
import { Usuarios } from './pages/Usuarios/Usuarios';
import { MainLayout } from './components/Layout/MainLayout';
import { requireRole, guestLoader } from './utils/authLoaders';

const router = createBrowserRouter([
  {
    path: "/",
    loader: () => redirect("/login"),
  },
  {
    path: "/login",
    element: <Login />, 
    loader: guestLoader, 
  },
  {
    element: <MainLayout />,
    children: [
      {
        path: "/agenda",
        element: <VetSchedule />,
        loader: requireRole(['veterinario', 'recepcao']),
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
        element: <Usuarios />,
        loader: requireRole(['administracao']),
      },
    ],
  },
  {
    path: "*",
    loader: () => redirect("/login"),
  }
]);

export default function App() {
  return <RouterProvider router={router} />;
}