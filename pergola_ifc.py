"""Generador paramétrico de pérgola bioclimática en IFC4 (unidades: metros).

Uso:
  uv run --with ifcopenshell --with numpy pergola_ifc.py --ancho 4.0 --fondo 3.0 --angulo 45
Todos los parámetros tienen valor por defecto; ver --help.
"""
import argparse
import math

import numpy as np
import ifcopenshell
import ifcopenshell.api


def run(f, usecase, **kw):
    return ifcopenshell.api.run(usecase, f, **kw)


def matrix(origin, z, xv):
    """Matriz 4x4: eje local z = dirección de extrusión, x = xv, y = z × x."""
    z = np.array(z, float); z /= np.linalg.norm(z)
    x = np.array(xv, float); x /= np.linalg.norm(x)
    y = np.cross(z, x)
    m = np.eye(4)
    m[:3, 0], m[:3, 1], m[:3, 2], m[:3, 3] = x, y, z, origin
    return m


def build(a):
    f = ifcopenshell.file(schema="IFC4")
    run(f, "root.create_entity", ifc_class="IfcProject", name=a.nombre)
    run(f, "unit.assign_unit", length={"is_metric": True, "raw": "METERS"})
    ctx = run(f, "context.add_context", context_type="Model")
    body = run(f, "context.add_context", context_type="Model", context_identifier="Body",
               target_view="MODEL_VIEW", parent=ctx)
    site = run(f, "root.create_entity", ifc_class="IfcSite", name="Sitio")
    bld = run(f, "root.create_entity", ifc_class="IfcBuilding", name="Edificio")
    sto = run(f, "root.create_entity", ifc_class="IfcBuildingStorey", name="Nivel 0")
    run(f, "aggregate.assign_object", products=[site], relating_object=f.by_type("IfcProject")[0])
    run(f, "aggregate.assign_object", products=[bld], relating_object=site)
    run(f, "aggregate.assign_object", products=[sto], relating_object=bld)

    W, D, H = a.ancho, a.fondo, a.altura
    cs, bw, bh = a.col, a.viga_b, a.viga_h
    lw, lt, gap, ang = a.lama_ancho, a.lama_esp, a.lama_sep, a.angulo
    zb = H - bh / 2  # eje de vigas
    members = []

    def member(cls, name, origin, z, xv, dx, dy, length, ptype=None, props=None):
        e = run(f, "root.create_entity", ifc_class=cls, name=name,
                predefined_type=ptype) if ptype else run(f, "root.create_entity", ifc_class=cls, name=name)
        prof = f.create_entity("IfcRectangleProfileDef", ProfileType="AREA", XDim=dx, YDim=dy)
        rep = run(f, "geometry.add_profile_representation", context=body, profile=prof, depth=length)
        run(f, "geometry.assign_representation", product=e, representation=rep)
        run(f, "geometry.edit_object_placement", product=e, matrix=matrix(origin, z, xv))
        run(f, "spatial.assign_container", products=[e], relating_structure=sto)
        if props:
            ps = run(f, "pset.add_pset", product=e, name="Pset_Pergola_Elemento")
            run(f, "pset.edit_pset", pset=ps, properties=props)
        members.append(e)
        return e

    # Columnas (2 = solo frente, 4 = esquinas)
    ys = [cs / 2] + ([D - cs / 2] if a.columnas == 4 else [])
    n = 0
    for y in ys:
        for x in (cs / 2, W - cs / 2):
            n += 1
            member("IfcColumn", f"Columna {n}", (x, y, 0), (0, 0, 1), (1, 0, 0), cs, cs, H - bh)

    # Vigas perimetrales
    member("IfcBeam", "Viga frontal", (0, bw / 2, zb), (1, 0, 0), (0, 1, 0), bw, bh, W)
    member("IfcBeam", "Viga trasera", (0, D - bw / 2, zb), (1, 0, 0), (0, 1, 0), bw, bh, W)
    member("IfcBeam", "Viga lateral izq", (bw / 2, bw, zb), (0, 1, 0), (1, 0, 0), bw, bh, D - 2 * bw)
    member("IfcBeam", "Viga lateral der", (W - bw / 2, bw, zb), (0, 1, 0), (1, 0, 0), bw, bh, D - 2 * bw)

    # Lamas: número calculado por fórmula, repartidas uniformemente
    inner = D - 2 * bw
    n_l = max(1, int(inner // (lw + gap)))
    pitch = inner / n_l
    c, s = math.cos(math.radians(ang)), math.sin(math.radians(ang))
    if lw * c > pitch + 1e-9:
        print(f"AVISO: a {ang}° las lamas se solapan en planta (paso {pitch:.3f} m < proyección {lw*c:.3f} m)")
    for i in range(n_l):
        y = bw + (i + 0.5) * pitch
        member("IfcShadingDevice", f"Lama {i+1}", (bw, y, zb), (1, 0, 0), (0, c, s), lw, lt, W - 2 * bw,
               ptype="JALOUSIE", props={"AnguloApertura_deg": float(ang)})

    # Contenedor: agregado "Pérgola" con parámetros de diseño
    perg = run(f, "root.create_entity", ifc_class="IfcBuildingElementProxy", name=a.nombre,
               predefined_type="USERDEFINED")
    perg.ObjectType = "Pergola bioclimatica"
    run(f, "spatial.assign_container", products=[perg], relating_structure=sto)
    run(f, "aggregate.assign_object", products=members, relating_object=perg)
    ps = run(f, "pset.add_pset", product=perg, name="Pset_Pergola_Parametros")
    run(f, "pset.edit_pset", pset=ps, properties={
        "Ancho_m": W, "Fondo_m": D, "AlturaLibre_m": H, "SeccionColumna_m": cs,
        "VigaAncho_m": bw, "VigaAlto_m": bh, "LamaAncho_m": lw, "LamaEspesor_m": lt,
        "LamaSeparacion_m": gap, "AnguloApertura_deg": float(ang),
        "NumeroColumnas": a.columnas, "NumeroLamas": n_l, "PasoLamas_m": round(pitch, 4),
        "SuperficieEnPlanta_m2": round(W * D, 3)})
    return f, n_l


if __name__ == "__main__":
    p = argparse.ArgumentParser(description="Pérgola bioclimática paramétrica -> IFC4 (metros)")
    p.add_argument("--nombre", default="Pergola bioclimatica")
    p.add_argument("--ancho", type=float, default=4.0, help="X, largo de las lamas")
    p.add_argument("--fondo", type=float, default=3.0, help="Y, profundidad")
    p.add_argument("--altura", type=float, default=2.6, help="Z, altura total hasta tope de vigas")
    p.add_argument("--col", type=float, default=0.15, help="sección cuadrada de columna")
    p.add_argument("--viga_b", type=float, default=0.15, help="ancho de viga")
    p.add_argument("--viga_h", type=float, default=0.20, help="alto de viga")
    p.add_argument("--lama_ancho", type=float, default=0.20)
    p.add_argument("--lama_esp", type=float, default=0.03)
    p.add_argument("--lama_sep", type=float, default=0.02, help="separación mínima entre lamas")
    p.add_argument("--angulo", type=float, default=0.0, help="0=cerrada, 90=vertical (máx. ~110)")
    p.add_argument("--columnas", type=int, choices=(2, 4), default=4)
    p.add_argument("--out", default="pergola_parametrica.ifc")
    a = p.parse_args()
    if not 0 <= a.angulo <= 110:
        p.error("--angulo debe estar entre 0 y 110")
    f, n = build(a)
    f.write(a.out)
    print(f"OK: {a.out} | lamas={n} | entidades={len(list(f))}")
