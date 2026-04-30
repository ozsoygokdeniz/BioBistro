import json
from services.ai_insight import refresh_single_meal
from pydantic import BaseModel

class MockResult:
    def __init__(self, n, v, u, r):
        self.parameter_name = n
        self.original_value = v
        self.unit = u
        self.reference_range = r

results = [MockResult('Ferritin', '200', 'ug/L', '10-150')]
try:
    res = refresh_single_meal('2025-09-02', results, 'Sabah', 'Yumurta', ['dairy'])
    print(res)
except Exception as e:
    import traceback
    traceback.print_exc()
