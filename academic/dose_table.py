"""Consulta direta à Tabela 1 do Resumo Asma da SES/SC, setembro de 2026, p. 3.

Cada célula contém mg por aplicação / intervalo em semanas.
None representa a indicação de não administrar na tabela.
"""
from bisect import bisect_left

WEIGHT_UPPER_KG = (25, 30, 40, 50, 60, 70, 80, 90, 125, 150)
IGE_UPPER_IU_ML = (100, 200, 300, 400, 500, 600, 700, 800, 900, 1000, 1100, 1200, 1300, 1500)
TABLE = (
    ("75/4", "75/4", "75/4", "150/4", "150/4", "150/4", "150/4", "150/4", "300/4", "300/4"),
    ("150/4", "150/4", "150/4", "300/4", "300/4", "300/4", "300/4", "300/4", "450/4", "600/4"),
    ("150/4", "150/4", "225/4", "300/4", "300/4", "450/4", "450/4", "450/4", "600/4", "375/2"),
    ("225/4", "225/4", "300/4", "450/4", "450/4", "450/4", "600/4", "600/4", "450/2", "525/2"),
    ("225/4", "300/4", "450/4", "450/4", "600/4", "600/4", "375/2", "375/2", "525/2", "600/2"),
    ("300/4", "300/4", "450/4", "600/4", "600/4", "375/2", "450/2", "450/2", "600/2", None),
    ("300/4", "225/2", "450/4", "600/4", "375/2", "450/2", "450/2", "525/2", None, None),
    ("225/2", "225/2", "300/2", "375/2", "450/2", "450/2", "525/2", "600/2", None, None),
    ("225/2", "225/2", "300/2", "375/2", "450/2", "525/2", "600/2", None, None, None),
    ("225/2", "300/2", "375/2", "450/2", "525/2", "600/2", None, None, None, None),
    ("225/2", "300/2", "375/2", "450/2", "600/2", None, None, None, None, None),
    ("300/2", "300/2", "450/2", "525/2", "600/2", None, None, None, None, None),
    ("300/2", "375/2", "450/2", "525/2", None, None, None, None, None, None),
    ("300/2", "375/2", "525/2", "600/2", None, None, None, None, None, None),
)


def lookup_dose(weight_kg: float, ige_iu_ml: float) -> tuple[int, int] | None:
    """Retorne a célula aplicável da edição estudada, quando houver."""
    if not (20 <= weight_kg <= 150 and 30 <= ige_iu_ml <= 1500):
        return None
    column = bisect_left(WEIGHT_UPPER_KG, weight_kg)
    row = bisect_left(IGE_UPPER_IU_ML, ige_iu_ml)
    entry = TABLE[row][column]
    if entry is None:
        return None
    dose, interval = entry.split("/")
    return int(dose), int(interval)
