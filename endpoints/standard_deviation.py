from fastapi import APIRouter, Query, HTTPException
from pydantic import BaseModel
from services import get_last_n_trading_days_ohlc
import numpy as np
import math
import traceback

router = APIRouter()

class StdDevRangeResponse(BaseModel):
    symbol: str
    average_return_percent: float
    std_dev_percent: float
    one_sd_high_percent: float
    one_sd_low_percent: float
    two_sd_high_percent: float
    two_sd_low_percent: float
    three_sd_high_percent: float
    three_sd_low_percent: float
    one_sdh: float
    one_sdl: float
    two_sdh: float
    two_sdl: float
    three_sdh: float
    three_sdl: float

def round_to_nearest_0_05(value: float) -> float:
    return round(value * 20) / 20

@router.get("/std-deviation/", response_model=StdDevRangeResponse, summary="Get 1/2/3 SD Projected Price Ranges")
async def std_deviation(
    symbol: str = Query(..., description="NSE stock symbol, e.g., INFY, RELIANCE")
):
    try:
        ohlc_data = get_last_n_trading_days_ohlc(symbol, n=22)
        if not ohlc_data or "ohlc" not in ohlc_data or len(ohlc_data["ohlc"]) < 22:
            raise HTTPException(status_code=404, detail="Not enough data to compute standard deviation.")

        closes = [item["close"] for item in ohlc_data["ohlc"]]

        # Daily log returns
        daily_returns = [math.log(closes[i] / closes[i + 1]) for i in range(len(closes) - 1)]

        avg_return = np.mean(daily_returns)
        std_dev = np.std(daily_returns)

        # Convert to %
        avg_pct = round(avg_return * 100, 4)
        std_pct = round(std_dev * 100, 4)

        # % ranges
        one_sd_high_pct = round((avg_return + std_dev) * 100, 4)
        one_sd_low_pct = round((avg_return - std_dev) * 100, 4)
        two_sd_high_pct = round((avg_return + 2 * std_dev) * 100, 4)
        two_sd_low_pct = round((avg_return - 2 * std_dev) * 100, 4)
        three_sd_high_pct = round((avg_return + 3 * std_dev) * 100, 4)
        three_sd_low_pct = round((avg_return - 3 * std_dev) * 100, 4)

        # Previous day close
        prev_close = closes[0]

        # Projected price ranges with rounding to ₹0.05
        one_sdh = round_to_nearest_0_05(prev_close * math.exp(avg_return + std_dev))
        one_sdl = round_to_nearest_0_05(prev_close * math.exp(avg_return - std_dev))
        two_sdh = round_to_nearest_0_05(prev_close * math.exp(avg_return + 2 * std_dev))
        two_sdl = round_to_nearest_0_05(prev_close * math.exp(avg_return - 2 * std_dev))
        three_sdh = round_to_nearest_0_05(prev_close * math.exp(avg_return + 3 * std_dev))
        three_sdl = round_to_nearest_0_05(prev_close * math.exp(avg_return - 3 * std_dev))

        return {
            "symbol": symbol.upper(),
            "average_return_percent": avg_pct,
            "std_dev_percent": std_pct,
            "one_sd_high_percent": one_sd_high_pct,
            "one_sd_low_percent": one_sd_low_pct,
            "two_sd_high_percent": two_sd_high_pct,
            "two_sd_low_percent": two_sd_low_pct,
            "three_sd_high_percent": three_sd_high_pct,
            "three_sd_low_percent": three_sd_low_pct,
            "one_sdh": one_sdh,
            "one_sdl": one_sdl,
            "two_sdh": two_sdh,
            "two_sdl": two_sdl,
            "three_sdh": three_sdh,
            "three_sdl": three_sdl
        }

    except Exception as e:
        print(f"Error in std_deviation endpoint: {e}")
        traceback.print_exc()
        raise HTTPException(status_code=500, detail="Failed to compute standard deviation.")
