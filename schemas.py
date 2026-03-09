from pydantic import BaseModel, ConfigDict, Field
from typing import List, Optional
from datetime import date

# --- PDF Parsing Schemas (Immutable / Functional Programming) ---

class BloodTestParameter(BaseModel):
    # Functional Programming prensiplerine uymak için model_config = ConfigDict(frozen=True) kullanıldı
    # Değerleri yaratıldıktan sonra değiştirilemez kılar.
    model_config = ConfigDict(frozen=True)

    parameter_name: str = Field(..., description="Biyobelirteç adı, örn. 'Ferritin'")
    value: str = Field(..., description="Elde edilen değer ('< 0.5' gibi durumları işlemek için string)")
    numeric_value: Optional[float] = Field(None, description="Eğer tamamen temiz bir sayıysa ayrıştırılmış sayısal değer")
    unit: str = Field(..., description="Ölçüm birimi, örn. 'mg/dL'")
    reference_range: Optional[str] = Field(None, description="PDF'te göründüğü şekliyle referans aralığı, örn. '10 - 120'")

class BloodTestExtraction(BaseModel):
    model_config = ConfigDict(frozen=True)

    date_taken: date = Field(..., description="Kan testinin yapıldığı tarih")
    parameters: List[BloodTestParameter] = Field(..., description="PDF tablolarından çıkarılan parametrelerin listesi")
