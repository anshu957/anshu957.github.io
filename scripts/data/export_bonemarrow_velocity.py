"""
Export a small, static JSON of the Setty et al. 2019 human CD34+ bone marrow
dataset (Palantir), with an RNA-velocity embedding, for the "Watching Cells
Decide" blog post's real-data figure.

Usage (needs the 'sc' conda env: scvelo, scanpy, anndata):
    conda run -n sc python scripts/data/export_bonemarrow_velocity.py

Writes: public/assets/blog/data/bonemarrow-velocity.json
"""

import json
from pathlib import Path

import numpy as np
import scvelo as scv

OUT_PATH = Path(__file__).resolve().parents[2] / "public" / "assets" / "blog" / "data" / "bonemarrow-velocity.json"

CLUSTER_LABELS = {
    "HSC_1": "HSC (early)",
    "HSC_2": "HSC (late)",
    "Precursors": "Precursors",
    "CLP": "Lymphoid progenitor",
    "Mono_1": "Monocyte (early)",
    "Mono_2": "Monocyte (late)",
    "DCs": "Dendritic cell",
    "Ery_1": "Erythroid (early)",
    "Ery_2": "Erythroid (late)",
    "Mega": "Megakaryocyte",
}


def main():
    adata = scv.datasets.bonemarrow()

    scv.pp.filter_and_normalize(adata, min_shared_counts=20, n_top_genes=2000)
    scv.pp.moments(adata, n_pcs=30, n_neighbors=30)
    scv.tl.velocity(adata, mode="stochastic")
    scv.tl.velocity_graph(adata)
    scv.tl.velocity_embedding(adata, basis="tsne")

    xy = adata.obsm["X_tsne"]
    vxy = adata.obsm["velocity_tsne"]
    clusters = adata.obs["clusters"].astype(str).tolist()
    pseudotime = adata.obs["palantir_pseudotime"].to_numpy()

    # Normalize embedding to a clean [0, 1] x [0, 1] box so the frontend
    # doesn't need to know anything about tSNE's native scale.
    x_min, x_max = xy[:, 0].min(), xy[:, 0].max()
    y_min, y_max = xy[:, 1].min(), xy[:, 1].max()
    x_norm = (xy[:, 0] - x_min) / (x_max - x_min)
    y_norm = (xy[:, 1] - y_min) / (y_max - y_min)

    # Scale velocity by the same span so arrows stay proportionate.
    vx_norm = vxy[:, 0] / (x_max - x_min)
    vy_norm = vxy[:, 1] / (y_max - y_min)

    cells = []
    for i in range(adata.n_obs):
        vx, vy = vx_norm[i], vy_norm[i]
        if np.isnan(vx) or np.isnan(vy):
            vx, vy = 0.0, 0.0
        cells.append(
            {
                "x": round(float(x_norm[i]), 4),
                "y": round(float(y_norm[i]), 4),
                "vx": round(float(vx), 4),
                "vy": round(float(vy), 4),
                "c": clusters[i],
                "t": round(float(pseudotime[i]), 4) if not np.isnan(pseudotime[i]) else None,
            }
        )

    payload = {
        "source": "Setty et al. 2019, Nat Biotechnol (Palantir) — human CD34+ bone marrow, via scvelo.datasets.bonemarrow()",
        "n_cells": len(cells),
        "clusterLabels": CLUSTER_LABELS,
        "cells": cells,
    }

    OUT_PATH.parent.mkdir(parents=True, exist_ok=True)
    OUT_PATH.write_text(json.dumps(payload, separators=(",", ":")))
    print(f"Wrote {len(cells)} cells to {OUT_PATH} ({OUT_PATH.stat().st_size / 1024:.1f} KB)")


if __name__ == "__main__":
    main()
