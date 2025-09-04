"""
Árvore de decisão CART (Gini, splits binários) para o dataset1 (risco de crédito).

O script:
- Lê data/dataset1.csv (classe alvo: 'Risco', ignora coluna 'ID');
- Constrói a árvore com o algoritmo CART (impureza de Gini) suportando atributos numéricos e categóricos;
  - para atributos numéricos testa thresholds entre valores adjacentes;
  - para atributos categóricos testa splits binários do tipo (attr == valor) vs (attr != valor);
- Exibe no terminal TODOS os cálculos por nó:
  - distribuição de classes, gini do nó;
  - para cada atributo candidato: gini(s) dos filhos, gini ponderada e redução de gini (Gini decrease);
  - split escolhido e divisão (atributo + threshold/valor);
- Gera:
  - uma imagem PNG `tree_cart.png` desenhada com matplotlib;
  - um arquivo DOT `tree_cart.dot` (pode ser renderizado com Graphviz, opcional).

Execução:
    python activity1/question1/cart/main.py

Parâmetros opcionais:
  --data <caminho_csv> (padrão: data/dataset1.csv)
  --no_png (não salvar PNG)
  --no_dot (não salvar DOT)

Requisitos: pandas, matplotlib, numpy (listar em requirements.txt se necessário)
"""

from __future__ import annotations

import argparse
import math
import os
from dataclasses import dataclass, field
from typing import Any, Dict, List, Optional, Tuple

import matplotlib.pyplot as plt
import numpy as np
import pandas as pd

try:
    from activity1.common import get_repo_root, get_data_path
except Exception:
    import sys as _sys, os as _os

    _sys.path.append(
        _os.path.abspath(_os.path.join(_os.path.dirname(__file__), "..", "..", ".."))
    )
    from activity1.common import get_repo_root, get_data_path


DEFAULT_DATASET_PATH = get_data_path("dataset1.csv")


# ---------------------------
# Utilitários de Gini / CART
# ---------------------------


def gini(class_counts: Dict[str, int]) -> float:
    """Impureza de Gini. class_counts: mapa classe->contagem."""
    n = sum(class_counts.values())
    if n == 0:
        return 0.0
    s = 0.0
    for k in class_counts.values():
        p = k / n
        s += p * p
    return 1.0 - s


def class_distribution(df: pd.DataFrame, target: str) -> Dict[str, int]:
    counts = df[target].value_counts(dropna=False).to_dict()
    return {str(k): int(v) for k, v in counts.items()}


def evaluate_binary_split(
    df_left: pd.DataFrame, df_right: pd.DataFrame, target: str
) -> Tuple[float, Dict[str, Any]]:
    """Return (gini_weighted, details) where details include gini_left/right and counts/weights."""
    n_left = len(df_left)
    n_right = len(df_right)
    n_total = n_left + n_right
    left_counts = class_distribution(df_left, target) if n_left > 0 else {}
    right_counts = class_distribution(df_right, target) if n_right > 0 else {}
    g_left = gini(left_counts)
    g_right = gini(right_counts)
    w_left = n_left / n_total if n_total > 0 else 0.0
    w_right = n_right / n_total if n_total > 0 else 0.0
    g_weighted = w_left * g_left + w_right * g_right
    details = {
        "n_left": n_left,
        "n_right": n_right,
        "left_counts": left_counts,
        "right_counts": right_counts,
        "g_left": g_left,
        "g_right": g_right,
        "w_left": w_left,
        "w_right": w_right,
        "g_weighted": g_weighted,
    }
    return g_weighted, details


# ---------------------------
# Estruturas da árvore CART
# ---------------------------


@dataclass
class CARTNode:
    depth: int
    samples: int
    class_counts: Dict[str, int]
    gini: float
    split_attr: Optional[str] = None
    split_type: Optional[str] = None  # 'le' (<=) para numérico ou 'eq' para categórico
    split_value: Optional[Any] = None  # threshold (numérico) ou categoria (valor)
    tested_splits: List[Tuple[str, Any, float, Dict[str, Any]]] = field(
        default_factory=list
    )
    left: Optional["CARTNode"] = None
    right: Optional["CARTNode"] = None
    predicted_class: Optional[str] = None

    def is_leaf(self) -> bool:
        return self.predicted_class is not None


