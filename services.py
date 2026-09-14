import csv
import io
import re
from datetime import date, datetime, timedelta
from functools import lru_cache

from fastapi import HTTPException
from jugaad_data.nse.archives import full_bhavcopy_raw

VALID_SYMBOL_PATTERN = re.compile(r"^[A-Z0-9&-]+$")


def validate_stock_symbol(symbol: str) -> str:
    normalized_symbol = symbol.strip().upper()
    if not normalized_symbol:
        raise HTTPException(status_code=400, detail="Stock symbol cannot be empty.")

    if not VALID_SYMBOL_PATTERN.fullmatch(normalized_symbol):
        raise HTTPException(
            status_code=400,
            detail="Invalid stock symbol format. Use letters, numbers, '&', or '-'."
        )

    return normalized_symbol


@lru_cache(maxsize=128)
def fetch_bhavcopy_rows(for_date: date):
    try:
        raw_text = full_bhavcopy_raw(for_date)
    except Exception:
        return []

    if not raw_text or not raw_text.startswith("SYMBOL"):
        return []

    return list(csv.DictReader(io.StringIO(raw_text), skipinitialspace=True))


def get_stock_row_for_date(symbol: str, for_date: date):
    rows = fetch_bhavcopy_rows(for_date)
    for row in rows:
        if row.get("SYMBOL", "").upper() == symbol and row.get("SERIES", "").upper() == "EQ":
            return row
    return None


def parse_archive_stock_row(symbol: str, row: dict):
    trade_date = datetime.strptime(row["DATE1"], "%d-%b-%Y").date()
    return {
        "symbol": symbol,
        "date": trade_date.strftime("%Y-%m-%d IST"),
        "open": float(row["OPEN_PRICE"]),
        "high": float(row["HIGH_PRICE"]),
        "low": float(row["LOW_PRICE"]),
        "close": float(row["CLOSE_PRICE"]),
    }


def get_recent_stock_rows(symbol: str, trading_days: int, buffer_days: int = 10):
    normalized_symbol = validate_stock_symbol(symbol)
    collected_rows = []
    current_date = date.today() - timedelta(days=1)
    max_days_to_check = max(trading_days + buffer_days, trading_days * 3)

    for _ in range(max_days_to_check):
        stock_row = get_stock_row_for_date(normalized_symbol, current_date)
        if stock_row:
            collected_rows.append(parse_archive_stock_row(normalized_symbol, stock_row))
            if len(collected_rows) >= trading_days:
                break
        current_date -= timedelta(days=1)

    return normalized_symbol, collected_rows


def get_previous_trading_day_ohlc(symbol: str):
    _, recent_rows = get_recent_stock_rows(symbol, trading_days=1)
    if not recent_rows:
        return None

    return recent_rows[0]


def get_last_n_trading_days_ohlc(symbol: str, n: int = 22):
    normalized_symbol, recent_rows = get_recent_stock_rows(symbol, trading_days=n, buffer_days=10)
    if len(recent_rows) < n:
        return None

    return {
        "symbol": normalized_symbol,
        "ohlc": recent_rows
    }
