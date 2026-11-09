import { createBrowserRouter, RouterProvider } from 'react-router-dom';
import { Login } from './pages/Login/Login'; 
import { requireRole, guestLoader } from './utils/authLoaders';

const AdminDash = () => <h1>Dashboard Financeiro (Admin)</h1>;
const VetAgenda = () => <h1>A Minha Agenda (Veterinário)</h1>;
const ListaAnimais = () => <h1>Gestão de Animais (Partilhado)</h1>;

const router = createBrowserRouter([
  {
    path: "/login",
    element: <Login />,
    loader: guestLoader, 
  },
  {
    path: "/dashboard",
    element: <AdminDash />,
    loader: requireRole(['administracao']), 
  },
  {
    path: "/agenda",
    element: <VetAgenda />,
    loader: requireRole(['veterinario']), 
  },
  {
    path: "/animais",
    element: <ListaAnimais />,
    loader: requireRole(['administracao', 'recepcao', 'veterinario']), 
  }
]);

export default function App() {
  return <RouterProvider router={router} />;
}