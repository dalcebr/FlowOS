# Changelog

## 5.1.0

### Interface
- Novo gerenciador de janelas estilo desktop.
- Janelas independentes para cada ferramenta.
- Minimizar, maximizar e fechar.
- Arrastar e redimensionar no desktop.
- Barra de tarefas persistente.
- Layout adaptativo para telas pequenas.
- Atalhos Alt+Tab e Ctrl/⌘+Alt+T.

### Correções
- Navegação entre ferramentas não destrói mais as outras janelas abertas.
- Arquivos abertos no Explorador agora levam corretamente ao Editor.
- Atualizações de arquivos e Git respeitam a janela atualmente ativa.
- Terminal rápido duplicado foi removido em favor de uma única janela de Terminal.
- Badge do Git foi corrigido.
- Push Git agora tenta configurar automaticamente o upstream quando o repositório tem `origin` e ainda não possui upstream.
- Editor pergunta antes de fechar com arquivos não salvos.

### Manutenção
- Versão atualizada para 5.1.0.
- README atualizado com a nova experiência de desktop.
