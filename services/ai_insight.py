import os
import json
import re
import traceback
import logging
import time
import google.genai as genai
from google.genai import types as genai_types
from dotenv import load_dotenv
from schemas import BloodTestExtraction, NutritionalInsight, MealRecommendation

# Sabit Yemek Listesi
FIXED_MEALS = """1. Zeytinyağlı Enginar Kalbi
2. Zerdeçallı ve Zencefilli Fırın Karnabahar
3. Kuşkonmazlı ve Mantarlı Kinoa Kasesi
4. Brokoli ve Ispanaklı Yeşil Detoks Çorbası
5. Fesleğenli Fırın Tatlı Patates
6. Zeytinyağlı Kereviz Yemeği
7. Sarımsaklı Yoğurtlu Pazı Kavurma
8. Zerdeçallı Altın Süt (Golden Milk)
9. Kırmızı Lahana ve Havuçlu Detoks Salatası
10. Karabuğdaylı Semizotu Salatası
11. Fırınlanmış Somon ve Izgara Sebzeler
12. Cevizli ve Avokadolu Roka Salatası
13. Zeytinyağlı Humus ve Havuç Çubukları
14. Avokado Ezmeli Tam Buğday Tost
15. Fırınlanmış Bademli Brüksel Lahanası
16. Cevizli Ev Yapımı Pesto Soslu Kabak Spagetti
17. Zeytinyağlı Taze Fasulye
18. Keten Tohumlu ve Yaban Mersinli Yoğurt
19. Ton Balıklı Kinoa Kasesi
20. Fırınlanmış Susamlı Somon Köftesi
21. Taze Vişne ve Kiraz Kasesi (veya Suyu)
22. Limonlu ve Naneli Salatalık Çorbası (Soğuk)
23. Bol Domatesli Şehriye Çorbası
24. Cevizli ve Narlı Ispanak Salatası
25. Fırınlanmış Domates ve Biber Dolması (Etsiz)
26. Kızılcık (Cranberry) Suyu
27. Zeytinyağlı Bamya Yemeği
28. Yoğurtlu Havuç Tarator
29. Mandalina ve Greyfurt Salatası
30. Limonlu Izgara Kuşkonmaz
31. Sütlü ve Yulaflı Chia Puding
32. Lor Peynirli ve Çörek Otlu Tam Buğday Makarna
33. Sütlü Kabak Çorbası
34. Peynirli ve Ispanaklı Fırın Omlet (Frittata)
35. Yoğurtlu Soslu Fırın Falafel
36. Kefir ve Çilekli Smoothie
37. Mozzarella Peynirli Fesleğenli Domates (Caprese)
38. Fırınlanmış Tofu Küpleri
39. Süzme Yoğurtlu Köz Patlıcan (Babagannuş)
40. Köy Peynirli ve Dereotlu Girit Ezmesi"""

