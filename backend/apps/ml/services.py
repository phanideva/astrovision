"""Singleton inference service.

Loads the trained CNN once and exposes `predict(image_path)`. If no
weights file exists yet (fresh checkout), a randomly-initialized model
is used so the API is still functional end-to-end — predictions are
just not meaningful until `ml_training/train.py` or
`scripts/fetch_weights.py` runs.
"""

from __future__ import annotations

import json
import logging
import threading
from pathlib import Path

import torch
from django.conf import settings
from PIL import Image
from torchvision import transforms

from .model import (
    DEFAULT_CLASSES,
    INPUT_SIZE,
    NORM_MEAN,
    NORM_STD,
    build_model,
    load_weights,
)

logger = logging.getLogger(__name__)

_PREPROCESS = transforms.Compose(
    [
        transforms.Resize((INPUT_SIZE, INPUT_SIZE)),
        transforms.ToTensor(),
        transforms.Normalize(NORM_MEAN, NORM_STD),
    ]
)


class InferenceService:
    def __init__(
        self,
        weights_path: Path | None = None,
        class_map_path: Path | None = None,
        device: str | None = None,
    ) -> None:
        self.device = device or ("cuda" if torch.cuda.is_available() else "cpu")
        self.classes = self._load_classes(class_map_path)
        self.model = build_model(num_classes=len(self.classes)).to(self.device)

        weights_path = Path(weights_path) if weights_path else None
        if weights_path and weights_path.exists():
            try:
                load_weights(self.model, weights_path, device=self.device)
                logger.info("Loaded galaxy CNN weights from %s", weights_path)
            except Exception:  # pragma: no cover - defensive
                logger.exception("Failed to load weights; using random init.")
                self.model.eval()
        else:
            logger.warning(
                "No weights at %s — using random init. Run training script.",
                weights_path,
            )
            self.model.eval()

    @staticmethod
    def _load_classes(class_map_path: Path | None) -> list[str]:
        if class_map_path and Path(class_map_path).exists():
            try:
                data = json.loads(Path(class_map_path).read_text())
                if isinstance(data, list):
                    return list(data)
                if isinstance(data, dict):
                    # {"0": "Spiral", ...}
                    return [data[str(i)] for i in range(len(data))]
            except Exception:  # pragma: no cover
                logger.exception("Bad class map file; falling back to defaults.")
        return list(DEFAULT_CLASSES)

    @torch.no_grad()
    def predict(self, image_path: str | Path) -> dict:
        img = Image.open(image_path).convert("RGB")
        tensor = _PREPROCESS(img).unsqueeze(0).to(self.device)
        logits = self.model(tensor)
        probs = torch.softmax(logits, dim=1)[0].cpu().tolist()
        idx = int(torch.argmax(logits, dim=1).item())
        return {
            "class": self.classes[idx],
            "confidence": float(probs[idx]),
            "probabilities": {
                cls: float(p) for cls, p in zip(self.classes, probs, strict=False)
            },
        }


_service_lock = threading.Lock()
_service: InferenceService | None = None


def get_inference_service() -> InferenceService:
    global _service
    if _service is None:
        with _service_lock:
            if _service is None:
                _service = InferenceService(
                    weights_path=getattr(settings, "MODEL_WEIGHTS_PATH", None),
                    class_map_path=getattr(settings, "CLASS_MAP_PATH", None),
                )
    return _service


def set_inference_service(service: InferenceService | None) -> None:
    """Test hook to inject a fake service."""
    global _service
    _service = service
