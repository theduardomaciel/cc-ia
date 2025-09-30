# Sistema Especialista Baseado em Conhecimento

Este é um sistema especialista que implementa uma arquitetura de agente baseado em conhecimento com todas as funcionalidades principais de um sistema especialista.

## 🧠 Funcionalidades Principais

### 1. Editor de Base de Conhecimento
- **Regras SE-ENTÃO**: Criação e edição de regras de produção
- **Fatos**: Gerenciamento de fatos da base de conhecimento
- **Interface intuitiva**: Formulários visuais para criação de regras e fatos
- **Validação**: Verificação automática de sintaxe

### 2. Motor de Inferência
- **Encadeamento para Frente (Forward Chaining)**: Deriva novos fatos a partir dos existentes
- **Encadeamento para Trás (Backward Chaining)**: Busca provar um objetivo específico
- **Controle de Conflitos**: Resolução baseada em prioridade das regras
- **Trace Completo**: Registro detalhado de todos os passos da inferência

### 3. Sistema de Explanação
- **Por quê?**: Explica como uma conclusão foi alcançada
- **Como?**: Mostra o caminho de raciocínio seguido
- **Justificativas**: Apresenta as regras e fatos utilizados

### 4. Interface de Linguagem Natural
- **Diálogo Intuitivo**: Comunicação em português
- **Reconhecimento de Padrões**: Identifica perguntas, declarações e comandos
- **Respostas Contextuais**: Adapta as respostas ao contexto da conversa

## 🚀 Como Usar

### Executando o Sistema

```bash
# Instalar dependências
pnpm install

# Executar em modo de desenvolvimento
pnpm run dev
```

### Navegação

O sistema possui 4 abas principais:

#### 1. **Base de Conhecimento**
- **Regras**: Clique em "Nova Regra" para criar regras SE-ENTÃO
  - Defina condições (SE): Use operadores como igual, maior que, contém, etc.
  - Defina conclusões (ENTÃO): Especifique os fatos derivados
  - Configure prioridade para controle de conflitos

- **Fatos**: Clique em "Novo Fato" para adicionar conhecimento base
  - Nome do fato/variável
  - Valor (texto, número, booleano)
  - Nível de confiança (0.0 a 1.0)

#### 2. **Consulta**
- Interface de chat para fazer perguntas ao sistema
- **Exemplos de uso**:
  - `"temperatura = alta"` - Declara um fato
  - `"Qual é o diagnóstico?"` - Faz uma pergunta
  - `"Por que diagnóstico?"` - Solicita explanação
  - `"Como chegou a essa conclusão?"` - Pede justificativa

#### 3. **Trace de Inferência**
- Visualiza o processo de raciocínio do sistema
- Mostra regras aplicadas, fatos utilizados e conclusões
- Timeline completa da inferência

#### 4. **Configurações**
- Exportar/importar base de conhecimento
- Limpar dados
- Informações sobre o sistema

### Botões de Inferência

Na barra lateral:
- **Inferência ↗** (Forward): Deriva novos fatos automaticamente
- **Inferência ↙** (Backward): Busca provar um objetivo específico

## 📋 Exemplo de Uso - Sistema Médico

### Fatos Base
```
idade = 25
```

### Regras
1. **Diagnóstico de Gripe**
   - SE: temperatura = alta E sintoma = dor de cabeça
   - ENTÃO: diagnóstico = gripe (confiança: 0.8)

2. **Diagnóstico de Resfriado**
   - SE: sintoma = tosse E temperatura = normal
   - ENTÃO: diagnóstico = resfriado (confiança: 0.7)

3. **Recomendação de Repouso**
   - SE: diagnóstico = gripe
   - ENTÃO: tratamento = repouso e hidratação (confiança: 0.9)

### Consulta de Exemplo
```
Usuário: "temperatura = alta"
Sistema: "Entendi. Registrei que temperatura = alta."

Usuário: "sintoma = dor de cabeça"
Sistema: "Entendi. Registrei que sintoma = dor de cabeça. Este novo fato pode gerar conclusões adicionais."

Usuário: "Qual é o diagnóstico?"
Sistema: "Baseado no meu conhecimento, diagnóstico é gripe."

Usuário: "Por que?"
Sistema: "Explicação (Por quê?):
diagnóstico foi derivado pela regra 'Diagnóstico de Gripe' porque:
- temperatura equal alta (valor atual: alta)
- sintoma equal dor de cabeça (valor atual: dor de cabeça)"
```

## 🛠️ Tecnologias Utilizadas

- **React 19**: Framework de interface
- **TypeScript**: Tipagem estática
- **TailwindCSS v4**: Estilização
- **Vite**: Build tool
- **json-rules-engine**: Motor de regras
- **Lucide React**: Ícones
- **Shadcn/ui**: Componentes de UI

## 🏗️ Arquitetura

### Componentes Principais

1. **InferenceEngine**: Implementa os algoritmos de inferência
2. **NaturalLanguageProcessor**: Processa entrada em linguagem natural
3. **SessionManager**: Gerencia sessões e persistência
4. **RuleEditor**: Interface para edição de regras
5. **FactEditor**: Interface para edição de fatos
6. **ConsultationInterface**: Chat de consulta
7. **InferenceTrace**: Visualização do trace

### Fluxo de Dados

```
Entrada do Usuário → NLP → Motor de Inferência → Base de Conhecimento
                                    ↓
Interface de Resposta ← Explanação ← Trace de Inferência
```

## 📝 Estrutura de Arquivos

```
src/
├── types/              # Definições de tipos TypeScript
├── lib/               # Lógica de negócio
│   ├── inference-engine.ts
│   ├── natural-language-processor.ts
│   └── session-manager.ts
├── components/        # Componentes React
│   ├── RuleEditor.tsx
│   ├── FactEditor.tsx
│   ├── ConsultationInterface.tsx
│   ├── InferenceTrace.tsx
│   └── ui/           # Componentes de UI base
└── App.tsx           # Componente principal
```

## 🎯 Características do Sistema Especialista

### Conforme Expert Sinta
- **Base de Conhecimento**: Regras SE-ENTÃO + Fatos
- **Motor de Inferência**: Forward e Backward Chaining
- **Explanação**: Capacidades de "Por quê?" e "Como?"
- **Interface**: Diálogo em linguagem natural
- **Trace**: Visualização do processo de raciocínio

### Diferenciais Implementados
- **Interface Moderna**: React + TailwindCSS
- **Tipagem Forte**: TypeScript para maior robustez
- **Persistência**: Salvar/carregar sessões
- **Visualização Rica**: Trace interativo e colorido
- **Responsivo**: Funciona em diferentes dispositivos

## 👥 Autores

- [Eduardo Maciel Alexandre](https://github.com/theduardomaciel)
