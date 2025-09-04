<picture>
  <source media="(prefers-color-scheme: dark)" srcset="./.github/cover.png">
  <source media="(prefers-color-scheme: light)" srcset="./.github/cover_light.png">
  <img alt="Capa" src="/.github/cover_light.png">
</picture>

# Atividade 1

Implementações de árvores de decisão e indução de regras sobre dois datasets.

- **Questões 1 e 2:** árvores ID3, C4.5 e CART para análise de risco de crédito (dataset1.csv).
- **Questão 3:** árvore de decisão (scikit-learn) para evasão/sucesso acadêmico (dataset2.csv).
- **Questão 4:** indução de regras (PRISM) sobre o dataset2;

## Requisitos

Instale as dependências listadas em `requirements.txt` na raiz do repositório.

## Execução rápida

- Q1&2 (ID3):
  - `python activity1/question1\&2/id3/main.py`  (use `--no_png --no_dot` para pular imagens/DOT)
- Q1&2 (C4.5):
  - `python activity1/question1\&2/c4.5/main.py`  (use `--no_png --no_dot`)
- Q1&2 (CART):
  - `python activity1/question1\&2/cart/main.py`  (use `--no_png --no_dot`)
- Q3:
  - `python activity1/question3/main.py` (parâmetros: `--max_depth`, `--no_save`)
- Q4:
  - `python activity1/question4/main.py`

Notas:
- Os caminhos para `dataset1.csv` e `dataset2.csv` são resolvidos automaticamente.