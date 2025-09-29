# Sistema Especialista - Knowledge-Based Agent

Um sistema especialista moderno implementado em TypeScript com interface web intuitiva, baseado na arquitetura conceitual de agente baseado em conhecimento.

## 🚀 Características Principais

### 📚 Base de Conhecimento
- **Regras SE...ENTÃO**: Sistema de regras declarativas no formato IF-THEN
- **Fatos**: Base de dados de fatos tipados (string, number, boolean, object)
- **Editor Visual**: Interface gráfica para criação e gestão de regras e fatos
- **Importação/Exportação**: Persistência do estado do sistema

### ⚙️ Motor de Inferência
- **Encadeamento para Frente (Forward Chaining)**: Deriva novos fatos a partir dos conhecidos
- **Encadeamento para Trás (Backward Chaining)**: Prova objetivos específicos trabalhando retroativamente
- **Integração json-rules-engine**: Utiliza biblioteca robusta para processamento de regras
- **Histórico de Execução**: Rastreamento completo das operações de inferência

### 🤔 Sistema de Explicação
- **Explicações "Por quê?"**: Justifica por que um fato é verdadeiro ou como foi derivado
- **Explicações "Como?"**: Mostra estratégias para alcançar um objetivo
- **Rastreamento de Dependências**: Análise das condições necessárias
- **Níveis de Confiança**: Avaliação da certeza das conclusões

### 💬 Interface de Linguagem Natural
- **Conversação em Português**: Interação natural com o sistema
- **Parsing Inteligente**: Reconhecimento automático de intenções
- **Comandos Contextuais**: Suporte a múltiplos formatos de entrada
- **Feedback Interativo**: Respostas detalhadas e sugestões

## 🛠️ Tecnologias Utilizadas

- **TypeScript**: Tipagem estática e desenvolvimento robusto
- **Vite**: Build tool moderno e rápido
- **Tailwind CSS 4**: Framework CSS utilitário de última geração
- **json-rules-engine**: Engine de regras JSON poderoso e flexível
- **Arquitetura Modular**: Separação clara de responsabilidades

## 📋 Requisitos

- Node.js 18+ 
- pnpm (recomendado) ou npm

## 🚀 Instalação e Execução

```bash
# Clone o repositório
git clone <repository-url>
cd activity2/question2

# Instale as dependências
pnpm install

# Execute em modo de desenvolvimento
pnpm dev

# Compile para produção
pnpm build
```

## 📖 Como Usar

### 1. Base de Conhecimento

#### Adicionando Regras
```
Formato: SE [condição] ENTÃO [conclusão]

Exemplos:
- SE idade >= 18 ENTÃO maior_de_idade
- SE salario > 5000 ENTÃO cliente_premium
- SE maior_de_idade e cliente_premium ENTÃO elegivel_cartao_credito
```

#### Adicionando Fatos
```
Formato: [nome] = [valor]

Exemplos:
- idade = 25
- salario = 6000
- usuario_logado = verdadeiro
```

### 2. Motor de Inferência

#### Encadeamento para Frente
- Executa automaticamente com base nos fatos existentes
- Deriva novos conhecimentos aplicando todas as regras possíveis
- Útil para descobrir o que pode ser concluído

#### Encadeamento para Trás
- Tenta provar um objetivo específico
- Trabalha retroativamente através das regras
- Útil para verificar se algo é verdadeiro

### 3. Sistema de Explicação

#### Explicações "Por quê?"
```
Exemplos:
- "Por que usuário é maior de idade?"
- "Por que cliente é premium?"
```

#### Explicações "Como?"
```
Exemplos:
- "Como obter desconto?"
- "Como ser elegível para cartão de crédito?"
```

### 4. Chat em Linguagem Natural

O sistema reconhece diversos formatos de entrada:

#### Comandos de Regras
```
- "SE idade >= 18 ENTÃO maior_de_idade"
- "Adicione a regra: SE salario > 5000 ENTÃO cliente_premium"
- "Criar regra que se temperatura > 30 então dia_quente"
```

#### Comandos de Fatos
```
- "idade = 25"
- "Define que usuario_logado = verdadeiro"
- "salario = 6000"
```

#### Consultas
```
- "É verdade que usuário é maior de idade?"
- "Verifique se cliente é premium"
- "usuario_logado"
```

#### Explicações
```
- "Por que usuário é maior de idade?"
- "Como obter desconto?"
- "Explique por que cliente é premium"
```

