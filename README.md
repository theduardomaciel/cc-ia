# cc-ia

## Atividade 1

Link para o dataset: [Predict students' dropout and academic success](https://www.kaggle.com/datasets/thedevastator/higher-education-predictors-of-student-retention)
Link para o dataset 2: [Mobile Price Classification](https://www.kaggle.com/datasets/iabhishekofficial/mobile-price-classification)

### Como executar

1) Crie e ative um ambiente virtual (opcional, mas recomendado).
2) Instale dependências:
	- pandas
	- scikit-learn
	- matplotlib (opcional para salvar imagem da árvore)

3) Execute o script:

```
python activity1/main.py
```

Parâmetros úteis:
- `--max_depth N` para controlar a profundidade da árvore (padrão 5).
- `--data <caminho_csv>` para usar um CSV diferente (padrão `data/dataset.csv`).
- `--no_save` para não salvar `rules.txt`, `tree.dot` e `tree.png`.