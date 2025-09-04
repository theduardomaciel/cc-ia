from __future__ import annotations

import argparse
import os

import os
import sys

# Permite executar diretamente o script adicionando activity1/question1 ao sys.path
CURRENT_DIR = os.path.dirname(__file__)
QUESTION1_DIR = os.path.dirname(CURRENT_DIR)
if QUESTION1_DIR not in sys.path:
    sys.path.insert(0, QUESTION1_DIR)

from _sklearn_tree_utils import (
    extract_rules_from_tree_ohe,
    load_dataset,
    resolve_csv_path,
    save_dot_png,
    save_rules_txt,
    train_tree_with_ohe,
)


def main():
    parser = argparse.ArgumentParser(
        description="ID3 (approx) com scikit-learn (entropy)"
    )
    parser.add_argument("--data", default="data/dataset1.csv")
    parser.add_argument("--no_png", action="store_true")
    parser.add_argument("--no_dot", action="store_true")
    args = parser.parse_args()

    base_dir = QUESTION1_DIR  # activity1/question1
    csv_path = resolve_csv_path(base_dir, args.data)
    X, y = load_dataset(csv_path, target="Risco")

    clf, ohe, feat_names, classes = train_tree_with_ohe(X, y, criterion="entropy")

    # Salvar árvore
    out_dir = os.path.dirname(__file__)
    dot_path = None if args.no_dot else os.path.join(out_dir, "tree_id3_sklearn.dot")
    png_path = None if args.no_png else os.path.join(out_dir, "tree_id3_sklearn.png")
    save_dot_png(clf, feat_names, classes, dot_path, png_path)

    # Regras
    rules = extract_rules_from_tree_ohe(clf, feat_names, classes)
    rules_path = os.path.join(out_dir, "rules_id3_sklearn.txt")
    save_rules_txt(
        rules,
        target="Risco",
        out_path=rules_path,
        header="Base de regras (ID3 - sklearn entropy)",
    )
    print(f"Regras salvas em: {rules_path}")


if __name__ == "__main__":
    main()