# ---------------------------------------------------------------------------
# 40 Sabit Yemek için Yerel Görsel Haritası
# Kullanıcının yüklediği fotoğrafları (/meal-images/X.png) kullanır.
# ---------------------------------------------------------------------------
MEAL_IMAGES: dict[str, str] = {
    "Zeytinyağlı Enginar Kalbi": "/meal-images/1.png",
    "Zerdeçallı ve Zencefilli Fırın Karnabahar": "/meal-images/2.png",
    "Kuşkonmazlı ve Mantarlı Kinoa Kasesi": "/meal-images/3.png",
    "Brokoli ve Ispanaklı Yeşil Detoks Çorbası": "/meal-images/4.png",
    "Fesleğenli Fırın Tatlı Patates": "/meal-images/5.png",
    "Zeytinyağlı Kereviz Yemeği": "/meal-images/6.png",
    "Sarımsaklı Yoğurtlu Pazı Kavurma": "/meal-images/7.png",
    "Zerdeçallı Altın Süt (Golden Milk)": "/meal-images/8.png",
    "Kırmızı Lahana ve Havuçlu Detoks Salatası": "/meal-images/9.png",
    "Karabuğdaylı Semizotu Salatası": "/meal-images/10.png",
    "Fırınlanmış Somon ve Izgara Sebzeler": "/meal-images/11.png",
    "Cevizli ve Avokadolu Roka Salatası": "/meal-images/12.png",
    "Zeytinyağlı Humus ve Havuç Çubukları": "/meal-images/13.png",
    "Avokado Ezmeli Tam Buğday Tost": "/meal-images/14.png",
    "Fırınlanmış Bademli Brüksel Lahanası": "/meal-images/15.png",
    "Cevizli Ev Yapımı Pesto Soslu Kabak Spagetti": "/meal-images/16.png",
    "Zeytinyağlı Taze Fasulye": "/meal-images/17.png",
    "Keten Tohumlu ve Yaban Mersinli Yoğurt": "/meal-images/18.png",
    "Ton Balıklı Kinoa Kasesi": "/meal-images/19.png",
    "Fırınlanmış Susamlı Somon Köftesi": "/meal-images/20.png",
    "Taze Vişne ve Kiraz Kasesi (veya Suyu)": "/meal-images/21.png",
    "Limonlu ve Naneli Salatalık Çorbası (Soğuk)": "/meal-images/22.png",
    "Bol Domatesli Şehriye Çorbası": "/meal-images/23.png",
    "Cevizli ve Narlı Ispanak Salatası": "/meal-images/24.png",
    "Fırınlanmış Domates ve Biber Dolması (Etsiz)": "/meal-images/25.png",
    "Kızılcık (Cranberry) Suyu": "/meal-images/26.png",
    "Zeytinyağlı Bamya Yemeği": "/meal-images/27.png",
    "Yoğurtlu Havuç Tarator": "/meal-images/28.png",
    "Mandalina ve Greyfurt Salatası": "/meal-images/29.png",
    "Limonlu Izgara Kuşkonmaz": "/meal-images/30.png",
    "Sütlü ve Yulaflı Chia Puding": "/meal-images/31.png",
    "Lor Peynirli ve Çörek Otlu Tam Buğday Makarna": "/meal-images/32.png",
    "Sütlü Kabak Çorbası": "/meal-images/33.png",
    "Peynirli ve Ispanaklı Fırın Omlet (Frittata)": "/meal-images/34.png",
    "Yoğurtlu Soslu Fırın Falafel": "/meal-images/35.png",
    "Kefir ve Çilekli Smoothie": "/meal-images/36.png",
    "Mozzarella Peynirli Fesleğenli Domates (Caprese)": "/meal-images/37.png",
    "Fırınlanmış Tofu Küpleri": "/meal-images/38.png",
    "Süzme Yoğurtlu Köz Patlıcan (Babagannuş)": "/meal-images/39.png",
    "Köy Peynirli ve Dereotlu Girit Ezmesi": "/meal-images/40.png",
}

def get_meal_image(food_name: str) -> str:
    """
    Yemek adına göre statik görsel URL döner.
    Haritada bulunamazsa Pexels arama sayfasına yönlendirir (fallback).
    """
    if not food_name:
        return ""
        
    # AI bazen "1. Zeytinyağlı Enginar" şeklinde liste numarasıyla döndürebilir
    # Baştaki rakam, nokta ve boşlukları temizle
    cleaned_name = re.sub(r'^\d+\.\s*', '', food_name).strip()
    
    if cleaned_name in MEAL_IMAGES:
        return MEAL_IMAGES[cleaned_name]
        
    # Sadece isimler tam eşleşmezse diye, alt string araması da yapalım
    for key, img_url in MEAL_IMAGES.items():
        if key.lower() in cleaned_name.lower() or cleaned_name.lower() in key.lower():
            return img_url
            
    # Fallback: Eğer hiç bulunamazsa, kırık resim yerine boş dönebiliriz veya placeholder koyabiliriz
    # Pexels URL'si bir web sayfasıydı, resim değil. Bu yüzden resim patlıyordu.
    # Sabit bir varsayılan sağlıklı yemek görseli koyalım:
    return "https://images.unsplash.com/photo-1490645935967-10de6ba17061?w=400&h=400&fit=crop"

# Logging
logger = logging.getLogger(__name__)

load_dotenv()


from services.analytics import get_value_status

