from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI(
    title="BioBistro API",
    description="Backend API for parsing blood tests and providing AI-driven nutritional insights.",
    version="1.0.0"
)

# CORS yapılandırması (Frontend erişimi için)
origins = [
    "http://localhost",
    "http://localhost:3000", # React Web
    # Mobil uygulama için ek konfigürasyonlar eklenebilir
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
def read_root():
    return {"message": "BioBistro API çalışıyor", "status": "aktif"}
