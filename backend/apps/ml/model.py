"""Galaxy morphology CNN model definition.

Used both for training (`ml_training/train.py`) and runtime inference
(`apps.ml.services`). Kept tiny on purpose: ResNet18 with a 4-class head
trained from scratch is small enough to run on CPU.
"""

from __future__ import annotations

import torch
from torch import nn
from torchvision.models import resnet18

NUM_CLASSES = 4
DEFAULT_CLASSES = ["Spiral", "Elliptical", "Irregular", "Lenticular"]
INPUT_SIZE = 224
# ImageNet stats — fine for natural-style RGB galaxy photos
NORM_MEAN = (0.485, 0.456, 0.406)
NORM_STD = (0.229, 0.224, 0.225)


def build_model(num_classes: int = NUM_CLASSES) -> nn.Module:
    """Build a ResNet18 with a fresh classifier head (no pretrained weights)."""
    model = resnet18(weights=None)
    model.fc = nn.Linear(model.fc.in_features, num_classes)
    return model


def load_weights(model: nn.Module, weights_path, device: str = "cpu") -> nn.Module:
    state = torch.load(weights_path, map_location=device)
    if isinstance(state, dict) and "state_dict" in state:
        state = state["state_dict"]
    model.load_state_dict(state)
    model.eval()
    return model
