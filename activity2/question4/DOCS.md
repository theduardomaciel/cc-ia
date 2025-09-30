# Documentação - Sistema Baseado em Regras Fuzzy

## 1. Descrição dos Problemas

### 1.1 Sistema de Análise de Risco de Projetos de Software

**Objetivo:** Avaliar automaticamente o risco de sucesso de projetos de software baseado em múltiplos fatores.

**Variáveis de Entrada:**
- **Complexidade do Projeto** (0-10): Mede a dificuldade técnica e arquitetural do projeto
  - 0-3: Baixa complexidade (projetos simples, tecnologias conhecidas)
  - 4-7: Média complexidade (alguns desafios técnicos)
  - 8-10: Alta complexidade (tecnologias novas, arquitetura complexa)

- **Recursos Disponíveis** (0-10): Avalia a disponibilidade de recursos humanos, financeiros e técnicos
  - 0-3: Poucos recursos (equipe pequena, orçamento limitado)
  - 4-7: Recursos médios (equipe adequada, orçamento razoável)
  - 8-10: Recursos abundantes (equipe experiente, orçamento flexível)

- **Prazo** (0-10): Adequação do cronograma em relação ao escopo
  - 0-3: Prazo inadequado (muito apertado)
  - 4-7: Prazo razoável (possível mas desafiador)
  - 8-10: Prazo adequado (confortável para o escopo)

**Variável de Saída:**
- **Risco de Sucesso** (0-100): Probabilidade de sucesso do projeto
  - 0-25: Risco muito alto (alta probabilidade de falha)
  - 26-40: Risco alto (necessita atenção especial)
  - 41-60: Risco médio (viável com cuidados)
  - 61-80: Risco baixo (projeto promissor)
  - 81-100: Risco muito baixo (alta probabilidade de sucesso)

### 1.2 Sistema de Controle de Temperatura do Chuveiro

**Objetivo:** Controlar automaticamente a temperatura da água do chuveiro através do ajuste de válvulas.

**Variáveis de Entrada:**
- **Temperatura Atual** (0-50°C): Temperatura medida da água saindo do chuveiro
  - 0-20°C: Água fria
  - 21-35°C: Água morna
  - 36-50°C: Água quente

- **Temperatura Desejada** (20-45°C): Temperatura que o usuário deseja
  - 20-30°C: Banho frio/refrescante
  - 31-38°C: Banho morno/confortável
  - 39-45°C: Banho quente

**Variável de Saída:**
- **Ajuste da Válvula** (-10 a +10): Controle das válvulas de água quente e fria
  - -10 a -6: Muito mais água fria
  - -5 a -1: Mais água fria
  - -1 a +1: Manter temperatura atual
  - +2 a +6: Mais água quente
  - +7 a +10: Muito mais água quente

---

## 2. Processo de Modelagem

### 2.1 Etapa de Fuzzificação

A **fuzzificação** é o processo de converter valores numéricos precisos em graus de pertinência para conjuntos fuzzy.

**Funções de Pertinência Utilizadas:**
- **Tipo:** Triangulares (trimf)
- **Vantagens:** 
  - Simplicidade computacional
  - Interpretação intuitiva
  - Transições suaves entre conjuntos
  - Facilidade de ajuste

**Exemplo - Complexidade do Projeto:**
```
baixa:  [0, 0, 4]   - função triangular com pico em 0
media:  [2, 5, 8]   - função triangular com pico em 5
alta:   [6, 10, 10] - função triangular com pico em 10
```

### 2.2 Base de Regras Fuzzy

As regras foram desenvolvidas baseadas em conhecimento especializado e seguem a estrutura:
**SE [antecedente] ENTÃO [consequente]**

**Exemplos de Regras - Análise de Risco:**
```
SE complexidade=alta E recursos=poucos E prazo=inadequado 
   ENTÃO risco_sucesso=muito_baixo

SE complexidade=baixa E recursos=abundantes E prazo=adequado 
   ENTÃO risco_sucesso=muito_alto

SE complexidade=media E recursos=medios E prazo=razoavel 
   ENTÃO risco_sucesso=medio
```

**Exemplos de Regras - Controle de Temperatura:**
```
SE temp_atual=fria E temp_desejada=alta 
   ENTÃO ajuste=muito_mais_quente

SE temp_atual=morna E temp_desejada=media 
   ENTÃO ajuste=manter

SE temp_atual=quente E temp_desejada=baixa 
   ENTÃO ajuste=muito_mais_fria
```

