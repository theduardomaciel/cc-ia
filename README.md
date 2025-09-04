<picture>
  <source media="(prefers-color-scheme: dark)" srcset="./.github/cover.png">
  <source media="(prefers-color-scheme: light)" srcset="./.github/cover_light.png">
  <img alt="Inteligência Artificial" src="/.github/cover_light.png">
</picture>

# cc-ia

Repositório de atividades de Inteligência Artificial. A Atividade 1 implementa árvores de decisão e indução de regras sobre dois conjuntos de dados didáticos.

## Estrutura

- `activity1/`
	- `common/`: utilitários compartilhados (paths, relatórios, etc.)
	- `data/`: datasets de apoio (dataset1.csv, dataset2.csv)
	- `question1&2/`: árvores ID3, C4.5 e CART para risco de crédito (dataset1)
	- `question3/`: árvore de decisão (sklearn) para evasão/sucesso acadêmico (dataset2)
	- `question4/`: indução de regras (PRISM) sobre o dataset2

## Preparação do ambiente

1) (Opcional) Crie e ative um ambiente virtual.
2) Instale dependências a partir de `requirements.txt`.

## Como rodar

- Questões 1 e 2 (árvores artesanais): ver `activity1/question1&2/README.md`.
- Questão 3 (árvore sklearn): ver `activity1/question3/README.md`.
- Questão 4 (PRISM): ver `activity1/question4/README.md`.

Observações:
- Os scripts resolvem o caminho do dataset automaticamente a partir da raiz do repo.
- Artefatos da Questão 4 são gravados em `out/` na raiz do repositório.

## Datasets

- [Higher Education Predictors of Student Retention](https://www.kaggle.com/datasets/thedevastator/higher-education-predictors-of-student-retention)
- [Mobile Price Classification](https://www.kaggle.com/datasets/iabhishekofficial/mobile-price-classification)
