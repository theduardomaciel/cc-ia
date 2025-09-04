"""
Árvore de decisão C4.5 (Gain Ratio) para o dataset2 (risco de crédito).

O script:
- Lê data/dataset2.csv (classe: 'Risco', ignora coluna 'ID');
- Constrói a árvore usando Gain Ratio (C4.5) para atributos categóricos;
- Exibe no terminal os cálculos por nó: entropia do nó, IG, SplitInfo e GainRatio por atributo;
- Gera DOT (tree_c45.dot) e PNG (tree_c45.png) com os valores no label dos nós.

Execução:
  python activity1/question1/c4.5/main.py

Parâmetros opcionais:
  --data <caminho_csv> (padrão: data/dataset2.csv)
  --no_png  (não salvar PNG)
  --no_dot  (não salvar DOT)
"""

from __future__ import annotations

import argparse
import math
import os
from dataclasses import dataclass, field
from typing import Any, Dict, List, Optional, Tuple

import matplotlib.pyplot as plt
import pandas as pd


DEFAULT_DATASET_PATH = os.path.join(
    os.path.dirname(os.path.dirname(os.path.dirname(os.path.dirname(__file__)))),
    "data",
    "dataset2.csv",
)


def entropy(class_counts: Dict[str, int]) -> float:
    n = sum(class_counts.values())
    if n == 0:
        return 0.0
    ent = 0.0
    for k in class_counts.values():
        if k == 0:
            continue
        p = k / n
        ent -= p * math.log2(p)
    return ent


def class_distribution(df: pd.DataFrame, target: str) -> Dict[str, int]:
    return {
        str(k): int(v)
        for k, v in df[target].value_counts(dropna=False).to_dict().items()
    }


def info_gain_and_splitinfo(
    df: pd.DataFrame, attr: str, target: str
) -> Tuple[float, float, Dict[Any, Dict[str, Any]]]:
    total_counts = class_distribution(df, target)
    h_before = entropy(total_counts)
    n_total = len(df)

    details: Dict[Any, Dict[str, Any]] = {}
    h_after = 0.0
    split_info = 0.0
    for v, df_v in df.groupby(attr):
        cc = class_distribution(df_v, target)
        h_v = entropy(cc)
        w = len(df_v) / n_total
        details[v] = {
            "n": int(len(df_v)),
            "class_counts": cc,
            "entropy": h_v,
            "weight": w,
        }
        h_after += w * h_v
        if w > 0:
            split_info -= w * math.log2(w)

    ig = h_before - h_after
    return ig, split_info, details


@dataclass
class Node:
    depth: int
    samples: int
    class_counts: Dict[str, int]
    entropy: float
    split_attr: Optional[str] = None
    split_ig: float = 0.0
    split_si: float = 0.0
    split_gr: float = 0.0
    tested_attrs: List[Tuple[str, float, float, Dict[Any, Dict[str, Any]]]] = field(
        default_factory=list
    )
    children: Dict[Any, "Node"] = field(default_factory=dict)
    predicted_class: Optional[str] = None

    def is_leaf(self) -> bool:
        return self.predicted_class is not None