class CARTDecisionTree:
    def __init__(self, target: str):
        self.target = target
        self.root: Optional[CARTNode] = None

    def fit(self, df: pd.DataFrame, features: List[str]) -> None:
        self.root = self._build(df, features, depth=0)

    # -------------------
    # Regras (base de regras)
    # -------------------
    def extract_rules(self) -> List[Dict[str, Any]]:
        assert self.root is not None
        rules: List[Dict[str, Any]] = []
        N_total = max(1, self.root.samples)

        def dfs(n: CARTNode, conditions: List[Tuple[str, str, Any]]):
            if n.is_leaf():
                n_samples = n.samples
                cc = n.class_counts
                y = n.predicted_class or (max(cc, key=lambda k: cc[k]) if cc else "?")
                hits = cc.get(y, 0) if cc else 0
                confidence = (hits / n_samples) if n_samples > 0 else 0.0
                support = (n_samples / N_total) if N_total > 0 else 0.0
                rules.append(
                    {
                        "conditions": list(conditions),
                        "predicted_class": y,
                        "n": n_samples,
                        "class_counts": cc,
                        "support": support,
                        "confidence": confidence,
                        "hits": hits,
                    }
                )
                return
            # nó interno binário
            if n.split_attr is None or n.split_type is None:
                return
            if n.split_type == "le":
                left_cond = (n.split_attr, "<=", n.split_value)
                right_cond = (n.split_attr, ">", n.split_value)
            else:
                left_cond = (n.split_attr, "=", n.split_value)
                right_cond = (n.split_attr, "!=", n.split_value)
            if n.left is not None:
                dfs(n.left, conditions + [left_cond])
            if n.right is not None:
                dfs(n.right, conditions + [right_cond])

        dfs(self.root, [])
        return rules

    def export_rules_txt(self, out_path: str) -> None:
        assert self.root is not None
        rules = self.extract_rules()
        lines: List[str] = []
        lines.append(f"# Base de regras (CART) — alvo: {self.target}")
        lines.append(f"# Total de amostras de treino: {self.root.samples}")
        for i, r in enumerate(rules, start=1):
            conds = (
                " E ".join([f"{a} {op} {v}" for (a, op, v) in r["conditions"]])
                or "(sempre)"
            )
            cls = r["predicted_class"]
            n = r["n"]
            sup = r["support"] * 100.0
            conf = r["confidence"] * 100.0
            dist = ", ".join(f"{k}:{v}" for k, v in r["class_counts"].items())
            lines.append(
                f"Regra {i}: SE {conds} ENTÃO {self.target} = {cls} (n={n}, suporte={sup:.2f}%, confiança={conf:.2f}%, dist=[{dist}])"
            )
        os.makedirs(os.path.dirname(out_path), exist_ok=True)
        with open(out_path, "w", encoding="utf-8") as f:
            f.write("\n".join(lines) + "\n")

    def _build(self, df: pd.DataFrame, features: List[str], depth: int) -> CARTNode:
        counts = class_distribution(df, self.target)
        node_gini = gini(counts)
        node = CARTNode(
            depth=depth, samples=len(df), class_counts=counts, gini=node_gini
        )

        # Log do nó
        print("\n" + "-" * 80)
        print(f"Nó (profundidade={depth})")
        print(
            f"Amostras: {node.samples} | Distribuição de classes: {counts} | Gini: {node_gini:.6f}"
        )

        # Critérios de parada
        if node_gini == 0.0:
            node.predicted_class = max(counts.items(), key=lambda kv: kv[1])[0]
            print(f"Folha pura: classe={node.predicted_class}")
            return node
        if not features:
            node.predicted_class = max(counts.items(), key=lambda kv: kv[1])[0]
            print(f"Folha (sem atributos): classe majoritária={node.predicted_class}")
            return node

        best_attr = None
        best_type = None
        best_value = None
        best_g_weighted = float("inf")
        best_details: Dict[str, Any] = {}

        # Testa cada atributo
        for attr in features:
            col = df[attr]
            # Numérico -> testar thresholds entre valores únicos ordenados
            if pd.api.types.is_numeric_dtype(col):
                uniq = sorted(col.dropna().unique())
                # se só 1 valor distinto, ignora
                if len(uniq) <= 1:
                    continue
                # candidatos: médias entre vizinhos
                thresholds = [
                    (uniq[i] + uniq[i + 1]) / 2.0 for i in range(len(uniq) - 1)
                ]
                for t in thresholds:
                    left = df[df[attr] <= t]
                    right = df[df[attr] > t]
                    g_w, details = evaluate_binary_split(left, right, self.target)
                    g_decrease = node_gini - g_w
                    node.tested_splits.append((attr, ("le", t), g_decrease, details))
                    print(
                        f"\nAtributo numérico '{attr}' <= {t:.6f}: g_left={details['g_left']:.6f} n_left={details['n_left']} | g_right={details['g_right']:.6f} n_right={details['n_right']} -> g_ponderada={g_w:.6f} | delta Gini={g_decrease:.6f}"
                    )
                    if g_w < best_g_weighted or (
                        math.isclose(g_w, best_g_weighted, rel_tol=1e-12)
                        and (best_attr is None or (attr, t) < (best_attr, best_value))
                    ):
                        (
                            best_attr,
                            best_type,
                            best_value,
                            best_g_weighted,
                            best_details,
                        ) = (
                            attr,
                            "le",
                            t,
                            g_w,
                            details,
                        )

            else:
                # Categórico: testamos split binário por valor (attr == v) vs restante
                uniq = col.dropna().unique()
                for v in uniq:
                    left = df[df[attr] == v]
                    right = df[df[attr] != v]
                    g_w, details = evaluate_binary_split(left, right, self.target)
                    g_decrease = node_gini - g_w
                    node.tested_splits.append((attr, ("eq", v), g_decrease, details))
                    print(
                        f"\nAtributo categórico '{attr}' == {v}: g_left={details['g_left']:.6f} n_left={details['n_left']} | g_right={details['g_right']:.6f} n_right={details['n_right']} -> g_ponderada={g_w:.6f} | delta Gini={g_decrease:.6f}"
                    )
                    if g_w < best_g_weighted or (
                        math.isclose(g_w, best_g_weighted, rel_tol=1e-12)
                        and (
                            best_attr is None
                            or (attr, str(v)) < (best_attr, str(best_value))
                        )
                    ):
                        (
                            best_attr,
                            best_type,
                            best_value,
                            best_g_weighted,
                            best_details,
                        ) = (
                            attr,
                            "eq",
                            v,
                            g_w,
                            details,
                        )

        # Se não encontrou split com redução (melhora) -> folha por maioria
        if best_attr is None or (node_gini - best_g_weighted) <= 0.0:
            node.predicted_class = max(counts.items(), key=lambda kv: kv[1])[0]
            print(f"Folha (sem split útil): classe majoritária={node.predicted_class}")
            return node

        node.split_attr = best_attr
        node.split_type = best_type
        node.split_value = best_value
        g_delta = node_gini - best_g_weighted
        print(
            f"\n=> Escolhido split: {best_attr} {'<=' if best_type=='le' else '=='} {best_value} | Gini_before={node_gini:.6f} Gini_after={best_g_weighted:.6f} delta={g_delta:.6f}"
        )

        # Cria filhos e recursão
        remaining = [a for a in features if a != best_attr]
        if node.split_type == "le":
            left_df = df[df[best_attr] <= best_value]
            right_df = df[df[best_attr] > best_value]
        else:
            left_df = df[df[best_attr] == best_value]
            right_df = df[df[best_attr] != best_value]

        print(f"  Gerando filho LEFT (n={len(left_df)}) and RIGHT (n={len(right_df)})")
        node.left = self._build(
            left_df.drop(columns=[best_attr]) if len(left_df) > 0 else left_df,
            remaining,
            depth + 1,
        )
        node.right = self._build(
            right_df.drop(columns=[best_attr]) if len(right_df) > 0 else right_df,
            remaining,
            depth + 1,
        )

        return node

    # -------------------
    # Exportações/plots (DOT / PNG)
    # -------------------

    def export_dot(self) -> str:
        assert self.root is not None
        lines: List[str] = [
            "digraph CART {",
            "  node [shape=box, style=rounded, fontsize=10];",
        ]
        _id_counter = [0]

        def next_id() -> int:
            _id_counter[0] += 1
            return _id_counter[0]

        def escape(s: str) -> str:
            return str(s).replace("\n", "\\n").replace('"', '\\"')

        def label_for(node: CARTNode) -> str:
            dist_str = ", ".join(f"{k}:{v}" for k, v in node.class_counts.items())
            if node.is_leaf():
                return escape(
                    f"Leaf\nN={node.samples}\nG={node.gini:.3f}\nDist:[{dist_str}]\nClass={node.predicted_class}"
                )
            else:
                split_repr = (
                    f"{node.split_attr} <= {node.split_value}"
                    if node.split_type == "le"
                    else f"{node.split_attr} == {node.split_value}"
                )
                return escape(
                    f"N={node.samples} G={node.gini:.3f}\nDist:[{dist_str}]\nSplit: {split_repr}"
                )

        def walk(node: CARTNode) -> int:
            nid = next_id()
            lines.append(f'  n{nid} [label="{label_for(node)}"];')
            if not node.is_leaf():
                if node.left is not None:
                    cid = walk(node.left)
                    lines.append(f'  n{nid} -> n{cid} [label="L"];')
                if node.right is not None:
                    cid = walk(node.right)
                    lines.append(f'  n{nid} -> n{cid} [label="R"];')
            return nid

        walk(self.root)
        lines.append("}")
        return "\n".join(lines)

    def plot_png(self, out_path: str) -> None:
        assert self.root is not None

        # layout e anotação similares ao script ID3
        def subtree_leaves(node: CARTNode) -> int:
            if node.is_leaf() or (node.left is None and node.right is None):
                return 1
            s = 0
            if node.left is not None:
                s += subtree_leaves(node.left)
            if node.right is not None:
                s += subtree_leaves(node.right)
            return s

        def annotate(node: CARTNode) -> str:
            dist_str = ", ".join(f"{k}:{v}" for k, v in node.class_counts.items())
            if node.is_leaf():
                return f"Leaf\nN={node.samples}\nG={node.gini:.3f}\n[{dist_str}]\nClass={node.predicted_class}"
            split_repr = (
                f"{node.split_attr} <= {node.split_value}"
                if node.split_type == "le"
                else f"{node.split_attr} == {node.split_value}"
            )
            return (
                f"N={node.samples} G={node.gini:.3f}\n[{dist_str}]\nSplit: {split_repr}"
            )

        x_gap = 1.0
        y_gap = 1.6

        def assign_pos(
            node: CARTNode, depth: int, x_start: float
        ) -> Tuple[float, float, float]:
            width = subtree_leaves(node)
            x_center = x_start + (width - 1) * x_gap / 2.0
            y = -depth * y_gap
            positions[id(node)] = (x_center, y)
            cur_x = x_start
            if node.left is not None:
                ch_width = subtree_leaves(node.left)
                assign_pos(node.left, depth + 1, cur_x)
                cur_x += ch_width * x_gap
            if node.right is not None:
                ch_width = subtree_leaves(node.right)
                assign_pos(node.right, depth + 1, cur_x)
                cur_x += ch_width * x_gap
            return x_center, y, width

        positions: Dict[int, Tuple[float, float]] = {}
        assign_pos(self.root, 0, 0.0)

        def walk_nodes(node: CARTNode):
            yield node
            if node.left is not None:
                yield from walk_nodes(node.left)
            if node.right is not None:
                yield from walk_nodes(node.right)

        fig_h = max(3, (max(n.depth for n in walk_nodes(self.root)) + 1) * 1.8)
        fig_w = max(6, subtree_leaves(self.root) * 1.2)
        fig, ax = plt.subplots(figsize=(fig_w, fig_h))
        ax.axis("off")

        def draw_edges(node: CARTNode):
            x0, y0 = positions[id(node)]
            if node.left is not None:
                x1, y1 = positions[id(node.left)]
                ax.plot([x0, x1], [y0 - 0.1, y1 + 0.1], linewidth=1)
                mx, my = (x0 + x1) / 2.0, (y0 + y1) / 2.0
                ax.text(
                    mx,
                    my,
                    "L",
                    fontsize=8,
                    ha="center",
                    va="center",
                    bbox=dict(fc="white", ec="none", alpha=0.7),
                )
                draw_edges(node.left)
            if node.right is not None:
                x1, y1 = positions[id(node.right)]
                ax.plot([x0, x1], [y0 - 0.1, y1 + 0.1], linewidth=1)
                mx, my = (x0 + x1) / 2.0, (y0 + y1) / 2.0
                ax.text(
                    mx,
                    my,
                    "R",
                    fontsize=8,
                    ha="center",
                    va="center",
                    bbox=dict(fc="white", ec="none", alpha=0.7),
                )
                draw_edges(node.right)

        def draw_nodes(node: CARTNode):
            x, y = positions[id(node)]
            text = annotate(node)
            bbox_props = dict(
                boxstyle="round,pad=0.3",
                fc="#FFF3E0" if not node.is_leaf() else "#E8F5E9",
                ec="#90A4AE",
            )
            ax.text(x, y, text, fontsize=8, ha="center", va="center", bbox=bbox_props)
            if node.left is not None:
                draw_nodes(node.left)
            if node.right is not None:
                draw_nodes(node.right)

        draw_edges(self.root)
        draw_nodes(self.root)
        plt.tight_layout()
        os.makedirs(os.path.dirname(out_path), exist_ok=True)
        fig.savefig(out_path, dpi=160)
        plt.close(fig)


