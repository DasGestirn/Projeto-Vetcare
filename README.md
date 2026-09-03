# 🩺 Projeto Vetcare

## 💻 Como Executar o Projeto

Siga os passos abaixo para configurar e executar o ambiente de desenvolvimento localmente.

### 📋 Pré-requisitos

* [Node.js](https://nodejs.org/) (versão 18 ou superior)
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

3. **Configurar o PocketBase (Backend local):**

* Baixe a versão correspondente ao seu SO no site do [PocketBase](https://pocketbase.io/docs/)
* Extraia o executável (pocketbase ou pocketbase.exe) na raiz do projeto.

4. **Iniciar o banco de dados e API:**

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

5. **Iniciar a aplicação React:**

Digite o comando abaixo no terminal (na pasta client) e então vá até a URL que posteriormente aparecer.

```
npm run dev
```



