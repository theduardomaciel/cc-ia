# Sistema Expert - Agente Baseado em Conhecimento

Um sistema expert genérico implementado em JavaScript para construir aplicações baseadas em agentes de conhecimento, seguindo os moldes do Expert Sinta.

## 🎯 Funcionalidades

### 📚 Editor de Base de Conhecimento
- **Regras**: Adicione regras do tipo SE...ENTÃO
- **Fatos**: Gerencie fatos conhecidos
- **Interface visual**: CRUD completo para regras e fatos

### 🧠 Motor de Inferência
- **Encadeamento para Frente**: Deriva novos fatos a partir dos conhecidos
- **Encadeamento para Trás**: Verifica se um objetivo pode ser provado
- **Histórico**: Mantém registro de todas as inferências realizadas

### 💭 Sistema de Explanação
- **Por quê?**: Explica por que uma conclusão foi alcançada
- **Como?**: Mostra estratégias para alcançar um objetivo
- **Raciocínio**: Detalha os passos da inferência

### 🗣️ Interface de Linguagem Natural
- **Chat**: Converse com o sistema em português
- **Comandos naturais**: "Por que Tweety é ave?", "Como provar que algo é mamífero?"
- **Adição dinâmica**: "Se animal tem penas então animal é ave"

## 🚀 Tecnologias

- **Frontend**: JavaScript ES6+, HTML5, CSS3
- **Bundler**: Vite (desenvolvimento e build)
- **Styling**: TailwindCSS
- **Arquitetura**: Modular (separação de responsabilidades)

## 📁 Estrutura do Projeto

```
src/
├── main.js                          # Ponto de entrada principal
├── styles.css                       # Estilos Tailwind customizados
└── modules/
    ├── KnowledgeBase.js             # Gerenciamento de regras e fatos
    ├── InferenceEngine.js           # Motor de inferência
    ├── ExplanationSystem.js         # Sistema de explanação
    ├── NaturalLanguageInterface.js  # Interface de linguagem natural
    └── UIController.js              # Controlador da interface
```

## 🛠️ Instalação e Execução

### Pré-requisitos
- Node.js (versão 18 ou superior)
- npm ou yarn

### Passos

1. **Clone ou baixe o projeto**
   ```bash
   git clone <repositório>
   cd sistema-expert
   ```

2. **Instale as dependências**
   ```bash
   npm install
   ```

3. **Execute em modo desenvolvimento**
   ```bash
   npm run dev
   ```

4. **Acesse no navegador**
   ```
   http://localhost:5173
   ```

5. **Build para produção**
   ```bash
   npm run build
   ```

## 📋 Como Usar

### 1. Base de Conhecimento
- **Aba "Base de Conhecimento"**
- Adicione regras: "animal tem penas" → "animal é ave"
- Adicione fatos: "Tweety tem penas"

### 2. Motor de Inferência
- **Aba "Motor de Inferência"**
- Digite uma consulta: "Tweety é ave?"
- Escolha o método: Encadeamento para Frente ou para Trás

### 3. Sistema de Explanação
- **Aba "Sistema de Explanação"**
- **Por quê**: "Por que Tweety é ave?"
- **Como**: "Como provar que algo é mamífero?"

### 4. Diálogo Natural
- **Aba "Diálogo Natural"**
- Converse naturalmente: "Tweety é ave?"
- Adicione conhecimento: "Se animal voa então animal é ave"

## 🔧 Arquitetura

### Módulos Principais

#### KnowledgeBase
- Armazena regras (SE...ENTÃO) e fatos
- Fornece métodos de busca e correspondência
- Suporte a import/export de conhecimento

#### InferenceEngine
- **Forward Chaining**: Aplica regras para derivar novos fatos
- **Backward Chaining**: Prova objetivos recursivamente
- Mantém histórico de inferências

#### ExplanationSystem
- Gera explicações para conclusões (Por quê?)
- Fornece estratégias para objetivos (Como?)
- Converte explicações para linguagem natural

#### NaturalLanguageInterface
- Processa consultas em português
- Identifica tipos de pergunta
- Integra com outros módulos

#### UIController
- Gerencia interface web
- Coordena interações entre módulos
- Atualiza visualizações dinamicamente

## 🎮 Exemplos de Uso

### Exemplo 1: Classificação de Animais
```
Regras:
- SE "animal tem penas" ENTÃO "animal é ave"
- SE "animal é ave" ENTÃO "animal tem asas"
- SE "animal late" ENTÃO "animal é cão"

Fatos:
- "Tweety tem penas"
- "Rex late"

Consultas:
- "Tweety é ave?" → SIM
- "Tweety tem asas?" → SIM
- "Rex é cão?" → SIM
```

### Exemplo 2: Chat Natural
```
Usuário: "Por que Tweety é ave?"
Sistema: "Tweety é ave porque Tweety tem penas, e pela regra: 
          SE animal tem penas ENTÃO animal é ave"

Usuário: "Como provar que algo é mamífero?"
Sistema: "Para provar que algo é mamífero, você precisa..."
```

## 🔄 Fluxo de Funcionamento

1. **Carregamento**: Sistema inicializa com dados de exemplo
2. **Interação**: Usuário interage via interface web ou chat
3. **Processamento**: Motor de inferência aplica regras
4. **Explanação**: Sistema explica raciocínio
5. **Atualização**: Interface reflete mudanças

## 🤝 Contribuição

1. Fork o projeto
2. Crie uma branch: `git checkout -b feature/nova-funcionalidade`
3. Commit suas mudanças: `git commit -m 'Adiciona nova funcionalidade'`
4. Push para a branch: `git push origin feature/nova-funcionalidade`
5. Abra um Pull Request

## 📝 Licença

Este projeto está sob a licença MIT. Veja o arquivo [LICENSE](LICENSE) para detalhes.

## 🎓 Contexto Acadêmico

Este projeto foi desenvolvido como implementação da **Questão 2** da atividade de **Inteligência Artificial**, seguindo as especificações:

> "Implemente uma ferramenta (genérica) para construir aplicações de sistema baseado em agente baseado em conhecimento, tendo uma base de conhecimento representada por uma coleção de regras do tipo SE… ENTÃO..., e por fatos. Especificamente, esta ferramenta deverá incluir os módulos de um editor de base de conhecimento, de um motor de inferência com encadeamento para trás (e mais o encadeamento para frente), explanação (Por quê? Como?) e interface, desejavelmente, com diálogo em linguagem natural."

### Referência: Expert Sinta
O sistema foi inspirado no **Expert Sinta**, incorporando suas principais funcionalidades:
- Editor visual de regras e fatos
- Motor de inferência bidirecional
- Sistema de explanação interativo
- Interface amigável ao usuário

---

## 📧 Contato

Para dúvidas ou sugestões, entre em contato através dos canais do curso.

**Desenvolvido com ❤️ para a disciplina de Inteligência Artificial - UFAL**