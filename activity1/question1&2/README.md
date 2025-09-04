# Atividade 1 — Questões 1 e 2

Árvores de decisão manuais para risco de crédito (dataset1.csv):
- ID3 (ganho de informação)
- C4.5 (Gain Ratio)
- CART (Gini, splits binários)

Scripts:
- `id3/main.py` → gera `rules_id3.txt`, `tree_id3.dot`, `tree_id3.png`
- `c4.5/main.py` → gera `rules_c45.txt`, `tree_c45.dot`, `tree_c45.png`
- `cart/main.py` → gera `rules_cart.txt`, `tree_cart.dot`, `tree_cart.png`

Como executar (exemplos):
- `python activity1/question1\&2/id3/main.py --no_png --no_dot`
- `python activity1/question1\&2/c4.5/main.py --no_png --no_dot`
- `python activity1/question1\&2/cart/main.py --no_png --no_dot`

Observações:
- Os scripts imprimem, por nó, os cálculos detalhados (entropia/Gini, IG/GR, etc.).
- O dataset padrão é resolvido automaticamente a partir da raiz do repositório.

Considere a base de dados seguinte, supostamente fornecida pelo “gerente do banco”, realizando nela a seguinte ampliação:
1. Aumentá-la para que contenha 6 atributos e 30 exemplos (E15, E16, …, E30), com a adição de 16 exemplos, distribuídos entre Risco = Baixo, Risco = Alto e Risco = Moderado
2. A partir da base de dados ampliada, conforme feito em (i), construa “manualmente” e apresente, 3 árvores de decisão, sendo uma usando o algoritmo ID3, outra com o C4.5 e uma última com o algoritmo CART.
3. De cada uma das 3 árvores de decisão obtidas em (ii), extraia e apresente as respectivas bases de conhecimento com regras do tipo SE...ENTÃO…
4. Compare as 3 bases de regras e selecione, justificando sua escolha, a que você julga mais apropriada para ser a base de conhecimento a ser usada na solução do problema de análise de risco de crédito, discutido em sala de aula.

| ID  | História de Crédito | Dívida | Garantia | Renda         | Risco    |
|-----|---------------------|--------|----------|---------------|----------|
| E1  | Ruim                | Alta   | Nenhuma  | $0 a $15k     | Alto     |
| E2  | Desconhecida        | Alta   | Nenhuma  | $15 a $35k    | Alto     |
| E3  | Desconhecida        | Baixa  | Nenhuma  | $15 a $35k    | Moderado |
| E4  | Desconhecida        | Baixa  | Nenhuma  | $0 a $15k     | Alto     |
| E5  | Desconhecida        | Baixa  | Nenhuma  | Acima de $35k | Baixo    |
| E6  | Desconhecida        | Baixa  | Adequada | Acima de $35k | Baixo    |
| E7  | Ruim                | Baixa  | Nenhuma  | $0 a $15k     | Alto     |
| E8  | Ruim                | Baixa  | Adequada | Acima de $35k | Moderado |
| E9  | Boa                 | Baixa  | Nenhuma  | Acima de $35k | Baixo    |
| E10 | Boa                 | Alta   | Adequada | Acima de $35k | Baixo    |
| E11 | Boa                 | Alta   | Nenhuma  | $0 a $15k     | Alto     |
| E12 | Boa                 | Alta   | Nenhuma  | $15 a $35k    | Moderado |
| E13 | Boa                 | Alta   | Nenhuma  | Acima de $35k | Baixo    |
| E14 | Ruim                | Alta   | Nenhuma  | $15 a $35k    | Alto     |

### Nossa abordagem

Ampliamos a base de dados original para que contivesse 6 atributos e 30 exemplos, conforme solicitado. A tabela abaixo apresenta a base de dados ampliada:

#### Atributos
- História de Crédito: {Ruim, Desconhecida, Boa}
- Dívida: {Alta, Baixa}
- Garantia: {Nenhuma, Adequada}
- Renda: {\$0 a \$15k, \$15 a \$35k, Acima de \$35k}
- Emprego: {Desempregado, Empregado}
- Idade: {Jovem, Adulto, Sênior}
- Risco (Classe): {Alto, Moderado, Baixo}

