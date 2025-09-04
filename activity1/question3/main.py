"""
Considerando a base de dados "Predict students dropout and academic success", gere e apresente
uma árvore de decisão e as regras correspondentes. Também avalie o modelo (acurácia e outras métricas).

Este script:
- Lê o CSV em data/dataset.csv;
- Separa treino/teste (estratificado);
- Treina uma árvore de decisão (com profundidade limitada para interpretabilidade);
- Exibe métricas (acurácia, relatório de classificação e matriz de confusão);
- Mostra a árvore em formato textual e as regras IF-THEN por folha;
- Opcionalmente salva visualizações e artefatos em activity1/ (tree.png, tree.dot, rules.txt).

Execução rápida: python activity1/main.py
"""

from __future__ import annotations

import argparse
import os
from dataclasses import dataclass
from typing import List, Tuple, Any

import numpy as np
import pandas as pd
from sklearn.metrics import (
    accuracy_score,
    classification_report,
    confusion_matrix,
)
from sklearn.model_selection import train_test_split
from sklearn.tree import DecisionTreeClassifier, export_text


# Caminho padrão do dataset: volta dois níveis (de question3/ para raiz) e entra em data/
DEFAULT_DATASET_PATH = os.path.abspath(
    os.path.join(os.path.dirname(__file__), "..", "..", "data", "dataset2.csv")
)


@dataclass
class ModelArtifacts:
    clf: DecisionTreeClassifier
    feature_names: List[str]
    class_names: List[str]


def load_dataset(csv_path: str) -> Tuple[pd.DataFrame, pd.Series]:
    csv_path = os.path.abspath(csv_path)
    if not os.path.isfile(csv_path):
        raise FileNotFoundError(
            f"CSV não encontrado em: {csv_path}. "
            "Ajuste o parâmetro --data ou verifique se 'data/dataset2.csv' existe na raiz do projeto."
        )
    df = pd.read_csv(csv_path)
    if "Target" not in df.columns:
        raise ValueError("Coluna-alvo 'Target' não encontrada no dataset.")
    X = df.drop(columns=["Target"])  # todas as demais colunas como features numéricas
    y = df["Target"].astype(str)
    return X, y


def train_decision_tree(
    X: pd.DataFrame,
    y: pd.Series,
    max_depth: int = 5,
    random_state: int = 42,
) -> ModelArtifacts:
    clf = DecisionTreeClassifier(
        criterion="gini",
        max_depth=max_depth,
        min_samples_leaf=5,
        random_state=random_state,
        class_weight=None,
    )
    clf.fit(X, y)
    return ModelArtifacts(
        clf=clf,
        feature_names=list(X.columns),
        class_names=[str(c) for c in clf.classes_],
    )


def print_metrics(y_true: pd.Series, y_pred: np.ndarray) -> None:
    acc = accuracy_score(y_true, y_pred)
    print("\n===== Métricas =====")
    print(f"Acurácia: {acc:.4f}")
    print("\nRelatório de classificação:")
    print(classification_report(y_true, y_pred, digits=3))
    cm = confusion_matrix(y_true, y_pred, labels=np.unique(y_true))
    print("Matriz de confusão (linhas=verdadeiro, colunas=previsto):")
    # imprime com cabeçalho de rótulos
    labels = list(np.unique(y_true))
    header = "\t".join([" "] + labels)
    print(header)
    for i, row in enumerate(cm):
        print("\t".join([labels[i]] + [str(v) for v in row]))


def print_text_tree(art: ModelArtifacts) -> str:
    tree_txt = export_text(art.clf, feature_names=art.feature_names, show_weights=True)
    print("\n===== Árvore (texto) =====")
    print(tree_txt)
    return tree_txt


def generate_rules(art: ModelArtifacts, max_rules: int | None = 30) -> List[str]:
    """Gera regras IF-THEN por folha da árvore.

    Retorna as regras ordenadas por suporte (n_amostras no nó folha) decrescente.
    """
    # Tipa tree_ como Any para evitar erros estáticos ao acessar atributos internos
    tree_: Any = art.clf.tree_
    features = art.feature_names
    class_names = art.class_names

    # Construção do mapa filho->pai (scikit-learn não expõe pai diretamente)
    parents_map = {}
    for parent in range(tree_.node_count):
        left = tree_.children_left[parent]
        right = tree_.children_right[parent]
        if left != -1:
            parents_map[left] = parent
        if right != -1:
            parents_map[right] = parent

    # Helper para construir condições ascendendo da folha à raiz
    def _node_to_rule(leaf_id: int) -> Tuple[str, int, str]:
        path = []
        node = leaf_id
        conds: List[str] = []
        while node != 0:  # 0 é a raiz
            parent = parents_map[node]
            feat_idx = tree_.feature[parent]
            thresh = tree_.threshold[parent]
            if tree_.children_left[parent] == node:
                cond = f"{features[feat_idx]} <= {thresh:.3f}"
            else:
                cond = f"{features[feat_idx]} > {thresh:.3f}"
            conds.append(cond)
            node = parent
        conds = list(reversed(conds))

        n_node_samples = int(tree_.n_node_samples[leaf_id])
        value = tree_.value[leaf_id][0]
        pred_class = class_names[int(np.argmax(value))]
        rule = f"IF {' AND '.join(conds) if conds else 'TRUE'} THEN Target = {pred_class} (suporte={n_node_samples})"
        return rule, n_node_samples, pred_class

    leaf_ids = [i for i in range(tree_.node_count) if tree_.children_left[i] == -1]
    rules = [_node_to_rule(leaf_id) for leaf_id in leaf_ids]
    # ordena por suporte decrescente
    rules.sort(key=lambda x: x[1], reverse=True)
    rules_str = [r[0] for r in rules]
    if max_rules is not None:
        rules_str = rules_str[:max_rules]
    return rules_str