def _format_blood_test_data(extraction: BloodTestExtraction) -> str:
    """Kan testi verisini AI için okunabilir string formata çevirir. Sadece anormal değerleri vurgular."""
    lines = [f"Test Tarihi: {extraction.date_taken}", "-" * 30]
    abnormal_found = False
    for param in extraction.parameters:
        status = get_value_status(param.numeric_value, param.reference_range, param.value, param.parameter_name)
        if status in ["high", "low"]:
            abnormal_found = True
            ref = param.reference_range if param.reference_range else "Belirtilmemis"
            durum_tr = "YÜKSEK" if status == "high" else "DÜŞÜK"
            lines.append(f"[DİKKAT: {durum_tr}] {param.parameter_name}: {param.value} {param.unit} (Referans: {ref})")
            
    if not abnormal_found:
        lines.append("Harika! Bu tahlildeki tüm değerler normal referans aralıklarında.")
        
    return "\n".join(lines)


def _clean_json(text: str) -> str:
    """Gemini zaman zaman JSON'u ```json ... ``` blogu icinde dondurur — temizle."""
    text = text.strip()
    if text.startswith("```"):
        parts = text.split("```")
        # ['', 'json\n{...}', ''] formatinda gelir
        inner = parts[1] if len(parts) > 1 else parts[0]
        if inner.startswith("json"):
            inner = inner[4:]
        text = inner.strip()
    return text


def _get_gemini_response(system_prompt: str, user_prompt: str) -> str:
    """
    Google Gemini (AI Studio) uzerinden JSON istegi gonderir.
    GEMINI_API_KEY ortam degiskenini kullanir.
    503/429 icin otomatik retry + gemini-2.0-flash fallback.
    """
    api_key = os.getenv("GEMINI_API_KEY")
    if not api_key:
        raise ValueError("GEMINI_API_KEY ortam degiskeni bulunamadi. Lutfen .env dosyasina ekleyin.")

    client = genai.Client(api_key=api_key)

    # Oncelikli model, erisim sorunu olursa yedek (Hızlı yanıt için kotası olanları öne aldım)
    models_to_try = ["gemini-2.0-flash", "gemini-3.5-flash", "gemini-3.1-pro-preview", "gemini-2.5-flash"]
    last_error = None

    for model_name in models_to_try:
        for attempt in range(3):
            try:
                logger.info(f"AI analizi: {model_name} (deneme {attempt + 1}/3)")
                response = client.models.generate_content(
                    model=model_name,
                    contents=user_prompt,
                    config=genai_types.GenerateContentConfig(
                        system_instruction=system_prompt,
                        temperature=0.4,
                        response_mime_type="application/json",
                    )
                )

                if response.text:
                    logger.info(f"AI analizi basarili: {model_name}")
                    return response.text
                else:
                    raise Exception("AI bos cevap dondurdu.")

            except Exception as e:
                last_error = e
                err_str = str(e)
                logger.warning(f"Gemini Hata [{model_name}] (deneme {attempt + 1}): {err_str[:200]}")

                if '503' in err_str or 'UNAVAILABLE' in err_str or 'high demand' in err_str.lower():
                    wait_sec = 3 * (attempt + 1)
                    logger.info(f"503 alindi, {wait_sec}s bekleniyor...")
                    time.sleep(wait_sec)
                    continue
                elif '429' in err_str or 'RESOURCE_EXHAUSTED' in err_str:
                    if 'exceeded your current quota' in err_str.lower():
                        logger.error(f"API Kotası Doldu ({model_name})!")
                        break  # Bu model icin kotamiz doldu, sonraki modele gec
                    time.sleep(5)
                    continue
                elif '404' in err_str or 'NOT_FOUND' in err_str:
                    logger.warning(f"{model_name} 404 aldi, yedek modele geciliyor...")
                    break  # ic donguyu kirarak sonraki model_name'e gec
                else:
                    time.sleep(2)
        else:
            logger.warning(f"{model_name} icin tum denemeler basarisiz, yedek modele geciliyor...")

    raise Exception(f"Tum Gemini modelleri basarisiz. Son hata: {str(last_error)[:300]}")


