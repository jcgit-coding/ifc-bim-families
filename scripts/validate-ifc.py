"""Validates IFC files with IfcOpenShell: parses them, builds the geometry of every element
and checks that the overall bounding box has a positive volume.

Usage: python scripts/validate-ifc.py <directory-with-ifc-files>
Requires: pip install ifcopenshell numpy
"""
import pathlib
import sys

import ifcopenshell
import ifcopenshell.geom
import numpy as np


def validate(path: pathlib.Path) -> None:
    model = ifcopenshell.open(str(path))
    settings = ifcopenshell.geom.settings()
    settings.set("use-world-coords", True)
    vertices = []
    for element in model.by_type("IfcElement"):
        if element.Representation is None:
            continue
        shape = ifcopenshell.geom.create_shape(settings, element)
        vertices.append(np.array(shape.geometry.verts).reshape(-1, 3))
    assert vertices, f"{path.name}: no geometry found"
    points = np.vstack(vertices)
    size = points.max(axis=0) - points.min(axis=0)
    assert (size > 0).all(), f"{path.name}: degenerate bounding box {size}"
    print(f"OK {path.name}: {len(vertices)} elements, size {size.round(3)} m")


if __name__ == "__main__":
    files = sorted(pathlib.Path(sys.argv[1]).glob("*.ifc"))
    assert files, "No IFC files to validate"
    for ifc_file in files:
        validate(ifc_file)
