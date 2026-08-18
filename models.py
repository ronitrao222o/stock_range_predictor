from pydantic import BaseModel
from typing import List

class OHLCResponse(BaseModel):
    symbol: str
    date: str
    open: float
    high: float
    low: float
    close: float

class OHLCItem(BaseModel):
    date: str
    open: float
    high: float
    low: float
    close: float

class OHLCListResponse(BaseModel):
    symbol: str
    ohlc: List[OHLCItem]
