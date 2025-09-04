from __future__ import annotations

import os
from typing import Optional


def get_repo_root(start: Optional[str] = None) -> str:
    """Resolve de forma robusta a raiz do repositório (onde vivem README.md e a pasta activity1/).

    Procura por um diretório contendo uma pasta 'activity1' e um README.md.
    """
    here = os.path.abspath(start or __file__)
    d = os.path.dirname(here)
    # sobe no máximo 6 níveis
    for _ in range(6):
        activity1_dir = os.path.join(d, "activity1")
        readme = os.path.join(d, "README.md")
        if os.path.isdir(activity1_dir) and os.path.isfile(readme):
            return d
        parent = os.path.dirname(d)
        if parent == d:
            break
        d = parent
    # fallback: dois níveis acima deste arquivo (activity1/common -> repo root?)
    return os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))


def get_data_path(*parts: str, repo_root: Optional[str] = None) -> str:
    """Monta caminho para arquivos dentro de 'data/'. Aceita partes adicionais.

    Suporta duas estruturas:
    - <repo_root>/data/...
    - <repo_root>/activity1/data/...
    """
    root = repo_root or get_repo_root()
    p1 = os.path.abspath(os.path.join(root, "data", *parts))
    if os.path.exists(os.path.dirname(p1)) or os.path.exists(p1):
        return p1
    p2 = os.path.abspath(os.path.join(root, "activity1", "data", *parts))
    return p2


def ensure_dir(path: str) -> None:
    os.makedirs(path, exist_ok=True)
