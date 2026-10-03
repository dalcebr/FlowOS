# FlowOS 5.1

FlowOS é um ambiente de desenvolvimento visual e leve para rodar dentro do Termux. A ideia é transformar o Android em um pequeno computador de programação sem esconder o poder do Linux: tarefas comuns são visuais e o terminal continua disponível quando você precisar dele.

## O que há nesta versão

- **Desktop responsivo**: funciona em celular e computador.
- **Gerenciador de janelas**: cada ferramenta abre em sua própria janela.
- **Minimizar / maximizar / fechar** janelas.
- **Arrastar e redimensionar** janelas no desktop.
- **Barra de tarefas** para alternar entre ferramentas abertas.
- **Alt + Tab** para alternar janelas.
- **Ctrl/⌘ + Alt + T** para abrir o terminal.
- **Projetos** com abertura visual de pastas.
- **Explorador de arquivos** sem depender de caminhos para tarefas básicas.
- **Editor de código** com abas, números de linha, indentação, salvamento e Ctrl/⌘+S.
- **Markdown** com edição e preview.
- **Git/GitHub** com clone, init, stage, unstage, commit, pull e push.
- **Terminal real do Termux**.
- **Processos** e encerramento de processos.
- **Status do sistema** com CPU, memória, disco, Node, shell e rede.
- **Tema claro/escuro**.
- Backend pequeno, sem framework pesado no frontend.

## Arquitetura

```text
Android
  │
  └── Termux
       │
       ├── Node.js
       ├── Git
       ├── Python / Clang / Make
       │
       └── FlowOS
            ├── Desktop responsivo
            ├── Window Manager
            ├── Editor
            ├── Markdown
            ├── Files
            ├── GitHub
            └── Terminal real
```

## Instalação no Termux

```bash
pkg update && pkg upgrade -y
pkg install git nodejs-lts python make clang openssh unzip -y
pkg install ripgrep jq tree -y
termux-setup-storage
```

Depois clone seu repositório:

```bash
git clone https://github.com/SEU-USUARIO/FlowOS.git
cd FlowOS
cp .env.example .env
nano .env
npm install
npm start
```

Abra no navegador:

```text
http://127.0.0.1:3000
```

## Configuração

No `.env`:

```env
PORT=3000
FLOW_USER=flow
FLOW_PASS=troque-esta-senha
```

Não publique `.env`. O arquivo já está no `.gitignore`.

## GitHub

Dentro do FlowOS, abra **Ajustes → Git / GitHub** e configure:

- nome do Git;
- email;
- token do GitHub.

Depois abra um projeto, entre em **Git / GitHub** e use o fluxo visual:

```text
Alterações
   ↓
Stage
   ↓
Commit
   ↓
Push
```

Para um projeto novo, use **Inicializar Git** e depois configure o remoto do GitHub.

## Filosofia

FlowOS não tenta substituir o Termux. Ele coloca uma camada visual simples em cima dele.

Quando você quiser fazer algo normal:

> clique.

Quando precisar de algo avançado:

> abra o terminal.

Isso mantém o projeto pequeno, rápido e útil em aparelhos modestos.
