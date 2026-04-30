import os
import json
import re
import traceback
import logging
import time
import google.generativeai as genai
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
# 40 Sabit Yemek için Statik Görsel Haritası (Unsplash curated fotoğraflar)
# Pollinations AI üretimi yerine — anında yüklenir, ücretsiz, yüksek kalite.
# ---------------------------------------------------------------------------
MEAL_IMAGES: dict[str, str] = {
    "Zeytinyağlı Enginar Kalbi":
        "https://images.unsplash.com/photo-1540420773420-3366772f4999?w=400&h=400&fit=crop",
    "Zerdeçallı ve Zencefilli Fırın Karnabahar":
        "https://images.unsplash.com/photo-1568605114967-8130f3a36994?w=400&h=400&fit=crop",
    "Kuşkonmazlı ve Mantarlı Kinoa Kasesi":
        "https://images.unsplash.com/photo-1505576399279-565b52d4ac71?w=400&h=400&fit=crop",
    "Brokoli ve Ispanaklı Yeşil Detoks Çorbası":
        "https://images.unsplash.com/photo-1547592166-23ac45744acd?w=400&h=400&fit=crop",
    "Fesleğenli Fırın Tatlı Patates":
        "https://images.unsplash.com/photo-1596560548464-f010549b84d7?w=400&h=400&fit=crop",
    "Zeytinyağlı Kereviz Yemeği":
        "https://images.unsplash.com/photo-1490645935967-10de6ba17061?w=400&h=400&fit=crop",
    "Sarımsaklı Yoğurtlu Pazı Kavurma":
        "https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=400&h=400&fit=crop",
    "Zerdeçallı Altın Süt (Golden Milk)":
        "https://images.unsplash.com/photo-1615485290382-441e4d049cb5?w=400&h=400&fit=crop",
    "Kırmızı Lahana ve Havuçlu Detoks Salatası":
        "https://images.unsplash.com/photo-1540189549336-e6e99c3679fe?w=400&h=400&fit=crop",
    "Karabuğdaylı Semizotu Salatası":
        "https://images.unsplash.com/photo-1592417817098-8fd3d9eb14a5?w=400&h=400&fit=crop",
    "Fırınlanmış Somon ve Izgara Sebzeler":
        "https://images.unsplash.com/photo-1467003909585-2f8a72700288?w=400&h=400&fit=crop",
    "Cevizli ve Avokadolu Roka Salatası":
        "https://images.unsplash.com/photo-1551248429-40975aa4de74?w=400&h=400&fit=crop",
    "Zeytinyağlı Humus ve Havuç Çubukları":
        "https://images.unsplash.com/photo-1571091718767-18b5b1457add?w=400&h=400&fit=crop",
    "Avokado Ezmeli Tam Buğday Tost":
        "https://images.unsplash.com/photo-1541519227354-08fa5d50c820?w=400&h=400&fit=crop",
    "Fırınlanmış Bademli Brüksel Lahanası":
        "https://images.unsplash.com/photo-1550989460-0adf9ea622e2?w=400&h=400&fit=crop",
    "Cevizli Ev Yapımı Pesto Soslu Kabak Spagetti":
        "https://images.unsplash.com/photo-1621996346565-e3dbc646d9a9?w=400&h=400&fit=crop",
    "Zeytinyağlı Taze Fasulye":
        "https://images.unsplash.com/photo-1567620905732-2d1ec7ab7445?w=400&h=400&fit=crop",
    "Keten Tohumlu ve Yaban Mersinli Yoğurt":
        "https://images.unsplash.com/photo-1488477181946-6428a0291777?w=400&h=400&fit=crop",
    "Ton Balıklı Kinoa Kasesi":
        "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=400&h=400&fit=crop",
    "Fırınlanmış Susamlı Somon Köftesi":
        "https://images.unsplash.com/photo-1485704686097-ed47f7263ca4?w=400&h=400&fit=crop",
    "Taze Vişne ve Kiraz Kasesi (veya Suyu)":
        "https://images.unsplash.com/photo-1528821128474-27f963b062bf?w=400&h=400&fit=crop",
    "Limonlu ve Naneli Salatalık Çorbası (Soğuk)":
        "https://images.unsplash.com/photo-1476718406336-bb5a9690ee2a?w=400&h=400&fit=crop",
    "Bol Domatesli Şehriye Çorbası":
        "https://images.unsplash.com/photo-1603105037880-880cd4edfb0d?w=400&h=400&fit=crop",
    "Cevizli ve Narlı Ispanak Salatası":
        "https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=400&h=400&fit=crop",
    "Fırınlanmış Domates ve Biber Dolması (Etsiz)":
        "https://images.unsplash.com/photo-1498579150354-977475b7ea0b?w=400&h=400&fit=crop",
    "Kızılcık (Cranberry) Suyu":
        "https://images.unsplash.com/photo-1534353473418-4cfa0a5f79a1?w=400&h=400&fit=crop",
    "Zeytinyağlı Bamya Yemeği":
        "https://images.unsplash.com/photo-1490645935967-10de6ba17061?w=400&h=400&fit=crop",
    "Yoğurtlu Havuç Tarator":
        "https://images.unsplash.com/photo-1447175008436-054170c2e979?w=400&h=400&fit=crop",
    "Mandalina ve Greyfurt Salatası":
        "https://images.unsplash.com/photo-1547592180-85f173990554?w=400&h=400&fit=crop",
    "Limonlu Izgara Kuşkonmaz":
        "https://images.unsplash.com/photo-1asparagus-grilled?w=400&h=400&fit=crop",
    "Sütlü ve Yulaflı Chia Puding":
        "https://images.unsplash.com/photo-1614961233913-a5113a4a34ed?w=400&h=400&fit=crop",
    "Lor Peynirli ve Çörek Otlu Tam Buğday Makarna":
        "https://images.unsplash.com/photo-1473093295043-cdd812d0e601?w=400&h=400&fit=crop",
    "Sütlü Kabak Çorbası":
        "https://images.unsplash.com/photo-1476718406336-bb5a9690ee2a?w=400&h=400&fit=crop",
    "Peynirli ve Ispanaklı Fırın Omlet (Frittata)":
        "https://images.unsplash.com/photo-1608039829572-78524f79c4c7?w=400&h=400&fit=crop",
    "Yoğurtlu Soslu Fırın Falafel":
        "https://images.unsplash.com/photo-1593560704563-f176a2eb61db?w=400&h=400&fit=crop",
    "Kefir ve Çilekli Smoothie":
        "https://images.unsplash.com/photo-1553530666-ba11a7da3888?w=400&h=400&fit=crop",
    "Mozzarella Peynirli Fesleğenli Domates (Caprese)":
        "https://images.unsplash.com/photo-1565299507177-b0ac66763828?w=400&h=400&fit=crop",
    "Fırınlanmış Tofu Küpleri":
        "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=400&h=400&fit=crop",
    "Süzme Yoğurtlu Köz Patlıcan (Babagannuş)":
        "https://images.unsplash.com/photo-1572453800999-e8d2d1589b7c?w=400&h=400&fit=crop",
    "Köy Peynirli ve Dereotlu Girit Ezmesi":
        "https://images.unsplash.com/photo-1559847844-5315695dadae?w=400&h=400&fit=crop",
}

