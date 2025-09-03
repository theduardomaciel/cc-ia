"""
Questão 4

Na base de dados escolhida na Questão 3, rode um algoritmo que gera regras diretamente
(por exemplo, PRISM). Apresente (1) as regras geradas e (2) métricas de desempenho.
Opcionalmente, salve arquivos auxiliares com as regras e com a aplicação das regras na base.

Este script implementa uma versão simples do PRISM que aprende regras do tipo
  IF atributo = valor AND ... THEN classe

Notas:
- Para atributos numéricos contínuos, é feita uma discretização em quantis (qcut) por padrão.
- A predição usa a primeira regra que cobre o exemplo; se nenhuma regra cobrir, usa-se classe
  majoritária de treino como fallback.
- Artefatos gerados: rules.txt (regras), rules_applied_train.csv e rules_applied_test.csv
"""

from __future__ import annotations

import argparse
import os
from dataclasses import dataclass
from typing import Dict, List, Tuple, Optional

import numpy as np
import pandas as pd
from sklearn.metrics import accuracy_score, classification_report, confusion_matrix
from sklearn.model_selection import train_test_split


def _default_dataset_path() -> str:
    # activity1/question4 -> .. (activity1) -> .. (raiz) / data / dataset1.csv
    here = os.path.dirname(__file__)
    candidate = os.path.abspath(os.path.join(here, "..", "..", "data", "dataset1.csv"))
    if os.path.exists(candidate):
        return candidate
    # fallback: tentar activity1/data (caso estrutura mude)
    alt = os.path.abspath(os.path.join(here, "..", "data", "dataset1.csv"))
    return alt


DEFAULT_DATASET_PATH = _default_dataset_path()


@dataclass
class Rule:
    conditions: Dict[str, str]  # atributo -> valor discreto (string)
    klass: str
    precision: float
    coverage_pos: int
    coverage_total: int

    def matches_row(self, row: pd.Series) -> bool:
        for a, v in self.conditions.items():
            if str(row.get(a)) != v:
                return False
        return True

    def __str__(self) -> str:
        conds = [f"{a} = {v}" for a, v in self.conditions.items()]
        cond_txt = " AND ".join(conds) if conds else "TRUE"
        return (
            f"IF {cond_txt} THEN Target = {self.klass} "
            f"(precisão={self.precision:.3f}, pos={self.coverage_pos}, total={self.coverage_total})"
        )