## 🏗️ Arquitetura

```
src/
├── types/                 # Definições de tipos TypeScript
│   └── index.ts
├── modules/              # Módulos principais do sistema
│   ├── KnowledgeBase.ts     # Base de conhecimento
│   ├── InferenceEngine.ts   # Motor de inferência
│   ├── ExplanationSystem.ts # Sistema de explicação
│   ├── NaturalLanguageInterface.ts # Interface de linguagem natural
│   └── UIController.ts      # Controlador da interface
├── style.css             # Estilos customizados
└── main.ts              # Ponto de entrada da aplicação
```

### Fluxo de Dados

1. **Entrada**: Interface web ou linguagem natural
2. **Processamento**: Análise e validação
3. **Armazenamento**: Base de conhecimento
4. **Inferência**: Motor de regras
5. **Explicação**: Sistema de justificativas
6. **Saída**: Interface visual ou textual

## 🎯 Casos de Uso

### Sistema de Aprovação de Crédito
```typescript
// Regras
"SE idade >= 18 ENTÃO maior_de_idade"
"SE salario > 5000 ENTÃO renda_adequada"
"SE maior_de_idade e renda_adequada ENTÃO pre_aprovado"

// Fatos
idade = 25
salario = 7000

// Consulta
"É verdade que cliente está pré-aprovado?"
```

### Sistema de Diagnóstico Médico Básico
```typescript
// Regras
"SE febre > 38 e dor_cabeca ENTÃO possivel_gripe"
"SE tosse e febre ENTÃO consultar_medico"

// Fatos
febre = 39
dor_cabeca = verdadeiro

// Explicação
"Por que possível gripe?"
```

### Sistema de Recomendação
```typescript
// Regras
"SE idade < 25 e estudante ENTÃO desconto_jovem"
"SE compras > 1000 ENTÃO cliente_vip"

// Fatos
idade = 22
estudante = verdadeiro
compras = 1500

// Como
"Como obter desconto jovem?"
```

## 🔧 Desenvolvimento

### Estrutura Modular

Cada módulo tem responsabilidades bem definidas:

- **KnowledgeBase**: Gestão de regras e fatos
- **InferenceEngine**: Lógica de inferência
- **ExplanationSystem**: Geração de explicações
- **NaturalLanguageInterface**: Processamento de linguagem natural
- **UIController**: Coordenação da interface

### Extensibilidade

O sistema foi projetado para ser facilmente extensível:

- Novos tipos de regras
- Operadores customizados
- Diferentes engines de inferência
- Múltiplos idiomas
- Integração com APIs externas

## 📝 Exemplos Práticos

### Exemplo 1: Sistema de Classificação de Usuários

```javascript
// Através da interface de chat
"SE idade >= 18 ENTÃO adulto"
"SE idade < 18 ENTÃO menor"
"SE adulto e salario > 3000 ENTÃO classe_media"
"idade = 25"
"salario = 4000"
"É verdade que usuário é classe média?"
```

### Exemplo 2: Sistema de Controle de Acesso

```javascript
"SE usuario_logado e permissao_admin ENTÃO acesso_total"
"SE usuario_logado e permissao_user ENTÃO acesso_limitado"
"usuario_logado = verdadeiro"
"permissao_admin = verdadeiro"
"Como obter acesso total?"
```

## 🤝 Contribuição

1. Fork o projeto
2. Crie uma branch para sua feature (`git checkout -b feature/AmazingFeature`)
3. Commit suas mudanças (`git commit -m 'Add some AmazingFeature'`)
4. Push para a branch (`git push origin feature/AmazingFeature`)
5. Abra um Pull Request

## 📄 Licença

Este projeto é licenciado sob a MIT License - veja o arquivo [LICENSE](LICENSE) para detalhes.

## 🙏 Reconhecimentos

- Inspirado no Expert Sinta e sistemas especialistas clássicos
- Baseado na arquitetura conceitual de agentes baseados em conhecimento
- Utiliza json-rules-engine para processamento robusto de regras
- Interface moderna com Tailwind CSS

## 📞 Suporte

Para questões, sugestões ou problemas:

1. Abra uma issue no GitHub
2. Use o chat integrado do sistema para testar funcionalidades
3. Consulte a documentação inline da aplicação

---

**Desenvolvido como projeto acadêmico de Inteligência Artificial - UFAL**