import {
  Button,
  Paper,
  PasswordInput,
  TextInput,
  Title,
} from '@mantine/core';
import { useForm, isNotEmpty, isEmail } from '@mantine/form';
import classes from './Login.module.css';
import { useNavigate } from 'react-router';
import { useMutation } from '@tanstack/react-query';
import { pb } from '../../pocketbase';

export function Login() {
  const navigate = useNavigate();

  const form = useForm({
    initialValues: {
      email: '',
      password: '',
    },
    validate: {
      email: isEmail('Digite um email válido'),
      password: isNotEmpty('Digite uma senha'),
    },
  });

  const loginMutation = useMutation({
    mutationFn: async ({ email, password }) => {
      return await pb.collection('users').authWithPassword(email, password);
    },
    onSuccess: (data) => {
      const role = data.record.role;
      
      if (role === 'administracao') navigate('/dashboard');
      else if (role === 'veterinario') navigate('/agenda');
      else navigate('/animais');
    },
    onError: (error) => {
      alert('As credenciais estão incorretas: ' + error.message);
    }
  });

  const handleSubmit = (values) => {
    loginMutation.mutate(values);
  };

  return (
    <div className={classes.wrapper}>
      <Paper className={classes.form}>
        <Title order={2} className={classes.title}>
          Bem Vindo ao Vetcare!
        </Title>

        <Paper withBorder shadow="md" p={30} mt={30} radius="md">
          <form onSubmit={form.onSubmit(handleSubmit)}>
            <TextInput
              label="Email"
              placeholder="fulano@vetcare.com"
              required
              {...form.getInputProps('email')}
            />
            <PasswordInput
              label="Senha"
              placeholder="Sua senha"
              required
              mt="md"
              {...form.getInputProps('password')}
            />
            <Button 
              fullWidth 
              mt="xl" 
              type="submit" 
              loading={loginMutation.isPending}
            >
              Entrar
            </Button>
          </form>
        </Paper>
      </Paper>
    </div>
  );
}