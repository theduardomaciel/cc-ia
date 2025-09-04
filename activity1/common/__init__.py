"""Utilitários compartilhados para a atividade 1.

Exporta:
- get_repo_root, get_data_path, ensure_dir
- print_metrics_table, save_metrics_csv
- rules_to_txt (serialização simples de regras)
"""

from .paths import get_repo_root, get_data_path, ensure_dir
from .report import print_metrics_table, save_metrics_csv, rules_to_txt