class C45DecisionTree:
    def __init__(self, target: str):
        self.target = target
        self.root: Optional[Node] = None

    def fit(self, df: pd.DataFrame, features: List[str]) -> None:
        self.root = self._build(df, features, depth=0)

    # -------------------
    # Regras (base de regras)
    # -------------------
    def extract_rules(self) -> List[Dict[str, Any]]:
        assert self.root is not None

        rules: List[Dict[str, Any]] = []
        N_total = max(1, self.root.samples)

        def dfs(n: Node, conditions: List[Tuple[str, str, Any]]):
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
            split_attr = n.split_attr or "?"
            for val, ch in n.children.items():
                dfs(ch, conditions + [(split_attr, "=", val)])

        dfs(self.root, [])
        return rules

    def export_rules_txt(self, out_path: str) -> None:
        assert self.root is not None
        rules = self.extract_rules()
        lines: List[str] = []
        lines.append(f"# Base de regras (C4.5) — alvo: {self.target}")
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

    def _build(self, df: pd.DataFrame, features: List[str], depth: int) -> Node:
        counts = class_distribution(df, self.target)
        node_entropy = entropy(counts)
        node = Node(
            depth=depth, samples=len(df), class_counts=counts, entropy=node_entropy
        )

        print("\n" + "-" * 80)
        print(f"Nó (profundidade={depth})")
        print(
            f"Amostras: {node.samples} | Distribuição: {counts} | Entropia: {node_entropy:.4f}"
        )

        if node_entropy == 0.0:
            node.predicted_class = max(counts.items(), key=lambda kv: kv[1])[0]
            print(f"Folha pura: classe={node.predicted_class}")
            return node
        if not features:
            node.predicted_class = max(counts.items(), key=lambda kv: kv[1])[0]
            print(f"Folha (sem atributos): classe majoritária={node.predicted_class}")
            return node

        best_attr = None
        best_gr = -1.0
        best_ig = 0.0
        best_si = 0.0
        best_details: Dict[Any, Dict[str, Any]] = {}
        for attr in features:
            ig, si, details = info_gain_and_splitinfo(df, attr, self.target)
            gr = 0.0 if si <= 1e-12 else (ig / si)
            node.tested_attrs.append((attr, ig, si, details))
            print(
                f"\nAtributo '{attr}': IG={ig:.6f} | SplitInfo={si:.6f} | GainRatio={gr:.6f}"
            )
            for v, d in details.items():
                print(
                    f"  - {attr} = {v} -> n={d['n']}, dist={d['class_counts']}, H={d['entropy']:.4f}, peso={d['weight']:.3f}"
                )
            if gr > best_gr or (
                math.isclose(gr, best_gr, rel_tol=1e-12)
                and (best_attr is None or attr < best_attr)
            ):
                best_attr, best_gr, best_ig, best_si, best_details = (
                    attr,
                    gr,
                    ig,
                    si,
                    details,
                )

        if best_attr is None or best_gr <= 0.0:
            node.predicted_class = max(counts.items(), key=lambda kv: kv[1])[0]
            print(f"Folha (GainRatio<=0): classe majoritária={node.predicted_class}")
            return node

        node.split_attr = best_attr
        node.split_gr = float(best_gr)
        node.split_ig = float(best_ig)
        node.split_si = float(best_si)
        print(
            f"\n=> Escolhido split por '{best_attr}' (GainRatio={best_gr:.6f}, IG={best_ig:.6f}, SI={best_si:.6f})"
        )

        remaining = [a for a in features if a != best_attr]
        for v, df_child in df.groupby(best_attr):
            print(f"  Gerando filho para {best_attr} = {v} (n={len(df_child)})")
            child = self._build(
                df_child.drop(columns=[best_attr]), remaining, depth + 1
            )
            node.children[v] = child

        return node

    def export_dot(self) -> str:
        assert self.root is not None
        lines: List[str] = [
            "digraph C45 {",
            "  node [shape=box, style=rounded, fontsize=10];",
        ]
        _id = [0]

        def nid() -> int:
            _id[0] += 1
            return _id[0]

        def esc(s: str) -> str:
            return str(s).replace("\n", "\\n").replace('"', '\\"')

        def label(n: Node) -> str:
            dist_str = ", ".join(f"{k}:{v}" for k, v in n.class_counts.items())
            if n.is_leaf():
                return esc(
                    f"Leaf\\nN={n.samples}\\nH={n.entropy:.3f}\\n[{dist_str}]\\nClass={n.predicted_class}"
                )
            return esc(
                f"N={n.samples} H={n.entropy:.3f}\\n[{dist_str}]\\nSplit: {n.split_attr}\\nGR={n.split_gr:.3f} (IG={n.split_ig:.3f}, SI={n.split_si:.3f})"
            )

        def walk(n: Node) -> int:
            i = nid()
            lines.append(f'  n{i} [label="{label(n)}"];')
            if not n.is_leaf():
                for val, ch in n.children.items():
                    j = walk(ch)
                    lines.append(f'  n{i} -> n{j} [label="{esc(val)}"];')
            return i

        walk(self.root)
        lines.append("}")
        return "\n".join(lines)

    def plot_png(self, out_path: str) -> None:
        assert self.root is not None

        def subtree_leaves(n: Node) -> int:
            if n.is_leaf() or not n.children:
                return 1
            return sum(subtree_leaves(ch) for ch in n.children.values())

        def annotate(n: Node) -> str:
            dist_str = ", ".join(f"{k}:{v}" for k, v in n.class_counts.items())
            if n.is_leaf():
                return f"Leaf\nN={n.samples}\nH={n.entropy:.3f}\n[{dist_str}]\nClass={n.predicted_class}"
            return f"N={n.samples} H={n.entropy:.3f}\n[{dist_str}]\nSplit: {n.split_attr}\nGR={n.split_gr:.3f} (IG={n.split_ig:.3f}, SI={n.split_si:.3f})"

        x_gap = 1.0
        y_gap = 1.5

        positions: Dict[int, Tuple[float, float]] = {}

        def assign_pos(
            n: Node, depth: int, x_start: float
        ) -> Tuple[float, float, float]:
            width = subtree_leaves(n)
            x_center = x_start + (width - 1) * x_gap / 2.0
            y = -depth * y_gap
            positions[id(n)] = (x_center, y)
            cur_x = x_start
            for ch in n.children.values():
                ch_w = subtree_leaves(ch)
                assign_pos(ch, depth + 1, cur_x)
                cur_x += ch_w * x_gap
            return x_center, y, width

        assign_pos(self.root, 0, 0.0)

        def walk_nodes(n: Node):
            yield n
            for ch in n.children.values():
                yield from walk_nodes(ch)

        fig_h = max(3, (max(nn.depth for nn in walk_nodes(self.root)) + 1) * 1.8)
        fig_w = max(6, subtree_leaves(self.root) * 1.2)
        fig, ax = plt.subplots(figsize=(fig_w, fig_h))
        ax.axis("off")

        def draw_edges(n: Node):
            x0, y0 = positions[id(n)]
            for val, ch in n.children.items():
                x1, y1 = positions[id(ch)]
                ax.plot([x0, x1], [y0 - 0.1, y1 + 0.1], color="#555", linewidth=1)
                mx, my = (x0 + x1) / 2.0, (y0 + y1) / 2.0
                ax.text(
                    mx,
                    my,
                    str(val),
                    fontsize=8,
                    ha="center",
                    va="center",
                    bbox=dict(fc="white", ec="none", alpha=0.7),
                )
                draw_edges(ch)

        def draw_nodes(n: Node):
            x, y = positions[id(n)]
            text = annotate(n)
            bbox_props = dict(
                boxstyle="round,pad=0.3",
                fc="#FFF3E0" if not n.is_leaf() else "#E8F5E9",
                ec="#90A4AE",
            )
            ax.text(x, y, text, fontsize=8, ha="center", va="center", bbox=bbox_props)
            for ch in n.children.values():
                draw_nodes(ch)

        draw_edges(self.root)
        draw_nodes(self.root)
        plt.tight_layout()
        os.makedirs(os.path.dirname(out_path), exist_ok=True)
        fig.savefig(out_path, dpi=160)
        plt.close(fig)


