# ML Model

## Task

Multi-class image classification of galaxy morphology into 4 macro classes:
**Spiral**, **Elliptical**, **Irregular**, **Lenticular**.

## Dataset — Galaxy10 SDSS

- Source: Henry Leung & Jo Bovy, *Galaxy10 dataset* — `Galaxy10.h5`
- Size: ~21,785 RGB images, 69×69 px
- Original labels: 10 fine-grained classes (0..9)
- We collapse to 4 macro classes via the mapping in
  `backend/ml_training/dataset.py`:

| Fine class                 | Macro class |
| -------------------------- | ----------- |
| Disturbed, Merging         | Irregular   |
| Round/In-between Round     | Elliptical  |
| Cigar Smooth, Edge-on ±Bulge | Lenticular |
| Barred / Tight / Loose Spiral | Spiral   |

Download (one-time, ~200MB):
```
https://astroweaver.utoronto.ca/Galaxy10.h5
```

## Architecture

`torchvision.models.resnet18(weights=None)` with the final FC layer
replaced by `nn.Linear(512, 4)`. ~11.2M parameters, **trained from
scratch** (no ImageNet pretraining), per the project requirement.

Input pipeline:
- Resize 224×224
- Train aug: H-flip, ±20° rotation, mild color jitter
- Normalize with ImageNet stats (works fine for natural-style RGB)

## Training

```bash
cd backend
python ml_training/train.py \
    --data path/to/Galaxy10.h5 \
    --epochs 15 \
    --batch-size 64 \
    --lr 1e-3
```

- Optimizer: Adam, `lr=1e-3`
- Loss: cross-entropy
- Early stopping on validation accuracy (`--patience 4`)
- Saves best `state_dict` to `backend/model_artifacts/galaxy_cnn.pt`
- Writes `class_map.json` and `metrics.json` alongside

## Inference

`apps/ml/services.py` exposes a process-wide singleton
`InferenceService` instantiated lazily on first request and reused
across requests (no model reload per call). `predict(image_path)`
returns:

```python
{ "class": "Spiral",
  "confidence": 0.91,
  "probabilities": { "Spiral": 0.91, ... } }
```

Prediction writes also feed the user experience layer:

- prediction rows are persisted in `predictions_prediction`
- `record_event(user, "predict")` updates gamification counters
- portal mission progress and notifications can be updated as side-effects

## Reported metrics

Run training and `metrics.json` will be regenerated. With the default
config on Galaxy10 SDSS, expect roughly:

| Metric          | Value         |
| --------------- | ------------- |
| Val accuracy    | ~0.78 – 0.85  |
| Macro F1        | ~0.74 – 0.82  |

Numbers vary with seed, augmentation, and number of epochs. Report
your own once you've trained.

## No-train fallback

`scripts/make_demo_weights.py` writes a randomly-initialized state
dict so the API works end-to-end on a fresh checkout. Predictions are
not meaningful until you train.

## Local run notes

If you use Windows desktop launchers:

- start script launches backend + frontend and opens localhost
- stop script terminates services by freeing ports `8000` and `3000`

Scripts:

- `scripts/launch_astrovision_localhost.ps1`
- `scripts/stop_astrovision_localhost.ps1`
