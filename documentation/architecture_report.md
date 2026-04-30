# BioBistro Teknik Mimari ve Detaylı Sistem Analizi

Bu rapor, BioBistro projesinin yazılım mimarisini, veri akışını ve teknik bileşenlerini derinlemesine incelemektedir. İlk rapordaki temel kavramlar burada teknik detaylarla zenginleştirilmiştir.

---

## 1. Uçtan Uca İstek Yaşam Döngüsü (Request Lifecycle)

Bir kullanıcının sisteme yaptığı bir isteğin (örneğin: kan tahlili yükleme) izlediği yol şu şekildedir:

1.  **Client Layer:** Frontend (React) veya Mobile (Expo) üzerinden Axios ile `POST /api/v1/blood-tests/upload` isteği atılır. Header'da JWT token (`Authorization: Bearer <token>`) gönderilir.
2.  **Middleware Layer:** 
    *   `LoggingMiddleware`: İsteğin detaylarını loglar.
    *   `CORSMiddleware`: Tanımlanan `origins` (localhost, LAN IP'leri vb.) üzerinden gelen isteğe izin verir.
3.  **Dependency Injection (DI) & Guard:** 
    *   `get_db`: Veritabanı oturumunu (`Session`) açar.
    *   `get_current_user`: JWT token'ı doğrular, süresini kontrol eder ve veritabanından ilgili `User` nesnesini getirerek rotaya enjekte eder (Güvenlik Katmanı).
4.  **Router/Controller:** `UploadFile` objesini alır, dosya tipini sınar.
5.  **Service Layer:** 
    *   `pdf_parser.parse_enabiz_pdf`: `pdfplumber` kullanarak PDF sayfalarını tarar, regex (`Tarih: dd.mm.yyyy`) ile tahlil tarihini bulur ve tabloları JSON formatına (`BloodTestExtraction`) dönüştürür.
6.  **CRUD Layer:** Ayrıştırılan veriler SQLAlchemy modellerine (`BloodTestResult`) dönüştürülerek veritabanına kaydedilir.
7.  **Response:** İşlem sonucu kullanıcıya başarı mesajı ve kaydedilen verinin ID'si ile dönülür.

---

## 2. Yapay Zeka ve Veri İşleme Hattı (Pipeline)

Projenin en kritik özelliği olan AI Analiz süreci iki aşamalı çalışır:

### Veri Ayıklama (Extraction)
*   **Kütüphane:** `pdfplumber` & `re`.
*   **Mantık:** E-Nabız formatındaki tablolar 5 sütunlu (`Tahlil`, `Sonuç`, `Birim`, `Referans`) yapıda taranır. Sayısal değerler `,` -> `.` dönüşümü yapılarak normalize edilir.

### AI Zekası (Insight Generation)
*   **Motor:** Google Gemini (2.0-flash / 1.5-flash).
*   **Prompt Engineering:** Çıkarılan tahlil verileri, önceden tanımlanmış bir "Uzman Doktor/Diyetisyen" sistem komutu ile birleştirilir. 
*   **Görselleştirme:** Yemek tarifleri için `pollinations.ai` API'si üzerinden dinamik prompt'larla yemek resimleri üretilir.
*   **Validasyon:** AI çıktısı, Pydantic `NutritionalInsight` şeması ile zorunlu JSON formatında doğrulanır.

---

## 3. Veritabanı ve Altyapı Stratejisi

### Supabase & PostgreSQL
*   Sistem veritabanı olarak bulut tabanlı PostgreSQL (Supabase) kullanır.
*   **Bağlantı Havuzlaması:** `NullPool` sınıfı kullanılarak Supabase'in PgBouncer (transaction mode) yapısıyla uyumluluk sağlanır. Bu, yüksek kullanıcı yükünde bağlantı hatalarını önler.

### Şema Yönetimi (Alembic)
*   `alembic/versions` altında tutulan dosyalarla şema değişiklikleri versiyonlanır.
    *   `fa113544a56a`: İlk tablo yapıları (Users, BloodTests, Results).
    *   `cdb8a733ce88`: Kullanıcı modeli güncellemeleri.

---

## 4. Frontend ve Kullanıcı Deneyimi (UX)

### Tasarım Sistemi: Glassmorphism
*   **Estetik:** Blur efektli kartlar, canlı gradyanlar (`index.css` içindeki modern CSS token'ları).
*   **React Mimari:**
    *   `components/`: Atomik parçalar (Navbar, Button, StatsCard).
    *   `pages/`: İş akış sayfaları (Dashboard, Upload, Analysis).
*   **Mobil Uyumluluk:** Expo `flexbox` yapısı ve `react-native-reanimated` ile akıcı mikro-animasyonlar.

---

## 5. Güvenlik Tasarımı

*   **Şifre Güvenliği:** `PBKDF2-SHA256` hashleme mekanizması (`passlib`).
*   **Token Güvenliği:** 256-bit gizli anahtar ile imzalanmış JWT.
*   **Bağımsızlık:** Her kullanıcı sadece kendi tahlil sonuçlarına (`user_id` filtresi ile) erişebilir (Data Isolation).

*Bu belge, BioBistro mimarisinin teknik standartlarını ve çalışma prensiplerini detaylandırmaktadır.*