def _build_nutrition_prompts(formatted_data: str, dietary_preferences: list = None) -> tuple[str, str]:
    """NutritionalInsight JSON semasina uygun system ve user promptlari olusturur."""
    
    allergy_text = ""
    if dietary_preferences and len(dietary_preferences) > 0 and dietary_preferences[0] != "none":
        allergy_text = f"\nDİKKAT! KULLANICININ ŞU ALERJİLERİ / DİYET KISITLAMALARI VARDIR: {', '.join(dietary_preferences)}. ASLA BUNLARI İÇEREN BİR TARİF VERME!"

    system_prompt = f"""
Sen uzman bir fonksiyonel tip diyetisyeni ve doktorusun.
Asagida bir hastanin kan tahlili sonuclari veriliyor. Sonuclara gore hastaya 4 farkli gunluk (1. Gun, 2. Gun, 3. Gun, 4. Gun) ve her gun icin 3 ogunluk (Sabah, Ogle, Aksam) detayli bir beslenme plani cikaracaksin.

ÖNEMLİ KURAL 1: Yemek isimlerini (food_name) SADECE aşağıdaki Sabit Yemek Havuzundan seçeceksin. Dışarıdan yemek uydurmak yasaktır!
Sabit Yemek Havuzu:
{FIXED_MEALS}
{allergy_text}

ÖNEMLİ KURAL 2: Her ogun icin:
- Yemegin adini ver (food_name).
- Hastanin kan tahlilindeki degerleri desteklemek icin neden onerildigini tek bir Turkce cumle ile acikla (reason).
- image_url alanina sadece bos string koy: ""
- Hazirlama suresi (prep_time) (orn: "20m").
- Zorluk (difficulty) (Easy, Medium, Hard).
- Puan (rating) (orn: "4.8", "5.0").
- Malzeme listesi (ingredients) (name: "Egg", amount: "2x pcs").

DIKKAT: Sadece gecerli bir JSON dondur. Baska hicbir sey yazma. Markdown karakterleri kullanma. Sadece saf JSON baslasin ve bitsin.
JSON Semasi:
{{
  "summary": "ozet",
  "potential_deficiencies": ["Eksik 1"],
  "daily_plans": [
     {{
       "day_name": "1. Gun",
       "meals": [
         {{
           "meal_type": "Sabah",
           "food_name": "...",
           "reason": "...",
           "prep_time": "...",
           "difficulty": "...",
           "rating": "...",
           "ingredients": [ {{"name": "...", "amount": "..."}} ],
           "image_url": "..."
         }}
       ]
     }}
  ],
  "foods_to_avoid": ["..."],
  "general_advice": ["..."]
}}

HATA YAPMA: JSON anahtarlari Ingilizce, degerler Turkce olmali. Tum alanlar doldurulmali.
"""
    user_prompt = f"Hastanin Kan Tahlili Verileri:\n{formatted_data}\n\nLutfen yukaridaki formata birebir uyan ve bu verilere ozel bir JSON dondur."
    return system_prompt, user_prompt


def _inject_meal_images(result_dict: dict) -> None:
    """
    Gemini'nin ürettiği JSON dict içindeki tüm meal'lerin image_url'ini
    statik MEAL_IMAGES haritasından gelen değerle değiştirir.
    Haritada bulunmayan yemekler için get_meal_image fallback URL'sini kullanır.
    """
    for day in result_dict.get("daily_plans", []):
        for meal in day.get("meals", []):
            food_name = meal.get("food_name", "")
            meal["image_url"] = get_meal_image(food_name)


def generate_nutritional_insight(extraction: BloodTestExtraction) -> NutritionalInsight:
    """
    PDF'ten parse edilen BloodTestExtraction verisini Google Gemini AI'ya gonderir.
    """
    formatted_data = _format_blood_test_data(extraction)
    sys_prompt, user_prompt = _build_nutrition_prompts(formatted_data)

    try:
        response_text = _get_gemini_response(sys_prompt, user_prompt)
        cleaned = _clean_json(response_text)
        result_dict = json.loads(cleaned)
        _inject_meal_images(result_dict)
        return NutritionalInsight(**result_dict)
    except json.JSONDecodeError as je:
        logger.error(f"JSON Cozumleme Hatasi: {str(je)}\nRaw response: {response_text[:500]}")
        raise ValueError("Yapay zeka gecerli bir JSON formatinda cevap vermedi.")
    except Exception as e:
        logger.error(f"AI Insight Hatasi: {traceback.format_exc()}")
        raise e


