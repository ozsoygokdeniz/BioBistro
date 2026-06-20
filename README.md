# BioBistro

BioBistro, e-Nabız üzerinden alınan PDF formatındaki kan tahlili sonuçlarını analiz eden ve yapay zeka destekli kişiselleştirilmiş beslenme programları sunan kapsamlı bir sağlık platformudur. Google Gemini AI ve PyMuPDF kullanarak karmaşık tıbbi verileri eyleme dönüştürülebilir, güvenli ve kişiye özel günlük yemek tariflerine çevirir.
![BioBistro Uygulama Ekranı](https://github.com/ozsoygokdeniz/BioBistro/blob/main/mockup.png?raw=true)

## İçindekiler
- [Özellikler](#özellikler)
- [Mimari ve Teknolojiler](#mimari-ve-teknolojiler)
- [Kurulum](#kurulum)
  - [Gereksinimler](#gereksinimler)
  - [Backend Kurulumu](#backend-kurulumu)
  - [Web Arayüzü Kurulumu](#web-arayüzü-kurulumu)
  - [Mobil Kurulumu](#mobil-kurulumu)
- [Kullanım Senaryosu](#kullanım-senaryosu)
- [Proje Yapısı](#proje-yapısı)
- [Katkıda Bulunma](#katkıda-bulunma)
- [Lisans](#lisans)

## Özellikler
- **Otomatik Tıbbi Veri Ayrıştırma:** Yapılandırılmış PDF kan tahlili raporlarındaki kritik bilgileri ayıklar ve standart referans aralıklarıyla karşılaştırır.
- **Yapay Zeka Destekli Beslenme Planları:** Kan değerlerindeki eksiklikleri veya fazlalıkları gidermek üzere tasarlanmış özelleştirilmiş yemek tarifleri oluşturmak için Google Gemini API ile entegre çalışır.
- **Alerji ve Profil Yönetimi:** Kullanıcının kayıtlı alerjilerine, yaşına ve fiziksel özelliklerine göre zararlı olabilecek malzemeleri otomatik olarak filtreler.
- **Çapraz Platform Desteği:** Duyarlı bir web arayüzü (React) ve mobil uygulama (React Native/Expo) sunar.
- **Güvenli Kimlik Doğrulama:** Kullanıcı oturumları ve geçmiş veri gizliliği için durumsuz (stateless) JWT tabanlı kimlik doğrulama uygular.

## Mimari ve Teknolojiler
Platform, modern ve ayrık (decoupled) bir mimari üzerine inşa edilmiştir:
- **Backend API:** Python, FastAPI, SQLAlchemy, Alembic (SQLite/PostgreSQL)
- **Frontend Web:** React, Vite, CSS Modules
- **Mobil Uygulama:** React Native, Expo
- **Yapay Zeka ve Veri İşleme:** Google Gemini API, PyMuPDF

## Kurulum

### Gereksinimler
- Python 3.10+
- Node.js 18.x+
- Git

### Backend Kurulumu
1. Proje ana dizinine gidin.
2. Sanal ortam (virtual environment) oluşturun ve aktifleştirin:
   ```bash
   python -m venv venv
   source venv/bin/activate  # Windows için: venv\Scripts\activate
   ```
3. Bağımlılıkları yükleyin:
   ```bash
   pip install -r requirements.txt
   ```
4. Yapılandırma: Örnek ortam değişkenleri dosyasını kopyalayın ve kendi kimlik bilgilerinizi (Gemini API Anahtarı dahil) ekleyin.
   ```bash
   cp .env.example .env
   ```
5. Veritabanı migrasyonlarını uygulayın:
   ```bash
   alembic upgrade head
   ```
6. Geliştirme sunucusunu başlatın:
   ```bash
   uvicorn main:app --reload
   ```
   API, `http://127.0.0.1:8000` adresinde çalışmaya başlayacaktır.

### Web Arayüzü Kurulumu
1. Frontend dizinine gidin:
   ```bash
   cd frontend
   ```
2. Bağımlılıkları yükleyin:
   ```bash
   npm install
   ```
3. Vite geliştirme sunucusunu başlatın:
   ```bash
   npm run dev
   ```

### Mobil Kurulumu
1. Mobil dizinine gidin:
   ```bash
   cd mobile
   ```
2. Bağımlılıkları yükleyin:
   ```bash
   npm install
   ```
3. Expo sunucusunu başlatın:
   ```bash
   npx expo start
   ```

## Kullanım Senaryosu
1. Web veya mobil arayüz üzerinden yeni bir kullanıcı hesabı oluşturun.
2. Fiziksel ölçümlerinizi ve bilinen besin alerjilerinizi ekleyerek profilinizi tamamlayın.
3. Yakın tarihli bir kan tahlili raporunuzu (PDF formatında) sisteme yükleyin.
4. Referans aralığı dışında kalan kan değerlerinizi vurgulayan analiz raporunu inceleyin.
5. Yapay zeka tarafından önerilen günlük tarifleri oluşturun ve kaydedin.

## Proje Yapısı
```text
.
├── alembic/             # Veritabanı migrasyon betikleri
├── core/                # Çekirdek yapılandırmalar ve middleware
├── frontend/            # React web uygulaması kaynak kodları
├── mobile/              # React Native mobil uygulaması kaynak kodları
├── routers/             # FastAPI rota tanımlamaları
├── services/            # İş mantığı, PDF ayrıştırma ve yapay zeka entegrasyonu
├── main.py              # FastAPI uygulamasının giriş noktası
├── models.py            # SQLAlchemy veritabanı modelleri
├── schemas.py           # Pydantic doğrulama şemaları
└── requirements.txt     # Python bağımlılıkları
```

## Katkıda Bulunma
BioBistro projesine katkıda bulunmak isterseniz lütfen aşağıdaki adımları izleyin:
1. Repoyu fork'layın.
2. Yeni bir branch oluşturun (`git checkout -b feature/yeni-ozellik`).
3. Değişikliklerinizi commit'leyin (`git commit -m 'Yeni özellik eklendi'`).
4. Branch'inize push'layın (`git push origin feature/yeni-ozellik`).
5. Bir Pull Request açın.

Lütfen kodunuzun mevcut biçimlendirme standartlarına uyduğundan ve tüm lokal testlerden geçtiğinden emin olun.
