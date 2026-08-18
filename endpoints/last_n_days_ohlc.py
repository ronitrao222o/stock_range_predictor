from fastapi import APIRouter, Query, HTTPException
from pydantic import BaseModel
from typing import List
import traceback

from services import get_last_n_trading_days_ohlc

router = APIRouter()

# Pydantic models
class OHLCItem(BaseModel):
    date: str
    open: float
    high: float
    low: float
    close: float

class OHLCListResponse(BaseModel):
    symbol: str
    ohlc: List[OHLCItem]

@router.get("/last-n-days-ohlc/", response_model=OHLCListResponse, summary="Get Last N Trading Days OHLC Data")
async def last_n_days_ohlc(
    symbol: str = Query(..., description="NSE Stock code, e.g., INFY, RELIANCE"),
    n: int = Query(22, gt=0, le=90, description="Number of trading days to fetch (default: 22, max: 90)")
):
    """
    Fetches the OHLC prices for the last N trading days for the given NSE stock symbol.

    - **symbol**: NSE stock symbol (string)
    - **n**: Number of trading days to fetch (default is 22)
    """
    try:
        data = get_last_n_trading_days_ohlc(symbol, n=n)
        if not data:
            raise HTTPException(status_code=404, detail=f"No data found for symbol '{symbol.upper()}'")
        return data
    except Exception as e:
        print(f"Error fetching last {n} days data for {symbol}: {e}")
        traceback.print_exc()
        raise HTTPException(status_code=500, detail="Internal server error. Please check the symbol and try again.")
