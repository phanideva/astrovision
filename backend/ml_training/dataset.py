"""Galaxy10 SDSS dataset wrapper.

Galaxy10 (Henry Leung & Jo Bovy) ships as a single HDF5 file with
21,785 RGB images (69x69) and integer labels 0..9. We collapse those
10 fine classes into 4 macro morphological classes:

    0 Disturbed             -> Irregular
    1 Merging               -> Irregular
    2 Round Smooth          -> Elliptical
    3 In-between Round      -> Elliptical
    4 Cigar Shaped Smooth   -> Lenticular
    5 Barred Spiral         -> Spiral
    6 Unbarred Tight Spiral -> Spiral
    7 Unbarred Loose Spiral -> Spiral
    8 Edge-on no Bulge      -> Lenticular
    9 Edge-on with Bulge    -> Lenticular

Download URL (one-time, ~200MB):
  https://astroweaver.utoronto.ca/Galaxy10_DECals.h5
or the smaller SDSS variant:
  https://astroweaver.utoronto.ca/Galaxy10.h5
"""

from __future__ import annotations

from pathlib import Path

import numpy as np
import torch
from torch.utils.data import Dataset

# 10 -> 4 macro class index mapping
FINE_TO_MACRO = {
    0: 2,
    1: 2,  # Irregular
    2: 1,
    3: 1,  # Elliptical
    4: 3,
    8: 3,
    9: 3,  # Lenticular
    5: 0,
    6: 0,
    7: 0,  # Spiral
}
MACRO_CLASSES = ["Spiral", "Elliptical", "Irregular", "Lenticular"]


class Galaxy10Dataset(Dataset):
    def __init__(self, h5_path: str | Path, indices=None, transform=None):
        import h5py  # local import; only needed for training

        self.h5_path = Path(h5_path)
        self.transform = transform
        with h5py.File(self.h5_path, "r") as f:
            self.images = np.array(f["images"])
            self.labels = np.array(f["ans"]).astype(np.int64)
        macro = np.vectorize(FINE_TO_MACRO.get)(self.labels)
        self.labels = macro.astype(np.int64)
        self.indices = (
            np.arange(len(self.labels)) if indices is None else np.asarray(indices)
        )

    def __len__(self) -> int:
        return len(self.indices)

    def __getitem__(self, i):
        from PIL import Image

        idx = int(self.indices[i])
        img = Image.fromarray(self.images[idx]).convert("RGB")
        label = int(self.labels[idx])
        if self.transform is not None:
            img = self.transform(img)
        return img, torch.tensor(label, dtype=torch.long)