def save_metrics_csv(
    y_true: pd.Series,
    y_pred: np.ndarray,
    labels: List[str],
    out_dir: str,
    prefix: str,
) -> tuple[str, str]:
    """Salva relatório de classificação e matriz de confusão em CSVs.

    Retorna os caminhos (report_csv_path, cm_csv_path).
    """
    # Relatório de classificação
    try:
        report_dict = classification_report(
            y_true, y_pred, labels=labels, output_dict=True, digits=6, zero_division=0
        )
        report_df = pd.DataFrame(report_dict).transpose()
        report_csv_path = os.path.join(out_dir, f"metrics_{prefix}.csv")
        report_df.to_csv(report_csv_path, index=True)
        print(f"Relatório de classificação salvo em: {report_csv_path}")
    except Exception as e:
        report_csv_path = ""
        print(f"Aviso: não foi possível salvar metrics_{prefix}.csv: {e}")

    # Matriz de confusão
    try:
        cm = confusion_matrix(y_true, y_pred, labels=labels)
        cm_df = pd.DataFrame(
            cm,
            index=[f"true_{l}" for l in labels],
            columns=[f"pred_{l}" for l in labels],
        )
        cm_csv_path = os.path.join(out_dir, f"confusion_matrix_{prefix}.csv")
        cm_df.to_csv(cm_csv_path, index=True)
        print(f"Matriz de confusão salva em: {cm_csv_path}")
    except Exception as e:
        cm_csv_path = ""
        print(f"Aviso: não foi possível salvar confusion_matrix_{prefix}.csv: {e}")

    return report_csv_path, cm_csv_path


def save_tree_artifacts(art: ModelArtifacts, tree_txt: str) -> None:
    """Salva artefatos da árvore: texto, DOT e PNG."""
    out_dir = os.path.dirname(__file__)
    # Salva árvore textual separadamente
    tree_txt_path = os.path.join(out_dir, "tree.txt")
    try:
        with open(tree_txt_path, "w", encoding="utf-8") as f:
            f.write(tree_txt)
        print(f"Árvore (texto) salva em: {tree_txt_path}")
    except Exception as e:
        print(f"Aviso: não foi possível salvar tree.txt: {e}")

    # Salva DOT
    try:
        from sklearn.tree import export_graphviz

        dot_path = os.path.join(out_dir, "tree.dot")
        export_graphviz(
            art.clf,
            out_file=dot_path,
            feature_names=art.feature_names,
            class_names=art.class_names,
            filled=True,
            rounded=True,
            special_characters=True,
        )
        print(f"DOT da árvore salvo em: {dot_path}")
    except Exception as e:
        print(f"Aviso: não foi possível salvar DOT da árvore: {e}")

    # Salva PNG
    try:
        import matplotlib.pyplot as plt
        from sklearn import tree as sktree

        fig, ax = plt.subplots(figsize=(14, 10))
        sktree.plot_tree(
            art.clf,
            feature_names=art.feature_names,
            class_names=art.class_names,
            filled=True,
            rounded=True,
            proportion=True,
            fontsize=8,
        )
        plt.tight_layout()
        png_path = os.path.join(out_dir, "tree.png")
        fig.savefig(png_path, dpi=150)
        plt.close(fig)
        print(f"Imagem da árvore salva em: {png_path}")
    except Exception as e:
        print(f"Aviso: não foi possível salvar a imagem da árvore: {e}")


def save_rules_artifact(rules: List[str]) -> None:
    """Salva apenas as regras em um arquivo separado."""
    out_dir = os.path.dirname(__file__)
    rules_path = os.path.join(out_dir, "rules.txt")
    try:
        with open(rules_path, "w", encoding="utf-8") as f:
            f.write("===== Regras =====\n")
            f.write("\n".join(rules))
        print(f"Regras salvas em: {rules_path}")
    except Exception as e:
        print(f"Aviso: não foi possível salvar rules.txt: {e}")


def main():
    parser = argparse.ArgumentParser(
        description="Árvore de decisão para prever evasão/sucesso acadêmico"
    )
    parser.add_argument(
        "--data",
        default=DEFAULT_DATASET_PATH,
        help="Caminho para o CSV do dataset (padrão: data/dataset2.csv)",
    )
    parser.add_argument(
        "--max_depth",
        type=int,
        default=5,
        help="Profundidade máxima da árvore (padrão: 5)",
    )
    parser.add_argument(
        "--no_save",
        action="store_true",
        help="Não salvar arquivos auxiliares (rules.txt, tree.dot, tree.png)",
    )
    args = parser.parse_args()

    X, y = load_dataset(args.data)
    # Split estratificado para manter distribuição de classes
    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.25, random_state=42, stratify=y
    )

    art = train_decision_tree(
        X_train, y_train, max_depth=args.max_depth, random_state=42
    )
    y_pred = art.clf.predict(X_test)
    print_metrics(y_test, y_pred)

    tree_txt = print_text_tree(art)
    rules = generate_rules(art, max_rules=30)
    print("\n===== Regras (topo) =====")
    for r in rules:
        print(r)

    if not args.no_save:
        save_tree_artifacts(art, tree_txt)
        save_rules_artifact(rules)
        # Salvar métricas em CSV (treino e teste)
        out_dir = os.path.dirname(__file__)
        labels = sorted(list(np.unique(y)))
        _ = save_metrics_csv(
            y_train, art.clf.predict(X_train), labels, out_dir, prefix="train"
        )
        _ = save_metrics_csv(y_test, y_pred, labels, out_dir, prefix="test")


if __name__ == "__main__":
    main()
