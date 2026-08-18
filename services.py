from datetime import date, timedelta
from jugaad_data.nse import stock_df
import pandas as pd

def get_previous_trading_day_ohlc(symbol: str):
    today = date.today()
    start = today - timedelta(days=10)

    df = stock_df(symbol=symbol.upper(), from_date=start, to_date=today, series="EQ")
    if df.empty:
        return None

    df['DATE'] = pd.to_datetime(df['DATE']).dt.date
    df_before_today = df[df['DATE'] < today]
    if df_before_today.empty:
        return None

    prev_date = df_before_today['DATE'].max()
    prev_rows = df_before_today[df_before_today['DATE'] == prev_date]
    if prev_rows.empty:
        return None

    prev = prev_rows.iloc[0]

    return {
        "symbol": symbol.upper(),
        "date": prev_date.strftime('%Y-%m-%d IST'),
        "open": prev['OPEN'],
        "high": prev['HIGH'],
        "low": prev['LOW'],
        "close": prev['CLOSE']
    }

def get_last_n_trading_days_ohlc(symbol: str, n: int = 22):  # <-- Default to 22
    today = date.today()
    start = today - timedelta(days=n + 10)  # <-- buffer for weekends/holidays

    df = stock_df(symbol=symbol.upper(), from_date=start, to_date=today, series="EQ")
    if df.empty:
        return None

    df['DATE'] = pd.to_datetime(df['DATE']).dt.date
    df_before_today = df[df['DATE'] < today]
    if df_before_today.empty:
        return None

    df_sorted = df_before_today.sort_values(by='DATE', ascending=False)
    last_n_days = df_sorted.head(n)

    result = []
    for _, row in last_n_days.iterrows():
        result.append({
            "date": row['DATE'].strftime('%Y-%m-%d IST'),
            "open": row['OPEN'],
            "high": row['HIGH'],
            "low": row['LOW'],
            "close": row['CLOSE']
        })

    return {
        "symbol": symbol.upper(),
        "ohlc": result
    }
