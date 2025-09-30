# Atividade 2: Questão 4 — Sistema Baseado em Regras Fuzzy

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
- **`DOCS.md`** - Documentação detalhada do processo de modelagem
- **`README.md`** - Este arquivo com instruções gerais

### 🔬 Aspectos Técnicos

- **Linguagem:** Python 3.13+
- **Biblioteca Principal:** scikit-fuzzy 0.5.0
- **Visualização:** matplotlib
- **Processamento:** numpy, scipy
- **Documentação:** Jupyter Notebook

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