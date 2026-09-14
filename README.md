# Stock Range Predictor

A FastAPI-based API for analyzing NSE stock data and estimating price ranges using historical volatility and standard deviation.

## Features

- Firebase login with user credits and stock symbol autocomplete
- Fetch previous trading day OHLC data
- Fetch OHLC data for the last N trading days
- Calculate historical daily log returns
- Calculate average return and standard deviation
- Generate 1, 2, and 3 standard deviation price ranges

## Tech Stack

- Python
- FastAPI
- Pandas
- NumPy
- Pydantic
- Jugaad Data

## API Endpoints

- Previous Day OHLC
- Last N Trading Days OHLC
- Standard Deviation Price Range

## Run Locally

Clone the repository:

`git clone https://github.com/ronitrao222o/stock_range_predictor.git`

Install dependencies:

`pip install -r requirements.txt`

Start the application:

`uvicorn main:app --reload`

Open the login app at [http://127.0.0.1:8000/](http://127.0.0.1:8000/).
The home page redirects to `/auth-web/`, the only web interface. Old `/web/`
links also redirect to the login app.

Sign in with an existing Firebase email/password account. Stock lookups in the
interface require a Firestore `users/{uid}` document with available `credits`.
The frontend calls the API on the same host and port.

Open the API docs at:

`http://127.0.0.1:8000/docs`

## Disclaimer

This project is for educational and analytical purposes only and should not be considered financial advice.
