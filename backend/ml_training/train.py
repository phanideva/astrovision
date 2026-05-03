"""Train the galaxy morphology CNN.

Usage:
    python ml_training/train.py --data path/to/Galaxy10.h5 --epochs 20

Outputs:
    backend/model_artifacts/galaxy_cnn.pt
    backend/model_artifacts/class_map.json
    backend/model_artifacts/metrics.json
"""

from __future__ import annotations

import argparse
import json
import sys
import time
from pathlib import Path

import numpy as np
import torch
from torch import nn, optim
from torch.utils.data import DataLoader
from torchvision import transforms

# Allow `python ml_training/train.py` from the backend dir
sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from apps.ml.model import INPUT_SIZE, NORM_MEAN, NORM_STD, build_model  # noqa: E402
from ml_training.dataset import MACRO_CLASSES, Galaxy10Dataset  # noqa: E402

ARTIFACTS_DIR = Path(__file__).resolve().parent.parent / "model_artifacts"


def make_loaders(h5_path: Path, batch_size: int, val_split: float, seed: int):
    train_tf = transforms.Compose(
        [
            transforms.Resize((INPUT_SIZE, INPUT_SIZE)),
            transforms.RandomHorizontalFlip(),
            transforms.RandomRotation(20),
            transforms.ColorJitter(0.1, 0.1, 0.1),
            transforms.ToTensor(),
            transforms.Normalize(NORM_MEAN, NORM_STD),
        ]
    )
    eval_tf = transforms.Compose(
        [
            transforms.Resize((INPUT_SIZE, INPUT_SIZE)),
            transforms.ToTensor(),
            transforms.Normalize(NORM_MEAN, NORM_STD),
        ]
    )
    full = Galaxy10Dataset(h5_path)
    n = len(full)
    rng = np.random.default_rng(seed)
    perm = rng.permutation(n)
    n_val = int(n * val_split)
    val_idx, train_idx = perm[:n_val], perm[n_val:]
    train_ds = Galaxy10Dataset(h5_path, indices=train_idx, transform=train_tf)
    val_ds = Galaxy10Dataset(h5_path, indices=val_idx, transform=eval_tf)
    return (
        DataLoader(train_ds, batch_size=batch_size, shuffle=True, num_workers=2),
        DataLoader(val_ds, batch_size=batch_size, shuffle=False, num_workers=2),
    )


def evaluate(model, loader, device):
    model.eval()
    correct = total = 0
    with torch.no_grad():
        for x, y in loader:
            x, y = x.to(device), y.to(device)
            preds = model(x).argmax(dim=1)
            correct += (preds == y).sum().item()
            total += y.size(0)
    return correct / max(total, 1)


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--data", type=Path, required=True, help="Galaxy10 .h5 path")
    parser.add_argument("--epochs", type=int, default=15)
    parser.add_argument("--batch-size", type=int, default=64)
    parser.add_argument("--lr", type=float, default=1e-3)
    parser.add_argument("--val-split", type=float, default=0.15)
    parser.add_argument("--seed", type=int, default=42)
    parser.add_argument("--patience", type=int, default=4)
    args = parser.parse_args()

    torch.manual_seed(args.seed)
    device = "cuda" if torch.cuda.is_available() else "cpu"
    print(f"Device: {device}")

    train_loader, val_loader = make_loaders(
        args.data, args.batch_size, args.val_split, args.seed
    )

    model = build_model(num_classes=len(MACRO_CLASSES)).to(device)
    optimizer = optim.Adam(model.parameters(), lr=args.lr)
    criterion = nn.CrossEntropyLoss()

    ARTIFACTS_DIR.mkdir(parents=True, exist_ok=True)
    weights_path = ARTIFACTS_DIR / "galaxy_cnn.pt"
    (ARTIFACTS_DIR / "class_map.json").write_text(json.dumps(MACRO_CLASSES))

    best_acc = 0.0
    epochs_no_improve = 0
    history = []
    for epoch in range(1, args.epochs + 1):
        model.train()
        t0 = time.time()
        running = 0.0
        for x, y in train_loader:
            x, y = x.to(device), y.to(device)
            optimizer.zero_grad()
            loss = criterion(model(x), y)
            loss.backward()
            optimizer.step()
            running += loss.item() * x.size(0)
        train_loss = running / len(train_loader.dataset)
        val_acc = evaluate(model, val_loader, device)
        history.append({"epoch": epoch, "train_loss": train_loss, "val_acc": val_acc})
        print(
            f"epoch {epoch:02d}  loss={train_loss:.4f}  val_acc={val_acc:.4f}  "
            f"({time.time() - t0:.1f}s)"
        )
        if val_acc > best_acc:
            best_acc = val_acc
            epochs_no_improve = 0
            torch.save(model.state_dict(), weights_path)
            print(f"  -> saved {weights_path} (best so far)")
        else:
            epochs_no_improve += 1
            if epochs_no_improve >= args.patience:
                print("Early stopping.")
                break

    (ARTIFACTS_DIR / "metrics.json").write_text(
        json.dumps({"best_val_acc": best_acc, "history": history}, indent=2)
    )
    print(f"Done. Best val acc = {best_acc:.4f}")


if __name__ == "__main__":
    main()