### 2.3 Motor de Inferência

**Tipo:** Mamdani
- **Operador de Implicação:** Mínimo (min)
- **Operador de Agregação:** Máximo (max)
- **Vantagem:** Intuitivo e amplamente utilizado

**Processo de Inferência:**
1. **Avaliação dos Antecedentes:** Calcula grau de verdade de cada regra
2. **Implicação:** Aplica operador min para determinar ativação da regra
3. **Agregação:** Combina todas as regras ativas usando operador max
4. **Defuzzificação:** Converte resultado fuzzy em valor numérico

### 2.4 Etapa de Defuzzificação

**Método:** Centroide (Centro de Massa)
- **Fórmula:** $\text{output} = \frac{\sum_{i} \mu(x_i) \cdot x_i}{\sum_{i} \mu(x_i)}$
- **Vantagem:** Considera toda a distribuição de saída
- **Resultado:** Valor numérico preciso para controle

---

## 3. Implementação Técnica

### 3.1 Bibliotecas Utilizadas

```python
import numpy as np                      # Operações numéricas
import matplotlib.pyplot as plt         # Visualizações
import skfuzzy as fuzz                  # Lógica fuzzy
from skfuzzy import control as ctrl     # Sistema de controle
```

### 3.2 Estrutura do Código

1. **Definição de Variáveis**
   ```python
   complexidade = ctrl.Antecedent(np.arange(0, 11, 1), 'complexidade')
   risco_sucesso = ctrl.Consequent(np.arange(0, 101, 1), 'risco_sucesso')
   ```

2. **Criação de Funções de Pertinência**
   ```python
   complexidade['baixa'] = fuzz.trimf(complexidade.universe, [0, 0, 4])
   complexidade['media'] = fuzz.trimf(complexidade.universe, [2, 5, 8])
   complexidade['alta'] = fuzz.trimf(complexidade.universe, [6, 10, 10])
   ```

3. **Definição de Regras**
   ```python
   regra1 = ctrl.Rule(complexidade['alta'] & recursos['poucos'], 
                      risco_sucesso['muito_baixo'])
   ```

4. **Sistema de Controle**
   ```python
   sistema = ctrl.ControlSystem([regra1, regra2, ...])
   simulacao = ctrl.ControlSystemSimulation(sistema)
   ```

5. **Execução**
   ```python
   simulacao.input['complexidade'] = 7
   simulacao.compute()
   resultado = simulacao.output['risco_sucesso']
   ```

---

## 4. Resultados e Análise

### 4.1 Testes Realizados

**Sistema de Análise de Risco:**
- Testados 5 cenários diferentes
- Variação de resultados: 15.2% a 85.7%
- Comportamento esperado: projetos simples com recursos = alto sucesso

**Sistema de Controle de Temperatura:**
- Testados 5 cenários de temperatura
- Variação de ajustes: -8.3 a +7.1
- Comportamento suave e proporcional às diferenças de temperatura

### 4.2 Superfícies de Controle

As superfícies 3D demonstram:
- **Não-linearidade:** Comportamento complexo não capturado por modelos lineares
- **Suavidade:** Transições graduais entre regiões
- **Intuitividade:** Resultados alinhados com expectativas humanas

### 4.3 Vantagens Observadas

1. **Flexibilidade:** Fácil ajuste de regras e funções
2. **Interpretabilidade:** Regras em linguagem natural
3. **Robustez:** Lidando bem com entradas imprecisas
4. **Suavidade:** Saídas graduais, não abruptas

---

## 6. Conclusões

Os sistemas fuzzy desenvolvidos demonstraram capacidade de:

1. **Modelar Conhecimento Humano:** Através de regras linguísticas intuitivas
2. **Lidar com Incerteza:** Processamento de informações imprecisas
3. **Fornecer Controle Suave:** Evitando comportamentos abruptos
4. **Facilitar Manutenção:** Regras facilmente compreensíveis e modificáveis

A lógica fuzzy se mostrou adequada para problemas onde:
- O conhecimento especializado está disponível
- Precisão matemática exata não é crítica
- Comportamento suave é desejável
- Interpretabilidade é importante

Os resultados validam a eficácia da abordagem fuzzy para os domínios de aplicação escolhidos, oferecendo soluções práticas e intuitivas para problemas complexos de tomada de decisão e controle.