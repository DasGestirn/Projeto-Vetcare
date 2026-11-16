import {
  Anchor,
  Alert,
  Button,
  PasswordInput,
  Text,
  TextInput,
  Title,
} from '@mantine/core';
import { useForm, isNotEmpty, isEmail } from '@mantine/form';
import { useNavigate } from 'react-router';
import { useMutation } from '@tanstack/react-query';
import { authService } from '../../services/authService.js';
import { getRoleHomePath } from '../../utils/roles.js';
import { getErrorMessage } from '../../utils/pocketbaseErrors.js';
import classes from './Login.module.css';
import { pb } from '../../pocketbase.js';
import { useRef } from 'react';

export function Login() {
  const navigate = useNavigate();
  const loginLock = useRef(false);

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
    mutationFn: authService.login,
    onSuccess: (data) => {
      navigate(getRoleHomePath(data.record.role), { replace: true });
    },
  });
  const resetMutation = useMutation({
    mutationFn: (email) => pb.collection('users').requestPasswordReset(email.trim()),
  });
  const requestReset = (event) => {
    event.preventDefault();
    if (resetMutation.isPending || loginMutation.isPending) return;
    if (form.validateField('email').hasError) return;
    resetMutation.mutate(form.values.email);
  };

  const handleSubmit = async (values) => {
    if (loginLock.current || resetMutation.isPending) return;
    loginLock.current = true;
    try { await loginMutation.mutateAsync(values); }
    catch { /* O erro é exibido no formulário. */ }
    finally { loginLock.current = false; }
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

          <form onSubmit={(event) => form.onSubmit(handleSubmit)(event)}>
            {loginMutation.isError && (
              <Alert color="red" mb="md" role="alert">
                {getErrorMessage(loginMutation.error, 'E-mail ou senha incorretos.')}
              </Alert>
            )}
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
              fullWidth
              mt="xl"
              type="submit"
              loading={loginMutation.isPending}
            >
              Entrar
            </Button>
          </form>
          {resetMutation.isSuccess && <Alert color="teal" mt="md" role="status">Se o e-mail estiver cadastrado, você receberá as instruções para redefinir a senha.</Alert>}
          {resetMutation.isError && <Alert color="red" mt="md" role="alert">{getErrorMessage(resetMutation.error, 'Não foi possível solicitar a recuperação de senha.')}</Alert>}

          <Anchor
            href="#esqueci-senha"
            className={classes.forgotLink}
            onClick={requestReset}
            aria-disabled={resetMutation.isPending || loginMutation.isPending}
          >
            Esqueci minha senha
          </Anchor>
        </div>
      </div>
    </div>
  );
}
