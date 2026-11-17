# 🩺 Projeto Vetcare

## 💻 Como Executar o Projeto

Siga os passos abaixo para configurar e executar o ambiente de desenvolvimento localmente.

### 📋 Pré-requisitos

* [Node.js](https://nodejs.org/) (22.12 ou superior; validado com Node 24)
* [npm](https://www.npmjs.com/) (gerenciador de pacotes oficial do projeto)
* Executável do [PocketBase](https://pocketbase.io/docs/) para o seu sistema operacional

---

### 🔧 Passo a Passo

1. **Clonar o repositório e acessar a pasta:**

```
git clone <url_do_repositorio>
cd Projeto-Vetcare
```

2. **Instalar as dependências do Frontend:**

```
cd client
```

```
npm install
```

3. **Configurar variáveis de ambiente do Frontend:**

Ainda na pasta `client`, crie uma cópia do arquivo `.env.example` renomeando-o para `.env`:

* Linux / macOS:

```
cp .env.example .env
```

* Windows:

```
copy .env.example .env
```

4. **Configurar o PocketBase (Backend local):**

* Baixe a versão correspondente ao seu SO no site do [PocketBase](https://pocketbase.io/docs/)
* Extraia o executável (pocketbase ou pocketbase.exe) na pasta 'server' do projeto.

5. **Iniciar o banco de dados e API em um terminal na raiz do projeto:**

* Linux / macOS:

```
cd server
```

```
./pocketbase serve
```

* Windows:

```
cd server
```

```
.\pocketbase.exe serve
```

* O painel administrativo estará disponível em http://127.0.0.1:8090/_/.

6. **Iniciar a aplicação React em outro terminal:**

Na raiz do projeto, entre em `client` e execute os comandos abaixo. Abra a URL informada pelo Vite.

```
cd client
npm run dev
```

## Integração com PocketBase

O frontend usa `VITE_POCKETBASE_URL` (padrão local: `http://127.0.0.1:8090`). O PocketBase aplica automaticamente as migrações pendentes ao executar `serve`. Reinicie um servidor já aberto depois de atualizar o projeto.

A migração `1794820000_integrate_clinic.js` adiciona as coleções `tutors`, `animals`, `appointments`, `medical_records`, `vaccinations`, `prescriptions` e `payments`, seus relacionamentos, validações e regras de acesso. Os veterinários são contas da coleção `users` com perfil `veterinario`; os campos `phone` e `specialty` pertencem a essas contas. Nenhum dado fictício das telas é importado para o banco.

A migração também preenche **somente perfis vazios das três contas do seed histórico**, pois aquele seed foi executado antes da criação do campo `role`. Nomes, senhas, IDs e perfis já preenchidos são preservados. Usuários antigos sem perfil devem receber um dos três perfis válidos pelo administrador. A migração é aditiva e não inclui reversão destrutiva das coleções.

A migração `1794830000_req04_tutor_fields.js` (REQ 04) completa a coleção `tutors` com `cpf` (obrigatório e único), `email` e `address`, e torna `phone` obrigatório. CPF e telefone são gravados somente com dígitos. A migração é aditiva: tutores já existentes são preservados e só têm o telefone convertido para dígitos. O CPF deles passa a ser exigido na próxima edição.

A migração `1794840000_req05_animal_sex.js` (REQ 05) adiciona à coleção `animals` o sexo (Macho ou Fêmea), que passa a ser obrigatório. Animais já cadastrados são preservados e só precisam informar o sexo na próxima edição.

A migração `1794850000_req06_veterinarian_fields.js` (REQ 06) acrescenta às contas da coleção `users` o CRMV (único, no formato `CRMV-UF número`) e passa a gravar telefones somente com dígitos. Ela também restringe a regra de edição: o veterinário altera apenas a própria conta e não muda o CRMV.

Os hooks em `server/pb_hooks` validam datas de calendário e a previsão da próxima dose. Para tutores, eles normalizam os dados e verificam os dígitos do CPF, o formato do telefone (DDD + número) e a duplicidade do CPF. Para animais, eles normalizam nome, espécie e raça e recusam data de nascimento futura. Para veterinários, eles normalizam o CRMV (por exemplo, `ba 01234` vira `CRMV-BA 1234`) e verificam a UF, a duplicidade e o telefone. Inicie o executável dentro de `server` para carregar tanto os hooks quanto as migrações.

### Fluxos disponíveis

- **Usuários:** administrador consulta, cria, edita e exclui; a própria conta não pode ser excluída. Alterações de perfil são verificadas no backend. A edição sem senha mantém a senha anterior.
- **Tutores (REQ 04):** em Registros → Tutores é possível cadastrar, consultar (busca por nome, CPF, telefone, e-mail ou animal), editar e excluir. O formulário aplica máscara de CPF e telefone e valida os dados antes de enviar. Pelo `docs/RBAC.md`, os três perfis cadastram e editam, mas só administração e recepção excluem. Um tutor com animais ou pagamentos vinculados não pode ser excluído: o sistema avisa e mantém o registro.
- **Animais (REQ 05):** em Registros → Animais é possível cadastrar, consultar (busca por nome, espécie, raça, sexo ou tutor), editar e excluir. O cadastro exige tutor, nome, espécie e sexo. Raça e data de nascimento são opcionais, e a data não pode ser futura. Pelo `docs/RBAC.md`, os três perfis cadastram e editam, mas só administração e recepção excluem. Um animal com consultas ou registros clínicos não pode ser excluído; a janela de exclusão oferece **Inativar**, que tira o animal do agendamento e preserva o histórico (ADR-005).
- **Veterinários (REQ 06):** em Registros → Veterinários a administração cadastra o veterinário já com a conta de acesso (nome, e-mail, senha inicial, CRMV, especialidade e telefone), consulta (busca por nome, e-mail, CRMV ou especialidade), edita e exclui. O CRMV é obrigatório no formulário. A recepção apenas consulta. Pelo backend, o veterinário pode alterar o próprio nome, especialidade e telefone, mas não o CRMV nem os dados de outros veterinários. Um veterinário com consultas ou registros clínicos não pode ser excluído. E-mail, senha e perfil continuam sendo alterados na tela de Usuários.
- **Registros:** tutores, animais e pagamentos são persistidos. Cadastre primeiro o tutor e depois o animal.
- **Agenda:** veterinários e animais vêm do banco; consultas são associadas a ambos. Agendamento e cancelamento persistem, inclusive após recarga. Um índice único impede duas consultas ativas no mesmo horário e veterinário. As faixas de 09h a 17h foram mantidas da interface existente.
- **Prontuários:** a ficha corresponde ao animal cadastrado. Atendimentos, vacinas e prescrições são consultados e gravados no PocketBase. A escrita clínica é exclusiva do perfil veterinário; as demais permissões seguem `docs/RBAC.md`.
- **Financeiro:** a receita e os valores pendentes usam pagamentos do mês selecionado; consultas realizadas correspondem aos atendimentos registrados nesse mês. Os valores são armazenados em centavos. As semanas do gráfico representam os dias 1–7, 8–14 e assim por diante. O relatório baixa um CSV com os dados reais do período.
- **Autenticação:** a sessão é revalidada no servidor ao abrir rotas protegidas. Logout e troca de usuário/perfil limpam os dados de consulta em memória. A recuperação de senha usa o e-mail preenchido na tela; a entrega exige configuração de e-mail/SMTP no PocketBase.

### Verificações

Na pasta `client`:

```sh
npm run lint
npm run build
npm test
```

Os testes iniciam um PocketBase real em porta dinâmica com banco temporário, aplicam as migrações e verificam CRUD, relações, permissões, validações, conflito de agenda, sessão, indicadores e persistência após reinício. Eles não alteram `server/pb_data`. O executável deve existir em `server`, ou seu caminho pode ser informado pela variável `POCKETBASE_BIN`.

Para conferir na interface, acesse com cada perfil, cadastre um tutor e um animal, agende e cancele uma consulta, registre atendimento/vacina/prescrição como veterinário e registre um pagamento como recepção ou administrador. Recarregue as páginas e confira os mesmos registros e os indicadores do mês. As credenciais locais iniciais estão no seed de desenvolvimento em `server/pb_migrations/1790280115_seed_users.js`.
