# ⚡ FlowOS 5

FlowOS é um ambiente de desenvolvimento **visual, leve e pensado para programar pelo celular usando Termux**.

A proposta não é transformar o Android em um desktop pesado. É oferecer as partes que realmente importam para quem programa:

- 📁 explorador visual de arquivos
- 🧠 editor de código com abas, linhas, indentação e salvamento
- 📝 editor/preview Markdown
- ⌘ fluxo Git parecido com GitHub Desktop
- ↓ clone de repositórios
- ✓ commit, pull e push
- ›_ terminal real do Termux
- ◈ status real de CPU, RAM, disco, Node e shell
- ⚙ configuração visual
- 📱 interface responsiva para tela pequena
- 🪶 apenas Express + dotenv + cookie-parser no backend

## Arquitetura

```text
FlowOS/
├── public/
│   ├── index.html       # interface
│   ├── style.css        # design responsivo
│   ├── app.js           # workspace, editor, Git, terminal
│   └── manifest.json
├── server.js            # API + terminal + filesystem + Git
├── package.json
├── .env.example
└── README.md
```

## Instalação limpa no Termux

> Recomenda-se instalar o Termux pelo F-Droid ou pela página oficial do projeto Termux. Evite misturar instalações antigas de fontes diferentes.

### 1. Atualize os pacotes

```bash
pkg update && pkg upgrade -y
```

### 2. Instale o ambiente

```bash
pkg install git nodejs-lts python make clang openssh unzip -y
```

Opcional, mas útil:

```bash
pkg install ripgrep jq tree -y
```

### 3. Dê acesso ao armazenamento do Android

```bash
termux-setup-storage
```

Aceite a permissão. Sua pasta compartilhada aparecerá normalmente em:

```text
~/storage/shared
```

### 4. Clone o FlowOS

```bash
cd ~
git clone https://github.com/SEU-USUARIO/FlowOS.git
cd FlowOS
```

### 5. Configure a senha

```bash
cp .env.example .env
nano .env
```

Troque:

```env
FLOW_USER=flow
FLOW_PASS=troque-esta-senha
PORT=3000
```

Você também pode editar com:

```bash
sed -i 's/torque-esta-senha/minha-senha/' .env
```

### 6. Instale e execute

```bash
npm install
npm start
```

Abra no navegador:

```text
http://127.0.0.1:3000
```

## Primeiro uso

### Criar um projeto

**Projetos → Novo projeto**

Não é necessário criar a pasta pelo terminal.

### Clonar do GitHub

**Projetos → Clonar GitHub**

Cole a URL do repositório. O FlowOS escolhe o nome da pasta automaticamente.

### Configurar GitHub

Abra:

**Ajustes → Git / GitHub**

Preencha:

- Nome do Git
- Email
- Token do GitHub

Depois abra um projeto e use:

**Controle de versão → Commit → Push**

O token fica armazenado no backend local do FlowOS e não é exibido na interface depois de salvo.

### Trabalhar no código

**Projetos → seu projeto → Editor**

O editor oferece:

- abas
- árvore de arquivos
- números de linha
- Tab para indentação
- Enter preservando indentação
- `Ctrl+S` / `⌘+S`
- salvamento visual
- identificação básica da linguagem

### Markdown

**Markdown**

O preview atualiza enquanto você escreve.

### Terminal

**Terminal**

O comando é executado pelo shell real detectado no Termux.

Também existe um terminal rápido no botão `⌘` do topo.

Exemplos:

```bash
node -v
python --version
git status
npm install
npm run dev
```

## GitHub: recomendação de autenticação

Para uso pessoal, prefira um **Personal Access Token (PAT)** do GitHub em vez de senha da conta.

Crie um token com apenas as permissões necessárias ao seu fluxo. Para repositórios privados, normalmente será necessária permissão de conteúdo do repositório.

Não coloque o token no código, no `.env` commitado ou em arquivos do projeto.

## Solução de problemas

### Porta ocupada

```bash
PORT=3001 npm start
```

Então abra:

```text
http://127.0.0.1:3001
```

### Node não encontrado

```bash
pkg install nodejs-lts -y
node -v
npm -v
```

### Git não encontrado

```bash
pkg install git -y
git --version
```

### Permissão de armazenamento

```bash
termux-setup-storage
ls ~/storage/shared
```

### `npm install` demora

Isso acontece principalmente na primeira instalação. O FlowOS em si possui poucas dependências.

## Atualizar o FlowOS

Dentro da pasta:

```bash
git pull
npm install
npm start
```

## Filosofia

O FlowOS foi desenhado para reduzir o número de decisões e comandos necessários.

**Ações comuns devem ser visuais.**

O terminal continua existindo porque um programador precisa dele, mas ele não deve ser obrigatório para criar pastas, abrir arquivos, editar Markdown, configurar Git ou fazer commit.

## Licença

MIT