def main():
    parser = argparse.ArgumentParser(
        description="Gera árvore C4.5 (Gain Ratio) para dataset2 com logs"
    )
    parser.add_argument(
        "--data",
        default=DEFAULT_DATASET_PATH,
        help="Caminho para o CSV (padrão: data/dataset2.csv)",
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
        # Sobe três níveis a partir de .../activity1/question1/c4.5 -> raiz do repo (cc-ia)
        repo_root = os.path.abspath(
            os.path.join(os.path.dirname(__file__), "..", "..", "..")
        )
        csv_path = os.path.abspath(os.path.join(repo_root, csv_path))

    print(f"Lendo dataset: {csv_path}")
    df = pd.read_csv(csv_path)
    if "Risco" not in df.columns:
        raise ValueError("Coluna alvo 'Risco' não encontrada.")
    if "ID" in df.columns:
        df = df.drop(columns=["ID"])  # ID não é atributo

    target = "Risco"
    features = [c for c in df.columns if c != target]
    print("Atributos:")
    for f in features:
        print(f"- {f} -> valores: {sorted(df[f].dropna().unique().tolist())}")

    tree = C45DecisionTree(target=target)
    tree.fit(df, features)

    out_dir = os.path.dirname(__file__)
    if not args.no_dot:
        dot_text = tree.export_dot()
        dot_path = os.path.join(out_dir, "tree_c45.dot")
        with open(dot_path, "w", encoding="utf-8") as f:
            f.write(dot_text)
        print(f"DOT salvo em: {dot_path}")

    if not args.no_png:
        png_path = os.path.join(out_dir, "tree_c45.png")
        tree.plot_png(png_path)
        print(f"PNG salvo em: {png_path}")

    # Exporta base de regras
    rules_path = os.path.join(out_dir, "rules_c45.txt")
    tree.export_rules_txt(rules_path)
    print(f"Regras salvas em: {rules_path}")


if __name__ == "__main__":
    main()
