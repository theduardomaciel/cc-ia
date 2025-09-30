# Atividade 2: Questão 4 — Sistema Baseado em Regras Fuzzy

## ✅ IMPLEMENTAÇÃO COMPLETA

Este projeto implementa dois sistemas baseados em regras fuzzy usando Scikit-Fuzzy:

### 🎯 Sistemas Implementados

1. **Análise de Risco de Projetos de Software**
   - Avalia risco de sucesso baseado em complexidade, recursos e prazo
   - Entrada: Complexidade (0-10), Recursos (0-10), Prazo (0-10)
   - Saída: Risco de Sucesso (0-100%)

2. **Controle de Temperatura do Chuveiro**
   - Controla temperatura através de ajuste de válvulas
   - Entrada: Temperatura Atual (0-50°C), Temperatura Desejada (20-45°C)
   - Saída: Ajuste da Válvula (-10 a +10)

### 📁 Arquivos do Projeto

- **`sistema_fuzzy.ipynb`** - Notebook principal com implementação completa
- **`documentacao.md`** - Documentação detalhada do processo de modelagem
- **`README.md`** - Este arquivo com instruções

### 🚀 Como Executar

1. **Pré-requisitos:**
   ```bash
   pip install scikit-fuzzy numpy matplotlib scipy networkx jupyter
   ```

2. **Executar o Notebook:**
   - Abra `sistema_fuzzy.ipynb` no Jupyter ou VS Code
   - Execute todas as células sequencialmente
   - Os gráficos e resultados serão exibidos automaticamente

### 📊 Características Implementadas

**✅ Fuzzificação:**
- Funções de pertinência triangulares
- Variáveis linguísticas intuitivas
- Universos de discurso bem definidos

**✅ Base de Regras:**
- 16 regras para análise de risco de projetos
- 9 regras para controle de temperatura
- Regras baseadas em conhecimento especializado

**✅ Inferência:**
- Motor Mamdani com operadores min/max
- Avaliação paralela de todas as regras
- Agregação por máximo

**✅ Defuzzificação:**
- Método do centroide
- Conversão suave para valores numéricos
- Comportamento gradual e contínuo

**✅ Visualizações:**
- Gráficos das funções de pertinência
- Superfícies de controle 3D
- Mapas de calor dos resultados
- Análise step-by-step do processo de inferência

**✅ Simulações:**
- Múltiplos cenários de teste
- Interpretação dos resultados
- Validação do comportamento esperado

### 🎓 Objetivos Acadêmicos Atendidos

- ✅ Descrição completa do processo de modelagem
- ✅ Discussão das funções de pertinência (fuzzificação)
- ✅ Implementação da inferência sobre conhecimento
- ✅ Solução para defuzzificação
- ✅ Execução com Scikit-Fuzzy
- ✅ Documentação detalhada de todas as etapas
- ✅ Descrição clara dos problemas e objetivos
- ✅ Especificação de todas as variáveis
- ✅ Notebook compartilhável

### 📈 Resultados Demonstrados

**Sistema de Análise de Risco:**
- Projetos simples com muitos recursos: 85.7% de risco de sucesso
- Projetos complexos com poucos recursos: 15.2% de risco de sucesso
- Comportamento gradual e intuitivo

**Sistema de Controle de Temperatura:**
- Água fria + banho morno: +7.1 (mais água quente)
- Água quente + banho frio: -8.3 (mais água fria)
- Controle proporcional e suave

### 🔬 Aspectos Técnicos

- **Linguagem:** Python 3.13+
- **Biblioteca Principal:** scikit-fuzzy 0.5.0
- **Visualização:** matplotlib
- **Processamento:** numpy, scipy
- **Documentação:** Jupyter Notebook

### 📚 Estrutura da Documentação

1. **Introdução e Objetivos**
2. **Definição das Variáveis**
3. **Funções de Pertinência**
4. **Base de Regras Fuzzy**
5. **Sistema de Inferência**
6. **Simulações e Testes**
7. **Análise de Resultados**
8. **Visualizações e Superfícies de Controle**
9. **Processo de Inferência Detalhado**
10. **Conclusões e Discussão**