def generate_insight_from_db_results(test_date, results: list, dietary_preferences: list = None) -> NutritionalInsight:
    """
    Veritabanindan cekilmis BloodTestResult nesneleri uzerinden Google Gemini AI analizi yapar.
    """
    lines = [f"Test Tarihi: {test_date}", "-" * 30]
    abnormal_found = False
    for r in results:
        status = get_value_status(r.value, r.reference_range, r.original_value, r.parameter_name)
        if status in ["high", "low"]:
            abnormal_found = True
            ref = r.reference_range if r.reference_range else "Belirtilmemis"
            durum_tr = "YÜKSEK" if status == "high" else "DÜŞÜK"
            lines.append(f"[DİKKAT: {durum_tr}] {r.parameter_name}: {r.original_value} {r.unit} (Referans: {ref})")
            
    if not abnormal_found:
        lines.append("Harika! Bu tahlildeki tüm değerler normal referans aralıklarında.")
        
    formatted_data = "\n".join(lines)

    sys_prompt, user_prompt = _build_nutrition_prompts(formatted_data, dietary_preferences)

    try:
        response_text = _get_gemini_response(sys_prompt, user_prompt)
        cleaned = _clean_json(response_text)
        result_dict = json.loads(cleaned)
        _inject_meal_images(result_dict)
        return NutritionalInsight(**result_dict)
    except json.JSONDecodeError as je:
        logger.error(f"JSON Cozumleme Hatasi (DB): {str(je)}\nRaw response: {response_text[:500]}")
        raise ValueError("Yapay zeka beklenen JSON formatinda cevap vermedi.")
    except Exception as e:
        logger.error(f"AI Insight (DB) Hatasi: {traceback.format_exc()}")
        raise e

def refresh_single_meal(test_date, results: list, meal_type: str, rejected_food: str, dietary_preferences: list = None) -> MealRecommendation:
    """Tek bir öğünü yenilemek için kullanılır."""
    lines = [f"Test Tarihi: {test_date}", "-" * 30]
    abnormal_found = False
    for r in results:
        status = get_value_status(r.value, r.reference_range, r.original_value, r.parameter_name)
        if status in ["high", "low"]:
            abnormal_found = True
            ref = r.reference_range if r.reference_range else "Belirtilmemis"
            durum_tr = "YÜKSEK" if status == "high" else "DÜŞÜK"
            lines.append(f"[DİKKAT: {durum_tr}] {r.parameter_name}: {r.original_value} {r.unit} (Referans: {ref})")
            
    if not abnormal_found:
        lines.append("Harika! Bu tahlildeki tüm değerler normal referans aralıklarında.")
        
    formatted_data = "\n".join(lines)
    
    allergy_text = ""
    if dietary_preferences and len(dietary_preferences) > 0 and dietary_preferences[0] != "none":
        allergy_text = f"\nDİKKAT! KULLANICININ ŞU ALERJİLERİ VARDIR: {', '.join(dietary_preferences)}."

    sys_prompt = f"""
Sen uzman diyetisyensin. Hasta "{rejected_food}" adli {meal_type} yemeğini begenmedi. 
Bana onun tahlil sonuclarina uygun YEPYENI BIR {meal_type} yemeği ver. 

ZORUNLU KURAL: Yemek ismini (food_name) SADECE asagidaki listeden sec.
{FIXED_MEALS}
{allergy_text}

Ayni JSON semasi:
{{
  "meal_type": "{meal_type}",
  "food_name": "...",
  "reason": "...",
  "prep_time": "...",
  "difficulty": "...",
  "rating": "...",
  "ingredients": [ {{"name": "...", "amount": "..."}} ],
  "image_url": "..."
}}
"""
    user_prompt = f"Hastanin Kan Tahlili Verileri:\n{formatted_data}\n\nSadece istenen yemek icin JSON dondur."
    
    response_text = _get_gemini_response(sys_prompt, user_prompt)
    cleaned = _clean_json(response_text)
    result_dict = json.loads(cleaned)
    result_dict["image_url"] = get_meal_image(result_dict.get("food_name", ""))
    return MealRecommendation(**result_dict)

