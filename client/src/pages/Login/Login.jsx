import {
  Anchor,
  Button,
  PasswordInput,
  Text,
  TextInput,
  Title,
} from '@mantine/core';
import { useForm, isNotEmpty, isEmail } from '@mantine/form';
import { useNavigate } from 'react-router';
import { useMutation } from '@tanstack/react-query';
import { pb } from '../../pocketbase';
import classes from './Login.module.css';

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
    },
  });

  const handleSubmit = (values) => {
    loginMutation.mutate(values);
  };

  return (
    <div className={classes.wrapper}>
      <div className={classes.brandSection}>
        <Title order={1} className={classes.brandTitle}>
          VetCare
        </Title>
        <Text className={classes.brandSubtitle}>
          Todos os nossos serviços em um só lugar.
        </Text>
      </div>

      <div className={classes.formSection}>
        <div className={classes.formContainer}>
          <Title order={2} className={classes.title}>
            Entrar
          </Title>

          <form onSubmit={form.onSubmit(handleSubmit)}>
            <TextInput
              label="E-mail"
              placeholder="voce@clinica.com"
              radius="md"
              size="md"
              {...form.getInputProps('email')}
            />

            <PasswordInput
              label="Senha"
              placeholder="••••••••"
              radius="md"
              size="md"
              mt="md"
              {...form.getInputProps('password')}
            />

            <Button
              color="#11766d"
              radius="md"
              size="md"
              fullWidth
              mt="xl"
              type="submit"
              loading={loginMutation.isPending}
            >
              Entrar
            </Button>
          </form>

          <Anchor
            href="#esqueci-senha"
            className={classes.forgotLink}
            onClick={(event) => event.preventDefault()}
          >
            Esqueci minha senha
          </Anchor>
        </div>
      </div>
    </div>
  );
}