# ---------------------------
# Execução de script
# ---------------------------


def main():
    parser = argparse.ArgumentParser(
        description="Gera árvore CART para dataset1 com logs de cálculos"
    )
    parser.add_argument(
        "--data",
        default=DEFAULT_DATASET_PATH,
        help="Caminho para o CSV (padrão: data/dataset1.csv)",
    )
    parser.add_argument(
        "--no_png", action="store_true", help="Não salvar PNG da árvore"
    )
    parser.add_argument(
        "--no_dot", action="store_true", help="Não salvar DOT da árvore"
    )
    args = parser.parse_args()

    csv_path = args.data
    if not os.path.isabs(csv_path):
        repo_root = get_repo_root(__file__)
        csv_path = os.path.abspath(os.path.join(repo_root, csv_path))

    print(f"Lendo dataset: {csv_path}")
    df = pd.read_csv(csv_path)

    if "Risco" not in df.columns:
        raise ValueError("Coluna alvo 'Risco' não encontrada no CSV.")
    if "ID" in df.columns:
        df = df.drop(columns=["ID"])  # identificador, não usar como atributo

    target = "Risco"
    features = [c for c in df.columns if c != target]

    print("Atributos:")
    for f in features:
        print(f"- {f} -> valores: {sorted(df[f].dropna().unique().tolist())}")

    tree = CARTDecisionTree(target=target)
    tree.fit(df, features)

    out_dir = os.path.dirname(__file__)
    if not args.no_dot:
        dot_text = tree.export_dot()
        dot_path = os.path.join(out_dir, "tree_cart.dot")
        with open(dot_path, "w", encoding="utf-8") as f:
            f.write(dot_text)
        print(f"\nDOT salvo em: {dot_path}")

    if not args.no_png:
        png_path = os.path.join(out_dir, "tree_cart.png")
        tree.plot_png(png_path)
        print(f"PNG salvo em: {png_path}")

    # Exporta base de regras
    rules_path = os.path.join(out_dir, "rules_cart.txt")
    tree.export_rules_txt(rules_path)
    print(f"Regras salvas em: {rules_path}")


if __name__ == "__main__":
    main()
