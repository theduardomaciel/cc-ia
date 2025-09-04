# Atividade 1: Questão 3 — Árvore de decisão (Mobile Price Classification)

Considerando a base de dados [Mobile Price Classification](https://www.kaggle.com/datasets/iabhishekofficial/mobile-price-classification), gere e apresente uma árvore de decisão e as regras correspondentes. Também avalie o modelo (acurácia e outras métricas).

Problema: prever a faixa de preço (`price_range`, classes 0–3) a partir de atributos numéricos do dispositivo.

## Preparação dos dados
O script espera que a coluna-alvo se chame `Target`.

Você tem duas opções:
- Usar o CSV já preparado em `activity1/data/dataset2.csv` (recomendado).
- Baixar o `train.csv` do Kaggle, renomear a coluna `price_range` para `Target` e apontar para esse arquivo via `--data` ou salvar como `activity1/data/dataset2.csv`.

## Como executar

```
python activity1/question3/main.py [--data <csv>] [--max_depth 5] [--no_save]
```

Exemplos:
- Usando o dataset padrão do projeto: `python activity1/question3/main.py`
- Especificando um CSV: `python activity1/question3/main.py --data path/para/seu/train.csv`
- Alterando a profundidade máxima: `python activity1/question3/main.py --max_depth 4`

## O que o script faz
- Split treino/teste estratificado.
- Treina `DecisionTreeClassifier` (criterion=gini, `max_depth` padrão 5, `min_samples_leaf` 5, `random_state` 42).
- Exibe acurácia, classification report e matriz de confusão.
- Mostra a árvore em texto e gera regras IF-THEN por folha, ordenadas por suporte.

## Saídas gerada
Arquivos salvos em `activity1/question3/`:
- `tree.txt`: representação textual da árvore.
- `tree.dot`: grafo da árvore em DOT (para Graphviz, opcional).
- `tree.png`: visualização da árvore via matplotlib.
- `rules.txt`: regras IF-THEN extraídas das folhas.
- `metrics_train.csv` e `metrics_test.csv`: métricas (classification_report) no treino e teste.