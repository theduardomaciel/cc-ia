# Atividade 1: Questão 4

Indução de regras (estilo PRISM) sobre o mesmo dataset da questão 3.

## Execução

```
python activity1/question4/main.py [--data <csv>] [--bins 4] [--test_size 0.25] [--no_save]
```

- `--data`: caminho para o CSV (padrão: dataset2.csv resolvido pela raiz do repo)
- `--bins`: número de bins para discretização de atributos contínuos
- `--test_size`: proporção de teste
- `--no_save`: não grava artefatos

## Saídas

Os artefatos são sempre gravados em `out/` na raiz do repositório:
- `rules.txt`: regras induzidas
- `rules_applied_train.csv` e `rules_applied_test.csv`: exemplos com a regra aplicada
- `metrics_train.csv` e `metrics_test.csv`: classification_report em CSV (sem matriz de confusão)

Observações:
- A classificação usa a primeira regra que cobre o exemplo; se nenhuma cobrir, usa a classe majoritária de treino (default).
- A discretização é consistente entre treino e teste.