class PrismClassifier:
    """Implementação simples do PRISM para classificação multiclasse.

    Regras são induzidas classe a classe. Para cada classe c, repetidamente constrói-se uma regra
    acrescentando o literal (atributo=valor) com maior P(c | literal ∧ condições_atual),
    até cobrir somente positivos daquela classe ou até não haver ganho.
    """

    def __init__(self, max_bins: int = 4, random_state: int = 42):
        self.max_bins = max_bins
        self.random_state = random_state
        self.rules_: List[Rule] = []
        self.default_class_: Optional[str] = None
        self.columns_: List[str] = []

    # ---------- Pré-processamento (discretização e coerção para strings) ----------
    def _discretize_dataframe(self, X: pd.DataFrame) -> pd.DataFrame:
        Xd = pd.DataFrame(index=X.index)
        for col in X.columns:
            s = X[col]
            if s.dtype.kind in ("f",):
                # Float: discretizar sempre em quantis
                Xd[col] = self._qcut_to_str_bins(s, self.max_bins)
            elif s.dtype.kind in ("i", "u"):
                nunique = s.nunique(dropna=True)
                if nunique > self.max_bins * 2:
                    # Inteiro com muitos valores: discretizar
                    Xd[col] = self._qcut_to_str_bins(s.astype(float), self.max_bins)
                else:
                    Xd[col] = s.astype("Int64").astype(str)
            else:
                Xd[col] = s.astype(str)
            # Tratar NaN/None uniformemente
            Xd[col] = Xd[col].fillna("NA").astype(str)
        return Xd

    @staticmethod
    def _qcut_to_str_bins(s: pd.Series, q: int) -> pd.Series:
        s_no_nan = s.fillna(s.median() if pd.api.types.is_numeric_dtype(s) else 0)
        try:
            binned = pd.qcut(
                s_no_nan, q=min(q, max(1, s_no_nan.nunique())), duplicates="drop"
            )
        except Exception:
            # fallback para cut em intervalos iguais
            try:
                binned = pd.cut(s_no_nan, bins=min(q, max(1, s_no_nan.nunique())))
            except Exception:
                return s_no_nan.astype(str)
        return binned.astype(str)

    # ---------- Treinamento ----------
    def fit(self, X: pd.DataFrame, y: pd.Series):
        # Discretizar para valores categóricos (strings)
        Xd = self._discretize_dataframe(X)
        self.columns_ = list(Xd.columns)
        y = y.astype(str).reset_index(drop=True)
        Xd = Xd.reset_index(drop=True)

        classes = list(pd.unique(y))
        # Classe default: majoritária no treino
        self.default_class_ = str(y.value_counts().idxmax())

        # Aprender regras por classe
        for klass in classes:
            # Conjunto S: exemplos ainda não cobertos positivamente desta classe
            uncovered_mask = y == klass
            if not uncovered_mask.any():
                continue

            while uncovered_mask.any():
                rule_conditions: Dict[str, str] = {}
                covered_mask = pd.Series(
                    [True] * len(y)
                )  # exemplos cobertos pela regra corrente
                available_attrs = set(self.columns_)

                # Enquanto houver negativos cobertos, adicione o melhor literal
                while True:
                    # Máscara dos exemplos atualmente cobertos
                    current_idx = covered_mask[covered_mask].index
                    if len(current_idx) == 0:
                        break

                    y_cov = y.loc[current_idx]
                    neg_count = int((y_cov != klass).sum())
                    if neg_count == 0:
                        break  # já só há positivos, regra pronta

                    # Procurar literal com maior P(klass | literal ∧ condições)
                    best_attr: Optional[str] = None
                    best_val: Optional[str] = None
                    best_prob: float = -1.0
                    best_pos = -1
                    best_tot = -1

                    for attr in list(available_attrs):
                        vals = Xd.loc[current_idx, attr].unique()
                        for v in vals:
                            sel = current_idx[Xd.loc[current_idx, attr] == v]
                            tot = len(sel)
                            if tot == 0:
                                continue
                            pos = int((y.loc[sel] == klass).sum())
                            prob = pos / tot
                            # Tie-breakers: maior prob, depois maior pos, depois maior tot
                            if (
                                (prob > best_prob)
                                or (np.isclose(prob, best_prob) and (pos > best_pos))
                                or (
                                    np.isclose(prob, best_prob)
                                    and (pos == best_pos)
                                    and (tot > best_tot)
                                )
                            ):
                                best_attr, best_val = attr, str(v)
                                best_prob, best_pos, best_tot = prob, pos, tot

                    if best_attr is None or best_val is None:
                        break  # não há melhoria possível

                    # Aplicar literal escolhido
                    prev_neg = neg_count
                    covered_mask &= Xd[best_attr] == best_val
                    rule_conditions[best_attr] = best_val
                    available_attrs.discard(best_attr)

                    # Checagem de progresso: se não reduziu negativos, interromper
                    y_cov2 = y[covered_mask]
                    new_neg = int((y_cov2 != klass).sum())
                    if new_neg >= prev_neg:
                        break

                    if len(available_attrs) == 0:
                        # sem mais atributos a testar
                        # prossegue para ver se já só há positivos
                        continue

                # Construir a regra final
                cov_idx = covered_mask[covered_mask].index
                if len(cov_idx) == 0:
                    # fallback: regra vazia (TRUE) para esta classe - evita loop
                    rule = Rule(
                        {},
                        klass,
                        precision=(y == klass).mean(),
                        coverage_pos=int((y == klass).sum()),
                        coverage_total=len(y),
                    )
                else:
                    pos = int((y.loc[cov_idx] == klass).sum())
                    tot = len(cov_idx)
                    precision = pos / tot if tot else 0.0
                    rule = Rule(
                        rule_conditions,
                        klass,
                        precision=precision,
                        coverage_pos=pos,
                        coverage_total=tot,
                    )

                self.rules_.append(rule)

                # Remover positivos cobertos desta classe do conjunto a cobrir
                covered_pos_mask = pd.Series(False, index=y.index)
                covered_pos_mask.loc[cov_idx] = y.loc[cov_idx] == klass
                new_uncovered_mask = uncovered_mask & (~covered_pos_mask)

                # Se não houve progresso, interromper para evitar loop infinito
                if new_uncovered_mask.equals(uncovered_mask):
                    break
                uncovered_mask = new_uncovered_mask

        return self

    # ---------- Predição ----------
    def predict(self, X: pd.DataFrame) -> np.ndarray:
        Xd = self._discretize_dataframe(X)
        preds: List[str] = []
        for i in range(len(Xd)):
            row = Xd.iloc[i]
            label = None
            for r in self.rules_:
                if r.matches_row(row):
                    label = r.klass
                    break
            if label is None:
                label = self.default_class_ or ""
            preds.append(label)
        return np.array(preds)

    def rules_as_text(self) -> List[str]:
        return [str(r) for r in self.rules_]


