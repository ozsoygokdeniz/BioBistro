# BioBistro

BioBistro, hastaların kan tahlillerini okuyup bu değerlere göre onlara özel yemek tarifleri çıkartan bir sağlık sistemi. Temel çıkış noktamız, e-Nabız üzerinden PDF formatında alınan kan tahlili sonuçlarını anlamlı beslenme diyetlerine dönüştürebilmek. 

Uygulamanın arayüzü ve temel özellikleri şu şekilde işliyor:

### 1. PDF İçerik Ayrıştırma ve Tahlil Yükleme
![Tahlil Yükleme Ekranı](docs/upload-screen.png)
*(Not: Uygulamanın tahlil yükleme ekranının bir görüntüsünü alıp proje dizininde oluşturacağınız `docs` klasörünün içine `upload-screen.png` adıyla koyarsanız burada doğrudan görünecektir.)*

Kullanıcı sisteme giriş yaptıktan sonra tahlil sonucunu PDF olarak yüklüyor. Arka planda PyMuPDF kütüphanesini kullanarak bu dosyayı okuyoruz. Burada sadece düz metin analizi yapmıyoruz; hastanın değerlerini referans aralıklarıyla karşılaştırıp nelerin eksik veya fazla olduğunu (demir eksikliği, kolesterol fazlalığı gibi) direkt kod tarafında tespit ediyoruz.

### 2. Yapay Zeka ile Kişiselleştirilmiş Diyet Reçetesi
![Diyet ve Tarifler Ekranı](docs/recipes-screen.png)
*(Not: Yapay zekanın çıkarttığı tariflerin yer aldığı ekran görüntüsünü `docs` klasörüne `recipes-screen.png` olarak ekleyebilirsiniz.)*

Çıkarttığımız bu temiz veri setini doğrudan Google Gemini API'sine gönderiyoruz. Gemini, hastanın mevcut değerlerini dengelemeye yönelik tamamen kişiselleştirilmiş bir beslenme planı ve yemek tarifleri oluşturuyor. Üstelik bu aşamada sistem, kullanıcının profilindeki yaş, kilo, boy ve özellikle alerji bilgilerini dikkate alarak tehlikeli olabilecek besinleri tariflerden otomatik olarak elliyor.

### 3. Profil ve Geçmiş Yönetimi
![Profil ve Geçmiş Ekranı](docs/profile-screen.png)
*(Not: Kullanıcının geçmiş tahlillerini ve kaydettiği favori tarifleri gördüğü ekranı `profile-screen.png` olarak ekleyebilirsiniz.)*

Sistemde JWT tabanlı standart ve güvenli bir üyelik yapısı mevcut. Kullanıcılar beğendikleri tarifleri kaydedebiliyor. Kendi profilleri üzerinden hem geçmiş tahlil analizlerine hem de bu analizlere göre önceden oluşturulmuş diyet programlarına istedikleri zaman ulaşabiliyorlar.

## Teknik Mimari

Platformun altyapısını üç temel modüle ayırdık:

- Backend: API tarafında Python tabanlı FastAPI ve veritabanı işlemleri için SQLAlchemy kullanıyoruz. Geliştirme ortamında veritabanı olarak SQLite ayarlı ancak üretim ortamı için PostgreSQL gibi çözümlere rahatça geçilebilir. Veritabanı tarafındaki tablo versiyonlamalarını ve migrasyonları Alembic ile yönetiyoruz.
- Frontend: Web tarafında standart React ve Vite altyapısı bulunuyor. Arayüz buradan hizmet veriyor.
- Mobil: Kullanıcıların telefonlarından da erişebilmesi için Expo kullanılarak geliştirilmiş bir React Native uygulaması mevcut.

## Geliştirme Ortamı Kurulumu

Projeyi lokal bilgisayarınızda ayağa kaldırmak için şu adımları izleyebilirsiniz:

Öncelikle backend için proje dizininde bir sanal ortam oluşturup `pip install -r requirements.txt` komutuyla paketleri kurun. Daha sonra kök dizindeki `.env.example` dosyasını kopyalayarak adını `.env` yapın ve içine kendi Google Gemini API anahtarınızı tanımlayın. Veritabanını hazırlamak için terminalden `alembic upgrade head` komutunu çalıştırın. Tüm bu hazırlıklar bittiğinde `uvicorn main:app --reload` komutuyla sunucuyu 8000 portunda başlatabilirsiniz.

Kullanıcı arayüzleri için durum çok daha basit. Web arayüzü için `frontend` klasörüne, mobil arayüz için `mobile` klasörüne girerek `npm install` ile paketleri indirin. Web uygulamasını `npm run dev` ile, mobil uygulamayı ise `npx expo start` ile ayağa kaldırıp test etmeye başlayabilirsiniz.

Kodlama standartları gereği backend tarafındaki veritabanı model güncellemelerinizden sonra mutlaka Alembic ile yeni revizyon dosyaları oluşturmayı unutmayın.
