from __future__ import annotations

import os
from typing import List, Tuple

import numpy as np
import pandas as pd
from sklearn.metrics import accuracy_score, classification_report, confusion_matrix


def print_metrics_table(y_true, y_pred) -> None:
    acc = accuracy_score(y_true, y_pred)
    print("\n===== Métricas =====")
    print(f"Acurácia: {acc:.4f}")
    print("\nRelatório de classificação:")
    print(classification_report(y_true, y_pred, digits=3))
    labels = list(np.unique(y_true))
    cm = confusion_matrix(y_true, y_pred, labels=labels)
    print("Matriz de confusão (linhas=verdadeiro, colunas=previsto):")
    header = "\t".join([" "] + [str(l) for l in labels])
    print(header)
    for i, row in enumerate(cm):
        print("\t".join([str(labels[i])] + [str(v) for v in row]))


def save_metrics_csv(
    y_true,
    y_pred,
    labels: List[str],
    out_dir: str,
    prefix: str,
) -> Tuple[str, str]:
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


def rules_to_txt(rules: List[dict], target: str) -> List[str]:
    lines = []
    for i, r in enumerate(rules, 1):
        conds = (
            " E ".join([f"{a} {op} {v}" for (a, op, v) in r.get("conditions", [])])
            or "(sempre)"
        )
        cls = r.get("predicted_class", "?")
        n = r.get("n", 0)
        sup = float(r.get("support", 0.0)) * 100.0
        conf = float(r.get("confidence", 0.0)) * 100.0
        dist_map = r.get("class_counts", {}) or {}
        dist = ", ".join(f"{k}:{v}" for k, v in dist_map.items())
        lines.append(
            f"Regra {i}: SE {conds} ENTÃO {target} = {cls} (n={n}, suporte={sup:.2f}%, confiança={conf:.2f}%, dist=[{dist}])"
        )
    return lines


def save_classification_report_csv(
    y_true,
    y_pred,
    labels: List[str],
    out_dir: str,
    prefix: str,
) -> str:
    """Salva apenas o classification_report em CSV e retorna o caminho do arquivo.

    Não gera matriz de confusão.
    """
    try:
        report_dict = classification_report(
            y_true, y_pred, labels=labels, output_dict=True, digits=6, zero_division=0
        )
        report_df = pd.DataFrame(report_dict).transpose()
        report_csv_path = os.path.join(out_dir, f"metrics_{prefix}.csv")
        report_df.to_csv(report_csv_path, index=True)
        print(f"Relatório de classificação salvo em: {report_csv_path}")
        return report_csv_path
    except Exception as e:
        print(f"Aviso: não foi possível salvar metrics_{prefix}.csv: {e}")
        return ""
