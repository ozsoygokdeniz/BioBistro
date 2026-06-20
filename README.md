# BioBistro

BioBistro, hastalarin kan tahlili (e-Nabiz PDF formatinda) sonuclarini analiz ederek, yapay zeka destekli kisisellestirilmis beslenme programlari ve yemek tarifleri sunan bir platformdur. Bu proje, kan degerlerindeki eksikliklere veya fazlaliklara yonelik ozel cozumler ureterek kullanicilarin saglikli beslenmesini hedeflemektedir.

## Mimari ve Teknolojiler

Proje uc ana bilesenden olusmaktadir:
- **Backend:** FastAPI (Python), SQLAlchemy (ORM), Alembic (Migrasyonlar), Google Gemini AI API (Analiz), PyMuPDF (PDF ayiklama).
- **Frontend:** React tabanli SPA (Single Page Application).
- **Mobile:** React Native (Expo) tabanli capraz platform mobil uygulama.

## Gerekli Kurulumlar

Projeyi lokal ortamda calistirmak icin asagidaki adimlari takip edebilirsiniz. `.env` dosyasi guvenlik sebebiyle git uzerinde tutulmamaktadir, bu nedenle ornek formattan kendinize gore bir dosya olusturmaniz gerekmektedir.

### Gereksinimler
- Python 3.10 veya ustu
- Node.js 18 veya ustu
- Gecerli bir Google Gemini API anahtari

### Backend Kurulumu
1. Repoyu klonlayin ve proje dizinine gecin.
2. Python sanal ortami (virtual environment) olusturun: `python -m venv venv`
3. Sanal ortami aktif edin:
   - Windows: `venv\Scripts\activate`
   - Linux/Mac: `source venv/bin/activate`
4. Bagimliliklari yukleyin: `pip install -r requirements.txt`
5. `.env.example` dosyasinin adini `.env` olarak degistirin ve ilgili alanlari (ozellikle GEMINI_API_KEY degerini) doldurun.
6. Veritabani tablolarini olusturmak icin migrasyonlari calistirin: `alembic upgrade head`
7. Uygulamayi baslatin: `uvicorn main:app --reload` (Varsayilan olarak http://127.0.0.1:8000 adresinde calisacaktir).

### Frontend Web Kurulumu
1. `frontend` dizinine gecin: `cd frontend`
2. Node paketlerini yukleyin: `npm install`
3. Gelistirme sunucusunu baslatin: `npm run dev`

### Mobil Uygulama Kurulumu
1. `mobile` dizinine gecin: `cd mobile`
2. Node paketlerini yukleyin: `npm install`
3. Expo gelistirme sunucusunu baslatin: `npx expo start`
4. Expo Go uygulamasi uzerinden cihaziniza kodu taratarak projeyi inceleyebilirsiniz.

## Dizin Yapisi

- `core/`: Uygulama ici loglama, middleware gibi cekirdek yapilandirmalar.
- `routers/`: Auth, kullanici yonetimi, kan tahlili yukleme ve tarif yonetimi API endpointleri.
- `services/`: Is mantigi; PDF okuyuculari, Gemini AI prompt yonetimi ve auth islemleri.
- `alembic/`: Veritabani sema degisikliklerinin takip edildigi migrasyon dosyalari.
- `models.py` & `schemas.py`: SQLAlchemy tablolari ve veri dogrulama (Pydantic) semalari.
- `frontend/`: Web projesi kaynak kodlari.
- `mobile/`: Mobil uygulama kaynak kodlari.

## Veritabani Yonetimi

Projede SQLite varsayilan veritabani olarak kullanilmistir. Modeller uzerinde bir degisiklik yapildiginda Alembic kullanilarak yeni bir revizyon olusturulmalidir:
`alembic revision --autogenerate -m "degisiklik aciklamasi"`
Ardindan `alembic upgrade head` komutuyla veritabanina uygulanabilir.
