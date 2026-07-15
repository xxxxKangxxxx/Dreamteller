import logging

from fastapi import FastAPI, Request
from fastapi.exceptions import RequestValidationError
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from starlette.exceptions import HTTPException as StarletteHTTPException

from app.routes import account, dreams, interpret, stats
from app.utils.envelope import error
from app.utils.usage import QuotaExceededError

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s %(levelname)s %(name)s: %(message)s",
)

logger = logging.getLogger("app")

app = FastAPI(title="DreamTeller API", version="0.1.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.exception_handler(StarletteHTTPException)
async def http_exception_handler(_request: Request, exc: StarletteHTTPException) -> JSONResponse:
    detail = exc.detail if isinstance(exc.detail, str) else "HTTP_ERROR"
    return JSONResponse(status_code=exc.status_code, content=error(detail, detail))


@app.exception_handler(RequestValidationError)
async def validation_exception_handler(_request: Request, exc: RequestValidationError) -> JSONResponse:
    return JSONResponse(
        status_code=422,
        content=error("VALIDATION_ERROR", str(exc.errors())),
    )


@app.exception_handler(QuotaExceededError)
async def quota_exceeded_handler(_request: Request, exc: QuotaExceededError) -> JSONResponse:
    return JSONResponse(status_code=429, content=error(exc.code, exc.message))


@app.exception_handler(Exception)
async def generic_exception_handler(request: Request, exc: Exception) -> JSONResponse:
    logger.error(
        "Unhandled exception on %s %s", request.method, request.url.path, exc_info=exc
    )
    return JSONResponse(
        status_code=500,
        content=error("INTERNAL_ERROR", "일시적인 오류가 발생했어요. 잠시 후 다시 시도해 주세요."),
    )


@app.get("/health")
def health() -> dict[str, str]:
    return {"status": "ok"}


app.include_router(dreams.router, prefix="/api/dreams", tags=["dreams"])
app.include_router(stats.router, prefix="/api/stats", tags=["stats"])
app.include_router(interpret.router, prefix="/api/interpret", tags=["interpret"])
app.include_router(account.router, prefix="/api/account", tags=["account"])