def load_dataset(
    csv_path: str, target_col: str = "Target"
) -> Tuple[pd.DataFrame, pd.Series]:
    df = pd.read_csv(csv_path)
    if target_col not in df.columns:
        raise ValueError(f"Coluna-alvo '{target_col}' não encontrada no dataset.")
    X = df.drop(columns=[target_col])
    y = df[target_col].astype(str)
    return X, y


def print_and_save_rules(rules_text: List[str], out_dir: str) -> None:
    print("\n===== Regras geradas (PRISM) =====")
    for i, r in enumerate(rules_text, 1):
        print(f"[{i}] {r}")

    rules_path = os.path.join(out_dir, "rules.txt")
    try:
        with open(rules_path, "w", encoding="utf-8") as f:
            f.write("===== Regras (PRISM) =====\n")
            for i, r in enumerate(rules_text, 1):
                f.write(f"[{i}] {r}\n")
        print(f"Regras salvas em: {rules_path}")
    except Exception as e:
        print(f"Aviso: não foi possível salvar rules.txt: {e}")


def save_rules_application(
    X: pd.DataFrame,
    y: pd.Series,
    preds: np.ndarray,
    clf: PrismClassifier,
    out_csv: str,
) -> None:
    rows_rule_idx: List[Optional[int]] = []
    rows_rule_text: List[str] = []
    Xd = clf._discretize_dataframe(X)
    for i in range(len(Xd)):
        row = Xd.iloc[i]
        idx_used: Optional[int] = None
        txt: str = "<default>"
        for j, r in enumerate(clf.rules_, 1):
            if r.matches_row(row):
                idx_used = j
                txt = str(r)
                break
        rows_rule_idx.append(idx_used)
        rows_rule_text.append(txt)

    out_df = X.copy()
    out_df["Target_true"] = y.values
    out_df["Target_pred"] = preds
    out_df["RuleIndex"] = rows_rule_idx
    out_df["Rule"] = rows_rule_text
    try:
        out_df.to_csv(out_csv, index=False)
        print(f"Aplicação das regras salva em: {out_csv}")
    except Exception as e:
        print(f"Aviso: não foi possível salvar '{out_csv}': {e}")


def main():
    parser = argparse.ArgumentParser(
        description="Questão 4 - Indução de Regras (PRISM)"
    )
    parser.add_argument(
        "--data",
        default=DEFAULT_DATASET_PATH,
        help="Caminho para o CSV do dataset (padrão: data/dataset1.csv)",
    )
    parser.add_argument(
        "--target",
        default="Target",
        help="Nome da coluna alvo (padrão: Target)",
    )
    parser.add_argument(
        "--bins",
        type=int,
        default=4,
        help="Número de bins para discretização de contínuas (padrão: 4)",
    )
    parser.add_argument(
        "--test_size",
        type=float,
        default=0.25,
        help="Proporção da base para teste (padrão: 0.25)",
    )
    parser.add_argument(
        "--no_save",
        action="store_true",
        help="Não salvar arquivos auxiliares (rules.txt, rules_applied_*.csv)",
    )
    args = parser.parse_args()

    print("Carregando dados...")
    X, y = load_dataset(args.data, target_col=args.target)

    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=args.test_size, random_state=42, stratify=y
    )

    print("Treinando PRISM...")
    clf = PrismClassifier(max_bins=args.bins, random_state=42)
    clf.fit(X_train, y_train)

    rules_text = clf.rules_as_text()
    if not args.no_save:
        out_dir = os.path.dirname(__file__)
        print_and_save_rules(rules_text, out_dir)
    else:
        print("\n===== Regras geradas (PRISM) =====")
        for i, r in enumerate(rules_text, 1):
            print(f"[{i}] {r}")

    print("\nAvaliando no conjunto de teste...")
    y_pred = clf.predict(X_test)

    acc = accuracy_score(y_test, y_pred)
    print("\n===== Métricas (teste) =====")
    print(f"Acurácia: {acc:.4f}")
    print("\nRelatório de classificação:")
    print(classification_report(y_test, y_pred, digits=3))
    cm = confusion_matrix(y_test, y_pred, labels=sorted(y.unique()))
    labels = sorted(y.unique())
    print("Matriz de confusão (linhas=verdadeiro, colunas=previsto):")
    header = "\t".join([" "] + labels)
    print(header)
    for i, row in enumerate(cm):
        print("\t".join([labels[i]] + [str(v) for v in row]))

    if not args.no_save:
        out_dir = os.path.dirname(__file__)
        save_rules_application(
            X_train,
            y_train,
            clf.predict(X_train),
            clf,
            os.path.join(out_dir, "rules_applied_train.csv"),
        )
        save_rules_application(
            X_test, y_test, y_pred, clf, os.path.join(out_dir, "rules_applied_test.csv")
        )


if __name__ == "__main__":
    main()
