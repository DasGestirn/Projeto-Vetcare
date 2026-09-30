import {
  Button,
  Paper,
  PasswordInput,
  TextInput,
  Title,
} from '@mantine/core';
import { useForm, isNotEmpty, isEmail} from '@mantine/form';
import classes from './Login.module.css';

export function Login() {

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

  return (
    <div className={classes.wrapper}>
      <Paper className={classes.form}>
        <Title order={2} className={classes.title}>
          Bem Vindo ao Vetcare!
        </Title>

         <Paper withBorder shadow="md" p={30} mt={30} radius="md">
        <form onSubmit={form.onSubmit((values) => console.log(values))}>
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
          <Button fullWidth mt="xl" type="submit">
            Entrar
          </Button>
        </form>
      </Paper>

      </Paper>
    </div>
  );
}