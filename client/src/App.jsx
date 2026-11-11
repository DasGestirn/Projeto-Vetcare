import { createBrowserRouter, redirect, RouterProvider } from 'react-router';
import { Login } from './pages/Login/Login';
import { AdminDashboard } from './pages/AdminDashboard/AdminDashboard'
import { VetSchedule } from './pages/VetSchedule/VetSchedule'; 
import { PetList } from './pages/PetList/PetList';
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
        path: "/dashboard",
        element: <AdminDashboard />,
        loader: requireRole(['administracao']), 
      },
      {
        path: "/agenda",
        element: <VetSchedule />,
        loader: requireRole(['veterinario']), 
      },
      {
        path: "/animais",
        element: <PetList />,
        loader: requireRole(['administracao', 'recepcao', 'veterinario']), 
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