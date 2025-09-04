"""
Script: construir_arvores_dataset1.py
Descrição:
- Carrega o arquivo CSV localizado em ./data/dataset1.csv (ou /mnt/data/dataset1.csv se rodando no ambiente do ChatGPT).
- Remove automaticamente colunas identificadoras (coluna chamada 'ID' ou colunas com todos valores únicos).
- Pré-processa atributos categóricos com OneHotEncoder (scikit-learn).
- Treina 3 árvores de decisão usando scikit-learn:
    1) ID3-like: DecisionTreeClassifier(criterion='entropy') — aproxima o ID3.
    2) C4.5-approx: DecisionTreeClassifier(criterion='entropy') + poda por ccp_alpha (escolhido a partir do pruning-path)
       — aproxima o comportamento de pós-poda do C4.5 (não é implementação oficial de C4.5).
    3) CART: DecisionTreeClassifier(criterion='gini') — implementação CART do scikit-learn.
- Exporta as regras (texto) de cada árvore para arquivos: id3_rules.txt, c45_rules.txt, cart_rules.txt
- Imprime um resumo com número de nós/folhas e caminho dos arquivos gerados.

Uso:
python construir_arvores_dataset1.py --input /caminho/para/dataset1.csv --output ./trees_output

Observações importantes:
- scikit-learn não implementa ID3 ou C4.5 "puros". As abordagens usadas aqui são aproximações práticas:
  * ID3-like: critério de entropia (ganho de informação).
  * C4.5-approx: usamos entropia + poda por cost-complexity (ccp_alpha) — similar ao passo de poda do C4.5,
    mas C4.5 usa ganho relativo (gain ratio) e outras heurísticas; resultados podem divergir.
- Tratamos atributos categóricos com OneHotEncoder para compatibilidade com DecisionTreeClassifier.
  Alternativa (se quiser preservar categorias sem OneHot) seria usar implementações que suportem categorias
  nativamente (algumas bibliotecas ou versões recentes do sklearn com "categorical_features").

"""

import argparse
import os
import pandas as pd
import numpy as np
from sklearn.tree import DecisionTreeClassifier, export_text
from sklearn.compose import ColumnTransformer
from sklearn.preprocessing import OneHotEncoder
from sklearn.pipeline import Pipeline


def build_and_export(input_csv: str, output_dir: str, target_name: str | None = None):
    df = pd.read_csv(input_csv)

    # infer target column se não informado
    if target_name is None:
        candidates = ["Risco", "risk", "target", "class", "Class"]
        target = None
        for c in candidates:
            if c in df.columns:
                target = c
                break
        if target is None:
            target = df.columns[-1]
    else:
        target = target_name

    # drop identificadores óbvios
    df2 = df.copy()
    for col in list(df2.columns):
        if col == target:
            continue
        if col.lower() == "id" or df2[col].nunique() == len(df2):
            df2 = df2.drop(columns=[col])

    X = df2.drop(columns=[target])
    y = df2[target]

    # detecta categóricos
    cat_cols = X.select_dtypes(include=["object", "category"]).columns.tolist()
    num_cols = X.select_dtypes(include=[np.number]).columns.tolist()

    preprocessor = ColumnTransformer(
        transformers=[
            ("oh", OneHotEncoder(sparse=False, handle_unknown="ignore"), cat_cols)
        ],
        remainder="passthrough",
    )

    def fit_export(clf, file_name):
        pipe = Pipeline([("pre", preprocessor), ("clf", clf)])
        pipe.fit(X, y)
        # feature names após OneHot
        oh = (
            pipe.named_steps["pre"].named_transformers_["oh"]
            if len(cat_cols) > 0
            else None
        )
        oh_names = list(oh.get_feature_names_out(cat_cols)) if oh is not None else []
        feat_names = oh_names + num_cols
        tree = pipe.named_steps["clf"]
        rules_text = export_text(tree, feature_names=feat_names, decimals=4)
        n_nodes = tree.tree_.node_count
        n_leaves = sum(tree.tree_.children_left == -1)
        # escreve arquivo
        out_path = os.path.join(output_dir, file_name)
        with open(out_path, "w", encoding="utf-8") as f:
            f.write(rules_text)
        return rules_text, n_nodes, n_leaves, out_path

    os.makedirs(output_dir, exist_ok=True)

    # ID3-like
    id3 = DecisionTreeClassifier(criterion="entropy", random_state=0)
    text_id3, nodes_id3, leaves_id3, path_id3 = fit_export(id3, "id3_rules.txt")

    # CART
    cart = DecisionTreeClassifier(criterion="gini", random_state=0)
    text_cart, nodes_cart, leaves_cart, path_cart = fit_export(cart, "cart_rules.txt")

    # C4.5-approx: usa cost_complexity_pruning_path e escolhe alpha moderado (sem CV para rapidez)
    pipe_init = Pipeline(
        [
            ("pre", preprocessor),
            ("clf", DecisionTreeClassifier(criterion="entropy", random_state=0)),
        ]
    )
    pipe_init.fit(X, y)
    X_trans = pipe_init.named_steps["pre"].transform(X)
    y_codes = pd.Categorical(y).codes
    dt = DecisionTreeClassifier(criterion="entropy", random_state=0)
    path = dt.cost_complexity_pruning_path(X_trans, y_codes)
    alphas = np.unique(path.ccp_alphas)
    # pick a moderate alpha (median) to avoid overfitting; user pode ajustar
    alpha_choice = float(alphas[len(alphas) // 2]) if len(alphas) > 0 else 0.0
    c45 = DecisionTreeClassifier(
        criterion="entropy", ccp_alpha=alpha_choice, random_state=0
    )
    text_c45, nodes_c45, leaves_c45, path_c45 = fit_export(c45, "c45_rules.txt")

    # resumo
    resumo = pd.DataFrame(
        [
            {
                "alg": "ID3-like (entropy)",
                "nodes": nodes_id3,
                "leaves": leaves_id3,
                "file": path_id3,
            },
            {
                "alg": "C4.5-approx (entropy+ccp_alpha)",
                "nodes": nodes_c45,
                "leaves": leaves_c45,
                "ccp_alpha": alpha_choice,
                "file": path_c45,
            },
            {
                "alg": "CART (gini)",
                "nodes": nodes_cart,
                "leaves": leaves_cart,
                "file": path_cart,
            },
        ]
    )

    print("\nResumo das árvores geradas:")
    print(resumo.to_string(index=False))
    print("\nOs arquivos de regras foram salvos em:", output_dir)

    return {
        "id3": (text_id3, path_id3),
        "c45": (text_c45, path_c45),
        "cart": (text_cart, path_cart),
        "summary": resumo,
    }


if __name__ == "__main__":
    parser = argparse.ArgumentParser(
        description="Treina árvores ID3/C4.5/CART a partir de um CSV e exporta regras."
    )
    parser.add_argument(
        "--input",
        "-i",
        type=str,
        default="./data/dataset1.csv",
        help="Caminho para dataset CSV",
    )
    parser.add_argument(
        "--output",
        "-o",
        type=str,
        default="./trees_output",
        help="Diretório de saída para regras",
    )
    parser.add_argument(
        "--target", "-t", type=str, default=None, help="Nome da coluna alvo (opcional)"
    )
    args = parser.parse_args()

    build_and_export(args.input, args.output, args.target)