| ID  | História de Crédito | Dívida | Garantia | Renda          | Emprego      | Idade  | Risco    |
| --- | ------------------- | ------ | -------- | -------------- | ------------ | ------ | -------- |
| E1  | Ruim                | Alta   | Nenhuma  | \$0 a \$15k    | Desempregado | Jovem  | Alto     |
| E2  | Desconhecida        | Alta   | Nenhuma  | \$15 a \$35k   | Empregado    | Adulto | Alto     |
| E3  | Desconhecida        | Baixa  | Nenhuma  | \$15 a \$35k   | Desempregado | Jovem  | Moderado |
| E4  | Desconhecida        | Baixa  | Nenhuma  | \$0 a \$15k    | Empregado    | Sênior | Alto     |
| E5  | Desconhecida        | Baixa  | Nenhuma  | Acima de \$35k | Empregado    | Adulto | Baixo    |
| E6  | Desconhecida        | Baixa  | Adequada | Acima de \$35k | Empregado    | Jovem  | Baixo    |
| E7  | Ruim                | Baixa  | Nenhuma  | \$0 a \$15k    | Desempregado | Adulto | Alto     |
| E8  | Ruim                | Baixa  | Adequada | Acima de \$35k | Empregado    | Sênior | Moderado |
| E9  | Boa                 | Baixa  | Nenhuma  | Acima de \$35k | Empregado    | Adulto | Baixo    |
| E10 | Boa                 | Alta   | Adequada | Acima de \$35k | Empregado    | Jovem  | Baixo    |
| E11 | Boa                 | Alta   | Nenhuma  | \$0 a \$15k    | Desempregado | Jovem  | Alto     |
| E12 | Boa                 | Alta   | Nenhuma  | \$15 a \$35k   | Empregado    | Sênior | Moderado |
| E13 | Boa                 | Alta   | Nenhuma  | Acima de \$35k | Empregado    | Adulto | Baixo    |
| E14 | Ruim                | Alta   | Nenhuma  | \$15 a \$35k   | Desempregado | Adulto | Alto     |
| E15 | Desconhecida        | Alta   | Adequada | \$0 a \$15k    | Empregado    | Jovem  | Moderado |
| E16 | Boa                 | Baixa  | Adequada | \$15 a \$35k   | Empregado    | Adulto | Baixo    |
| E17 | Ruim                | Alta   | Nenhuma  | Acima de \$35k | Empregado    | Sênior | Alto     |
| E18 | Boa                 | Baixa  | Nenhuma  | \$0 a \$15k    | Desempregado | Jovem  | Moderado |
| E19 | Desconhecida        | Alta   | Nenhuma  | Acima de \$35k | Empregado    | Adulto | Alto     |
| E20 | Ruim                | Baixa  | Adequada | \$15 a \$35k   | Empregado    | Jovem  | Moderado |
| E21 | Boa                 | Alta   | Adequada | \$15 a \$35k   | Empregado    | Sênior | Baixo    |
| E22 | Desconhecida        | Baixa  | Nenhuma  | \$0 a \$15k    | Desempregado | Adulto | Alto     |
| E23 | Ruim                | Alta   | Adequada | \$15 a \$35k   | Empregado    | Adulto | Moderado |
| E24 | Boa                 | Baixa  | Adequada | Acima de \$35k | Empregado    | Jovem  | Baixo    |
| E25 | Desconhecida        | Alta   | Nenhuma  | \$0 a \$15k    | Desempregado | Jovem  | Alto     |
| E26 | Boa                 | Baixa  | Nenhuma  | \$15 a \$35k   | Empregado    | Adulto | Moderado |
| E27 | Ruim                | Alta   | Nenhuma  | \$0 a \$15k    | Desempregado | Sênior | Alto     |
| E28 | Desconhecida        | Baixa  | Adequada | Acima de \$35k | Empregado    | Adulto | Baixo    |
| E29 | Boa                 | Alta   | Nenhuma  | \$15 a \$35k   | Desempregado | Jovem  | Moderado |
| E30 | Ruim                | Baixa  | Nenhuma  | Acima de \$35k | Empregado    | Sênior | Moderado |