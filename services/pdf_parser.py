import pdfplumber
import io
import re
from typing import List, Optional
from datetime import datetime, date
from schemas import BloodTestExtraction, BloodTestParameter

def clean_value(val: str) -> str:
    if not val:
        return ""
    return val.strip().replace('\n', ' ')

def extract_numeric(val: str) -> Optional[float]:
    if not val:
        return None
    # Sayısal kısmı çıkarmaya çalış (örn: "< 0.5" -> None veya 0.5'e de çevrilebilir ama şimdilik sadece tam sayıları alalım)
    # Temel bir sayı çıkarma mantığı
    match = re.search(r"[-+]?\d*\.\d+|\d+", val.replace(',', '.'))
    if match:
        try:
            return float(match.group())
        except ValueError:
            return None
    return None

def _extract_ref_from_continuation(text: str) -> Optional[str]:
    """
    eGFR ve TSH gibi değerlerde referans aralığı tablo hücresine sığmayıp
    açıklama metnine taşınır. Bu metinden doğru referans aralığını çıkarır.

    Öncelik sırası:
    1. 'Normal' kelimesi yakınındaki '>N' veya 'N-M' formatı
       (eGFR metni: '60-89 Normal GFR : >90' → '> 90')
    2. Metnin başındaki 'N - M' aralığı
       (TSH metni: '0.27 - 4.2 Gebelerde...' → '0.27 - 4.2')
    3. Metnin başındaki '>N' veya '<N' formatı
    """
    if not text:
        return None
    clean = text.replace(',', '.').replace('\n', ' ')

    # 1. 'Normal' kelimesi yakınındaki değer (eGFR gibi açıklamalı referanslar için)
    normal_match = re.search(r'Normal\s+\S+\s*:\s*([>≥<≤]?\s*\d+\.?\d*)', clean, re.IGNORECASE)
    if normal_match:
        val_str = normal_match.group(1).strip()
        # '>N' formatı
        m = re.match(r'([>≥<≤])\s*(\d+\.?\d*)', val_str)
        if m:
            op = '>' if m.group(1) in '>≥' else '<'
            return f"{op} {m.group(2)}"

    # 2. Metnin başındaki 'N - M' veya 'N-M' aralığı (TSH: '0.27 - 4.2 ...')
    m = re.match(r'\s*(\d+\.?\d*)\s*[-–]\s*(\d+\.?\d*)', clean)
    if m:
        return f"{m.group(1)} - {m.group(2)}"

    # 3. Herhangi bir yerde '>N' veya '<N'
    m = re.search(r'[>≥]\s*(\d+\.?\d*)', clean)
    if m:
        return f"> {m.group(1)}"
    m = re.search(r'[<≤]\s*(\d+\.?\d*)', clean)
    if m:
        return f"< {m.group(1)}"

    # 4. Herhangi bir yerde 'N - M' (son çare)
    m = re.search(r'(\d+\.?\d*)\s*[-–]\s*(\d+\.?\d*)', clean)
    if m:
        return f"{m.group(1)} - {m.group(2)}"

    return None


def parse_enabiz_pdf(file_bytes: bytes) -> BloodTestExtraction:
    """
    E-Nabız kan tahlili PDF dosyasını okuyarak yapılandırılmış formata dönüştürür.
    Bazı değerlerde (eGFR, TSH vb.) referans aralığı tablo hücresine sığmayıp
    bir sonraki satıra açıklama olarak taşınır; bu durum özel olarak işlenir.
    """
    parameters: List[BloodTestParameter] = []
    date_taken_str = None

    with pdfplumber.open(io.BytesIO(file_bytes)) as pdf:
        for page in pdf.pages:
            # Önce sayfanın metin kısmından tarihi bulmaya çalışalım (Sayfa 1'de genelde "Tarih: dd.mm.yyyy" yazar)
            text = page.extract_text()
            if not date_taken_str and text:
                match = re.search(r"Tarih:\s*(\d{2}\.\d{2}\.\d{4})", text)
                if match:
                    date_taken_str = match.group(1)

            # Tabloları analiz et
            tables = page.extract_tables()
            for table in tables:
                rows = list(table)
                for idx, row in enumerate(rows):
                    # E-Nabız tabloları genelde 5 sütundur: ['Tarih/Saat', 'Tahlil', 'Sonuç', 'Birim', 'Referans']
                    # Sütun sayısı 5'ten az ise veya ilk satır başlıksa atla
                    if not row or len(row) < 5:
                        continue
                    
                    tahlil_adi = clean_value(row[1])
                    sonuc = clean_value(row[2])
                    birim = clean_value(row[3])
                    referans = clean_value(row[4])

                    # 'Tahlil' sütunu boşsa burası muhtemelen bir açıklama/devam satırıdır. Atla.
                    if not tahlil_adi or not sonuc or tahlil_adi.lower() == "tahlil":
                        continue

                    # Referans sütunu boşsa → bir sonraki satırın açıklama metninden çıkarmayı dene
                    # (eGFR, TSH gibi değerlerde referans hücreye sığmayıp alt satıra taşınır)
                    if not referans and idx + 1 < len(rows):
                        next_row = rows[idx + 1]
                        # Devam satırı: genelde sadece ilk sütun dolu, diğerleri None/boş
                        if next_row and len(next_row) >= 5:
                            next_tahlil = clean_value(next_row[1]) if next_row[1] else ""
                            next_sonuc = clean_value(next_row[2]) if next_row[2] else ""
                            if not next_tahlil and not next_sonuc:
                                continuation_text = clean_value(next_row[0]) if next_row[0] else ""
                                extracted = _extract_ref_from_continuation(continuation_text)
                                if extracted:
                                    referans = extracted

                    # Sayısal değeri çözümle
                    numeric_val = extract_numeric(sonuc)

                    param = BloodTestParameter(
                        parameter_name=tahlil_adi,
                        value=sonuc,
                        numeric_value=numeric_val,
                        unit=birim,
                        reference_range=referans if referans else None
                    )
                    parameters.append(param)

    # Tarihi gerçek date nesnesine çevir (varsayılan olarak bugün)
    final_date = date.today()
    if date_taken_str:
        try:
            final_date = datetime.strptime(date_taken_str, "%d.%m.%Y").date()
        except ValueError:
            pass # Parse edemezse bugünü alır
            
    return BloodTestExtraction(
        date_taken=final_date,
        parameters=parameters
    )
