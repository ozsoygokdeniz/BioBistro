import re
from typing import Optional, Tuple

# ---------------------------------------------------------------------------
# Bilinen parametreler için dahili referans tablosu
# (PDF'de referans sütunu boş gelen idrar tahlili / bazı kan parametreleri)
# ---------------------------------------------------------------------------
_KNOWN_RANGES: dict[str, Tuple[Optional[float], Optional[float]]] = {
    # İdrar tahlili - sayısal
    "dansite":              (1.005, 1.030),
    "ph-idr":               (4.5,   8.0),
    "ph":                   (4.5,   8.0),
    # PCT (trombosit çökme oranı)
    "pct":                  (0.10,  0.28),
    # GFR
    "gfr(ckd-epi)":         (90.0,  None),
    "gfr(ckd-epi̇)":         (90.0,  None),
    "gfr(ckd-epı)":         (90.0,  None),
    "egfr":                 (90.0,  None),
    # İdrar mikroskopi sediment hücreleri (genelde 0-5 arası normal)
    "yassı epitel":         (None,  5.0),
    "yassi epitel":         (None,  5.0),
    "lokosit (mikroskopi)": (None,  5.0),
    "lökosit (mikroskopi)": (None,  5.0),
    "eritrosit - (mikroskopi)": (None,  3.0),
    # Diğer idrar mikroskopi parametreleri (0 olması normaldir)
    "bakteri":              (None, 0.0),
    "amorf kristaller":     (None, 0.0),
    "granüler silendir":    (None, 0.0),
    "hyalin silendir":      (None, 0.0),
    "kalsiyum okzelat kristalleri": (None, 0.0),
    "maya hücresi":         (None, 0.0),
    "renal epitel":         (None, 0.0),
    "triple fosfat kristali": (None, 0.0),
    "ürik asit kristali":   (None, 0.0),
}

# Nitel referans aralıkları → (expected_normal_values: set, abnormal_high_values: set)
# Küçük harfle karşılaştırılır.
_QUALITATIVE_NORMAL = {
    "neg", "negatif", "negative",
    "normal",
    "açık sarı", "acik sari", "sarı", "sari",          # renk
    "berrak", "clear",                                  # görünüm
    "görülmedi", "gorulmedi", "yok", "nadir",           # mikroskopi
}
_QUALITATIVE_HIGH = {
    "pos", "pozitif", "positive",
    "1+", "2+", "3+", "4+",                            # yarı kantitatif
    "+", "++", "+++", "++++",
    "trace", "iz", "eser", "bol",                      # miktar
    "bulanık", "bulanik", "kırmızı", "kirmizi", "kanlı", "kanli" # anormal görünüm
}


from functools import lru_cache

@lru_cache(maxsize=2048)
def _parse_reference_range(ref_str: str) -> Tuple[Optional[float], Optional[float]]:
    """
    '10 - 120', '> 50', '< 1.2', '6,5 - 12' gibi referans aralıklarını ayırır
    ve (low, high) çifti döner.
    """
    if not ref_str:
        return None, None

    ref_str = ref_str.strip().replace(',', '.')

    match_gt = re.search(r'[>≥]\s*([\d.]+)', ref_str)
    if match_gt:
        return float(match_gt.group(1)), None

    match_lt = re.search(r'[<≤]\s*([\d.]+)', ref_str)
    if match_lt:
        return None, float(match_lt.group(1))

    match_range = re.search(r'([\d.]+)\s*[-–]\s*([\d.]+)', ref_str)
    if match_range:
        return float(match_range.group(1)), float(match_range.group(2))

    return None, None


def _normalize_text(text: str) -> str:
    if not text:
        return ""
    return text.replace("İ", "i").replace("I", "ı").lower().strip()


def _qualitative_status(raw_value: str) -> Optional[str]:
    """
    'Neg', '1+', 'Normal', 'Açık Sarı' gibi metin değerleri için durum döner.
    Tanımlanamıyorsa None döner (çağıran devam eder).
    """
    v = _normalize_text(raw_value)
    if v in _QUALITATIVE_NORMAL:
        return "normal"
    if v in _QUALITATIVE_HIGH:
        return "high"
    return None


@lru_cache(maxsize=4096)
def get_value_status(
    numeric_value: Optional[float],
    reference_range: Optional[str],
    raw_value: Optional[str] = None,
    parameter_name: Optional[str] = None,
) -> str:
    """
    Bir parametrenin durumunu 'normal', 'high', 'low' veya 'unknown' olarak döner.

    Değerlendirme sırası:
    1. Nitel metin değeri varsa (Neg, 1+, Normal, Açık Sarı…) → kural tabanlı
    2. Sayısal değer + sayısal referans aralığı varsa → sayısal karşılaştırma
    3. Sayısal değer + referans yok ama parametre biliniyorsa → dahili tablo
    4. Sayısal değer 0 ve referans yok → mikroskopi sonucu olarak 'normal'
    5. Hiçbiri → 'unknown'
    """
    # --- 1. Nitel metin değeri ---
    if raw_value:
        q = _qualitative_status(raw_value)
        if q is not None:
            return q

    # --- 2. Sayısal değer + referans aralığı ---
    if numeric_value is not None and reference_range:
        low, high = _parse_reference_range(reference_range)
        if low is not None and numeric_value < low:
            return "low"
        if high is not None and numeric_value > high:
            return "high"
        if low is not None or high is not None:
            return "normal"

    # --- 3. Referans yok ama parametre dahili tabloda var ---
    if numeric_value is not None and parameter_name:
        key = _normalize_text(parameter_name)
        if key in _KNOWN_RANGES:
            low, high = _KNOWN_RANGES[key]
            if low is not None and numeric_value < low:
                return "low"
            if high is not None and numeric_value > high:
                return "high"
            return "normal"

    # --- 4. Sıfır değerli mikroskopi/sediment parametresi ---
    # (Amorf Kristaller, Bakteri, Granüler Silendir vb. — 0 ise her zaman normal)
    if numeric_value == 0.0:
        if not reference_range or reference_range.strip().lower() in ["-", "nadir", "yok", ""]:
            return "normal"

    return "unknown"