def get_meal_image(food_name: str) -> str:
    """
    Yemek adına göre statik görsel URL döner.
    Haritada bulunamazsa Pexels arama sayfasına yönlendirir (fallback).
    """
    if food_name in MEAL_IMAGES:
        return MEAL_IMAGES[food_name]
    # Fallback: Pexels üzerinde İngilizce arama URL'si
    slug = food_name.lower().replace(" ", "+").replace("(", "").replace(")", "")
    return f"https://images.pexels.com/search/food+{slug}?w=400&h=400&fit=crop"

# Logging
logger = logging.getLogger(__name__)

load_dotenv()


def _format_blood_test_data(extraction: BloodTestExtraction) -> str:
    """Kan testi verisini AI için okunabilir string formata çevirir."""
    lines = [f"Test Tarihi: {extraction.date_taken}", "-" * 30]
    for param in extraction.parameters:
        ref = param.reference_range if param.reference_range else "Belirtilmemis"
        lines.append(f"{param.parameter_name}: {param.value} {param.unit} (Referans: {ref})")
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
    """
    api_key = os.getenv("GEMINI_API_KEY")
    if not api_key:
        raise ValueError("GEMINI_API_KEY ortam degiskeni bulunamadi. Lutfen .env dosyasina ekleyin.")
        
    genai.configure(api_key=api_key)
    model_name = "gemini-flash-latest"
    
    generation_config = genai.types.GenerationConfig(
        temperature=0.4,
        response_mime_type="application/json",
    )
    
    # Gemini 1.5 modelleri system_instruction destekler
    model = genai.GenerativeModel(
        model_name=model_name,
        system_instruction=system_prompt,
        generation_config=generation_config
    )
    
    for attempt in range(3):
        try:
            logger.info(f"AI analizi: Google Gemini {model_name} (deneme {attempt + 1}/3)")
            response = model.generate_content(user_prompt)
            
            if response.text:
                logger.info(f"AI analizi basarili: {model_name}")
                return response.text
            else:
                raise Exception("AI bos cevap dondurdu.")
                
        except Exception as e:
            logger.warning(f"Gemini Hata (deneme {attempt+1}): {str(e)}")
            if '429' in str(e) or 'quota' in str(e).lower():
                time.sleep(5)
                continue
            time.sleep(2)
            
    raise Exception("Tum Gemini AI denemeleri basarisiz oldu.")


def _build_nutrition_prompts(formatted_data: str, dietary_preferences: list = None) -> tuple[str, str]:
    """NutritionalInsight JSON semasina uygun system ve user promptlari olusturur."""
    
    allergy_text = ""
    if dietary_preferences and len(dietary_preferences) > 0 and dietary_preferences[0] != "none":
        allergy_text = f"\nDİKKAT! KULLANICININ ŞU ALERJİLERİ / DİYET KISITLAMALARI VARDIR: {', '.join(dietary_preferences)}. ASLA BUNLARI İÇEREN BİR TARİF VERME!"

    system_prompt = f"""
Sen uzman bir fonksiyonel tip diyetisyeni ve doktorusun.
Asagida bir hastanin kan tahlili sonuclari veriliyor. Sonuclara gore hastaya 3 farkli gunluk (1. Gun, 2. Gun, 3. Gun) ve her gun icin 3 ogunluk (Sabah, Ogle, Aksam) detayli bir beslenme plani cikaracaksin.

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
    for r in results:
        ref = r.reference_range if r.reference_range else "Belirtilmemis"
        lines.append(f"{r.parameter_name}: {r.original_value} {r.unit} (Referans: {ref})")
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
    for r in results:
        ref = r.reference_range if r.reference_range else "Belirtilmemis"
        lines.append(f"{r.parameter_name}: {r.original_value} {r.unit} (Referans: {ref})")
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

