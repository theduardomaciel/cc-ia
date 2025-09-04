"""
Árvore de decisão ID3 para o dataset2 (risco de crédito).

O script:
- Lê data/dataset2.csv (classe alvo: 'Risco', ignora coluna 'ID');
- Constrói a árvore com ID3 (ganho de informação/entropia) para atributos categóricos;
- Exibe no terminal TODOS os cálculos por nó:
  - distribuição de classes, entropia do nó;
  - para cada atributo candidato: entropias parciais e ganho de informação;
  - atributo escolhido e divisão por valor;
- Gera:
  - uma imagem PNG `tree_id3.png` desenhada com matplotlib;
  - um arquivo DOT `tree_id3.dot` (pode ser renderizado com Graphviz, opcional).

Execução:
  python activity1/question1/main.py

Parâmetros opcionais:
  --data <caminho_csv> (padrão: data/dataset2.csv)
  --no_png (não salvar PNG)
  --no_dot (não salvar DOT)

Requisitos: pandas, matplotlib (listados em requirements.txt)
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
    os.path.dirname(os.path.dirname(os.path.dirname(__file__))), "data", "dataset2.csv"
)


# ---------------------------
# Utilitários de entropia/ID3
# ---------------------------


def entropy(class_counts: Dict[str, int]) -> float:
    """Entropia em bits (log2). class_counts: mapa classe->contagem."""
    n = sum(class_counts.values())
    if n == 0:
        return 0.0
    ent = 0.0
    for c, k in class_counts.items():
        if k == 0:
            continue
        p = k / n
        ent -= p * math.log2(p)
    return ent


def class_distribution(df: pd.DataFrame, target: str) -> Dict[str, int]:
    counts = df[target].value_counts(dropna=False).to_dict()
    # Garante chaves como str
    return {str(k): int(v) for k, v in counts.items()}


def info_gain(
    df: pd.DataFrame, attr: str, target: str
) -> Tuple[float, Dict[Any, Dict[str, Any]]]:
    """Retorna (IG, detalhes_por_valor) para o atributo categórico attr.

    detalhes_por_valor[v] = {
            'n': int,
            'class_counts': {classe: cont},
            'entropy': float,
            'weight': float,
    }
    """
    total_counts = class_distribution(df, target)
    h_before = entropy(total_counts)
    n_total = len(df)

    details: Dict[Any, Dict[str, Any]] = {}
    h_after = 0.0
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

    ig = h_before - h_after
    return ig, details


# ---------------------------
# Estruturas da árvore ID3
# ---------------------------


@dataclass
class ID3Node:
    depth: int
    samples: int
    class_counts: Dict[str, int]
    entropy: float
    split_attr: Optional[str] = None
    split_ig: float = 0.0
    # Para debug/log: ganhos testados neste nó
    tested_attrs: List[Tuple[str, float, Dict[Any, Dict[str, Any]]]] = field(
        default_factory=list
    )
    # Filhos: valor do atributo -> nó
    children: Dict[Any, "ID3Node"] = field(default_factory=dict)
    # Classe da folha (se folha)
    predicted_class: Optional[str] = None

    def is_leaf(self) -> bool:
        return self.predicted_class is not None


class ID3DecisionTree:
    def __init__(self, target: str):
        self.target = target
        self.root: Optional[ID3Node] = None

    def fit(self, df: pd.DataFrame, features: List[str]) -> None:
        self.root = self._build(df, features, depth=0)

    # -------------------
    # Regras (base de regras)
    # -------------------

    def extract_rules(self) -> List[Dict[str, Any]]:
        """Extrai regras SE-ENTÃO a partir dos caminhos raiz→folha.

        Cada item possui:
          - conditions: List[Tuple[attr, op, value]]
          - predicted_class: str
          - n: int (amostras na folha)
          - class_counts: Dict[str, int]
          - support: float (n/N_total)
          - confidence: float (count(predicted_class)/n)
        """
        assert self.root is not None

        rules: List[Dict[str, Any]] = []
        N_total = max(1, self.root.samples)

        def dfs(node: ID3Node, conditions: List[Tuple[str, str, Any]]):
            if node.is_leaf():
                n = node.samples
                cc = node.class_counts
                # Usa lambda para evitar ambiguidade de tipos no linter
                y = node.predicted_class or (
                    max(cc, key=lambda k: cc[k]) if cc else "?"
                )
                hits = cc.get(y, 0) if cc else 0
                confidence = (hits / n) if n > 0 else 0.0
                support = (n / N_total) if N_total > 0 else 0.0
                rules.append(
                    {
                        "conditions": list(conditions),
                        "predicted_class": y,
                        "n": n,
                        "class_counts": cc,
                        "support": support,
                        "confidence": confidence,
                        "hits": hits,
                    }
                )
                return
            # nó interno
            split_attr = node.split_attr
            for val, ch in node.children.items():
                cond = (split_attr or "?", "=", val)
                dfs(ch, conditions + [cond])

        dfs(self.root, [])
        return rules

    def export_rules_txt(self, out_path: str) -> None:
        assert self.root is not None
        rules = self.extract_rules()
        lines: List[str] = []
        lines.append(f"# Base de regras (ID3) — alvo: {self.target}")
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
                f"Regra {i}: SE {conds} ENTÃO {self.target} = {cls} "
                f"(n={n}, suporte={sup:.2f}%, confiança={conf:.2f}%, dist=[{dist}])"
            )
        os.makedirs(os.path.dirname(out_path), exist_ok=True)
        with open(out_path, "w", encoding="utf-8") as f:
            f.write("\n".join(lines) + "\n")

    def _build(self, df: pd.DataFrame, features: List[str], depth: int) -> ID3Node:
        counts = class_distribution(df, self.target)
        node_entropy = entropy(counts)
        node = ID3Node(
            depth=depth,
            samples=len(df),
            class_counts=counts,
            entropy=node_entropy,
        )

        # Log: estado do nó
        print("\n" + "-" * 80)
        path_str = f"Nó (profundidade={depth})"
        print(path_str)
        print(
            f"Amostras: {node.samples} | Distribuição de classes: {counts} | Entropia: {node_entropy:.4f}"
        )

        # Critérios de parada
        if node_entropy == 0.0:
            # puro
            node.predicted_class = max(counts.items(), key=lambda kv: kv[1])[0]
            print(f"Folha pura: classe={node.predicted_class}")
            return node
        if not features:
            # sem atributos restantes -> maioria
            node.predicted_class = max(counts.items(), key=lambda kv: kv[1])[0]
            print(f"Folha (sem atributos): classe majoritária={node.predicted_class}")
            return node

        # Avalia IG de cada atributo categórico restante
        best_attr = None
        best_ig = -1.0
        best_details: Dict[Any, Dict[str, Any]] = {}
        for attr in features:
            ig, details = info_gain(df, attr, self.target)
            node.tested_attrs.append((attr, ig, details))
            print(f"\nAtributo '{attr}': IG={ig:.6f}")
            # Mostra detalhes por valor
            for v, d in details.items():
                print(
                    f"  - {attr} = {v} -> n={d['n']}, dist={d['class_counts']}, H={d['entropy']:.4f}, peso={d['weight']:.3f}"
                )
            if ig > best_ig or (
                math.isclose(ig, best_ig, rel_tol=1e-12)
                and (best_attr is None or attr < best_attr)
            ):
                best_attr, best_ig, best_details = attr, ig, details

        # Se IG é zero (ou negativa por numérico), vira folha pela maioria
        if best_attr is None or best_ig <= 0.0:
            node.predicted_class = max(counts.items(), key=lambda kv: kv[1])[0]
            print(f"Folha (IG<=0): classe majoritária={node.predicted_class}")
            return node

        node.split_attr = best_attr
        node.split_ig = float(best_ig)
        print(f"\n=> Escolhido split por '{best_attr}' (IG={best_ig:.6f})")

        # Divide e cria filhos; remove atributo escolhido do conjunto
        remaining = [a for a in features if a != best_attr]
        for v, df_child in df.groupby(best_attr):
            print(f"  Gerando filho para {best_attr} = {v} (n={len(df_child)})")
            child = self._build(
                df_child.drop(columns=[best_attr]), remaining, depth + 1
            )
            node.children[v] = child

        return node

    # -------------------
    # Exportações/plots
    # -------------------

    def export_dot(self) -> str:
        assert self.root is not None
        lines: List[str] = [
            "digraph ID3 {",
            "  node [shape=box, style=rounded, fontsize=10];",
        ]
        _id_counter = [0]

        def next_id() -> int:
            _id_counter[0] += 1
            return _id_counter[0]

        def escape(s: str) -> str:
            return str(s).replace("\n", "\\n").replace('"', '\\"')

        def label_for(node: ID3Node) -> str:
            dist_str = ", ".join(f"{k}:{v}" for k, v in node.class_counts.items())
            if node.is_leaf():
                return escape(
                    f"Leaf\nN={node.samples}\nH={node.entropy:.3f}\nDist:[{dist_str}]\nClass={node.predicted_class}"
                )
            else:
                return escape(
                    f"N={node.samples} H={node.entropy:.3f}\nDist:[{dist_str}]\nSplit: {node.split_attr}\nIG={node.split_ig:.3f}"
                )

        def walk(node: ID3Node) -> int:
            nid = next_id()
            lines.append(f'  n{nid} [label="{label_for(node)}"];')
            if not node.is_leaf():
                for val, ch in node.children.items():
                    cid = walk(ch)
                    lines.append(f'  n{nid} -> n{cid} [label="{escape(val)}"];')
            return nid

        walk(self.root)
        lines.append("}")
        return "\n".join(lines)

    def plot_png(self, out_path: str) -> None:
        assert self.root is not None

        # Layout simples: posiciona nós por profundidade e ordem em DFS usando largura de subárvore
        def subtree_leaves(node: ID3Node) -> int:
            if node.is_leaf() or not node.children:
                return 1
            return sum(subtree_leaves(ch) for ch in node.children.values())

        def annotate(node: ID3Node) -> str:
            dist_str = ", ".join(f"{k}:{v}" for k, v in node.class_counts.items())
            if node.is_leaf():
                return f"Leaf\nN={node.samples}\nH={node.entropy:.3f}\n[{dist_str}]\nClass={node.predicted_class}"
            return f"N={node.samples} H={node.entropy:.3f}\n[{dist_str}]\nSplit: {node.split_attr}\nIG={node.split_ig:.3f}"

        x_gap = 1.0
        y_gap = 1.5

        def assign_pos(
            node: ID3Node, depth: int, x_start: float
        ) -> Tuple[float, float, float]:
            width = subtree_leaves(node)
            # posição x central do nó
            x_center = x_start + (width - 1) * x_gap / 2.0
            y = -depth * y_gap
            positions[id(node)] = (x_center, y)
            # recursão
            cur_x = x_start
            for ch in node.children.values():
                ch_width = subtree_leaves(ch)
                assign_pos(ch, depth + 1, cur_x)
                cur_x += (ch_width) * x_gap
            return x_center, y, width

        positions: Dict[int, Tuple[float, float]] = {}
        assign_pos(self.root, 0, 0.0)

        # Função para percorrer nós (usada para dimensionar figura)
        def walk_nodes(node: ID3Node):
            yield node
            for ch in node.children.values():
                yield from walk_nodes(ch)

        # Desenho
        fig_h = max(3, (max(n.depth for n in walk_nodes(self.root)) + 1) * 1.8)
        fig_w = max(6, subtree_leaves(self.root) * 1.2)
        fig, ax = plt.subplots(figsize=(fig_w, fig_h))
        ax.axis("off")

        # Links primeiro
        def draw_edges(node: ID3Node):
            x0, y0 = positions[id(node)]
            for val, ch in node.children.items():
                x1, y1 = positions[id(ch)]
                ax.plot([x0, x1], [y0 - 0.1, y1 + 0.1], color="#555", linewidth=1)
                # rótulo da aresta
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

        def draw_nodes(node: ID3Node):
            x, y = positions[id(node)]
            text = annotate(node)
            bbox_props = dict(
                boxstyle="round,pad=0.3",
                fc="#E8F0FE" if not node.is_leaf() else "#E8F5E9",
                ec="#90A4AE",
            )
            ax.text(x, y, text, fontsize=8, ha="center", va="center", bbox=bbox_props)
            for ch in node.children.values():
                draw_nodes(ch)

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
        description="Gera árvore ID3 para dataset2 com logs de cálculos"
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
        csv_path = os.path.abspath(
            os.path.join(os.path.dirname(__file__), "..", "..", "..", csv_path)
        )

    print(f"Lendo dataset: {csv_path}")
    df = pd.read_csv(csv_path)

    # Checa colunas esperadas
    if "Risco" not in df.columns:
        raise ValueError("Coluna alvo 'Risco' não encontrada no CSV.")
    # Remove ID se existir
    if "ID" in df.columns:
        df = df.drop(columns=["ID"])  # apenas identificador, não é atributo

    target = "Risco"
    features = [c for c in df.columns if c != target]

    print("Atributos:")
    for f in features:
        print(f"- {f} -> valores: {sorted(df[f].dropna().unique().tolist())}")

    tree = ID3DecisionTree(target=target)
    tree.fit(df, features)

    # Exporta DOT e PNG
    out_dir = os.path.dirname(__file__)
    if not args.no_dot:
        dot_text = tree.export_dot()
        dot_path = os.path.join(out_dir, "tree_id3.dot")
        with open(dot_path, "w", encoding="utf-8") as f:
            f.write(dot_text)
        print(f"\nDOT salvo em: {dot_path}")

    if not args.no_png:
        png_path = os.path.join(out_dir, "tree_id3.png")
        tree.plot_png(png_path)
        print(f"PNG salvo em: {png_path}")

    # Exporta base de regras
    rules_path = os.path.join(out_dir, "rules_id3.txt")
    tree.export_rules_txt(rules_path)
    print(f"Regras salvas em: {rules_path}")


if __name__ == "__main__":
    main()
