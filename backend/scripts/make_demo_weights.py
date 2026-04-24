"""Create a placeholder model checkpoint so the API works without training.

This writes a randomly-initialized ResNet18-4-class state dict and a
matching class_map.json into backend/model_artifacts/. Predictions will
be effectively random, but the full request/response pipeline is
exercisable end-to-end. Replace the .pt file by running
`ml_training/train.py` to get real predictions.
"""

from __future__ import annotations

import json
import sys
from pathlib import Path

import torch

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from apps.ml.model import DEFAULT_CLASSES, build_model  # noqa: E402

ARTIFACTS_DIR = Path(__file__).resolve().parent.parent / "model_artifacts"


def main() -> None:
    ARTIFACTS_DIR.mkdir(parents=True, exist_ok=True)
    model = build_model(num_classes=len(DEFAULT_CLASSES))
    weights_path = ARTIFACTS_DIR / "galaxy_cnn.pt"
    torch.save(model.state_dict(), weights_path)
    (ARTIFACTS_DIR / "class_map.json").write_text(json.dumps(DEFAULT_CLASSES))
    print(f"Wrote demo weights to {weights_path}")
    print(f"Wrote class map to {ARTIFACTS_DIR / 'class_map.json'}")
    print("NOTE: predictions are random until you run ml_training/train.py")


if __name__ == "__main__":
    main()
