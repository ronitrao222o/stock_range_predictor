from pathlib import Path

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import RedirectResponse
from fastapi.staticfiles import StaticFiles
import os

DIGITALOCEAN_TOKEN = os.getenv("DIGITALOCEAN_TOKEN")

from endpoints import previous_day_ohlc, last_n_days_ohlc, standard_deviation

app = FastAPI(
    title="NSE OHLC API",
    description="API to get NSE OHLC data including previous day and last N trading days",
    version="1.2.0"
)

auth_frontend_dir = Path(__file__).parent / "Stock Data" / "Auth Code"

@app.get("/health")
async def health():
    return {"status": "ok"}


@app.get("/")
async def root():
    return RedirectResponse(url="/auth-web/")


@app.get("/auth")
@app.get("/web", include_in_schema=False)
@app.get("/web/", include_in_schema=False)
async def auth_root():
    return RedirectResponse(url="/auth-web/")

# ✅ Add this middleware to enable CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # frontend origin
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Your routers
app.include_router(previous_day_ohlc.router)
app.include_router(last_n_days_ohlc.router)
app.include_router(standard_deviation.router)

app.mount("/auth-web", StaticFiles(directory=auth_frontend_dir, html=True), name="auth-web")
