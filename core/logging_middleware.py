import time
import logging
from fastapi import Request
from starlette.middleware.base import BaseHTTPMiddleware

# Loglama formatını ayarla
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s | %(levelname)s | %(message)s",
    datefmt="%Y-%m-%d %H:%M:%S"
)
logger = logging.getLogger("biobistro")

class LoggingMiddleware(BaseHTTPMiddleware):
    """Her gelen HTTP isteğini ve yanıt süresini loglar."""
    async def dispatch(self, request: Request, call_next):
        start_time = time.perf_counter()
        
        # İsteği işle
        response = await call_next(request)
        
        duration_ms = (time.perf_counter() - start_time) * 1000
        
        logger.info(
            f"{request.method} {request.url.path} "
            f"→ {response.status_code} "
            f"({duration_ms:.1f}ms)"
        )
        
        return response
