from fastapi import APIRouter, HTTPException, Query
import traceback
from models import OHLCResponse
from services import get_previous_trading_day_ohlc

router = APIRouter()

@router.get("/previous-day-ohlc/", response_model=OHLCResponse, summary="Get Previous Day OHLC Data")
async def previous_day_ohlc(symbol: str = Query(..., description="NSE Stock code, e.g., INFY, RELIANCE")):
    try:
        data = get_previous_trading_day_ohlc(symbol)
        if not data:
            raise HTTPException(status_code=404, detail=f"Data not found for symbol '{symbol.upper()}'")
        return data
    except HTTPException:
        raise
    except Exception as e:
        print(f"Error fetching data for {symbol}: {e}")
        traceback.print_exc()
        raise HTTPException(status_code=500, detail="Internal server error. Please check the symbol and try again.")
