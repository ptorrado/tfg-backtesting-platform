# app/seed_assets.py

from app.db import SessionLocal
from app.models import Asset

ASSETS_TO_CREATE = [
    # ==== Acciones grandes (US / global) ====
    {"symbol": "AAPL",    "name": "Apple Inc.",                               "asset_type": "stock"},
    {"symbol": "MSFT",    "name": "Microsoft Corp.",                          "asset_type": "stock"},
    {"symbol": "GOOGL",   "name": "Alphabet Inc. Class A",                    "asset_type": "stock"},
    {"symbol": "AMZN",    "name": "Amazon.com Inc.",                          "asset_type": "stock"},
    {"symbol": "META",    "name": "Meta Platforms Inc.",                      "asset_type": "stock"},
    {"symbol": "TSLA",    "name": "Tesla Inc.",                               "asset_type": "stock"},
    {"symbol": "NVDA",    "name": "NVIDIA Corp.",                             "asset_type": "stock"},
    {"symbol": "AMD",     "name": "Advanced Micro Devices Inc.",              "asset_type": "stock"},
    {"symbol": "INTC",    "name": "Intel Corp.",                              "asset_type": "stock"},
    {"symbol": "NFLX",    "name": "Netflix Inc.",                             "asset_type": "stock"},
    {"symbol": "DIS",     "name": "Walt Disney Co.",                          "asset_type": "stock"},
    {"symbol": "TSM",     "name": "Taiwan Semiconductor Manufacturing Co.",   "asset_type": "stock"},
    {"symbol": "ASML",    "name": "ASML Holding NV",                          "asset_type": "stock"},
    {"symbol": "SAP",     "name": "SAP SE",                                   "asset_type": "stock"},
    {"symbol": "ORCL",    "name": "Oracle Corp.",                             "asset_type": "stock"},
    {"symbol": "IBM",     "name": "International Business Machines Corp.",    "asset_type": "stock"},
    {"symbol": "BABA",    "name": "Alibaba Group Holding Ltd.",               "asset_type": "stock"},
    {"symbol": "JPM",     "name": "JPMorgan Chase & Co.",                     "asset_type": "stock"},
    {"symbol": "BAC",     "name": "Bank of America Corp.",                    "asset_type": "stock"},
    {"symbol": "WFC",     "name": "Wells Fargo & Co.",                        "asset_type": "stock"},
    {"symbol": "V",       "name": "Visa Inc.",                                "asset_type": "stock"},
    {"symbol": "MA",      "name": "Mastercard Inc.",                          "asset_type": "stock"},
    {"symbol": "WMT",     "name": "Walmart Inc.",                             "asset_type": "stock"},
    {"symbol": "COST",    "name": "Costco Wholesale Corp.",                   "asset_type": "stock"},
    {"symbol": "NKE",     "name": "Nike Inc.",                                "asset_type": "stock"},
    {"symbol": "MCD",     "name": "McDonald's Corp.",                         "asset_type": "stock"},
    {"symbol": "KO",      "name": "Coca-Cola Co.",                            "asset_type": "stock"},
    {"symbol": "PEP",     "name": "PepsiCo Inc.",                             "asset_type": "stock"},
    {"symbol": "PG",      "name": "Procter & Gamble Co.",                     "asset_type": "stock"},
    {"symbol": "JNJ",     "name": "Johnson & Johnson",                        "asset_type": "stock"},

    # ==== ETFs (sin GLD/SLV, que pasan a commodity) ====
    {"symbol": "SPY",     "name": "SPDR S&P 500 ETF Trust",                   "asset_type": "etf"},
    {"symbol": "QQQ",     "name": "Invesco QQQ Trust",                        "asset_type": "etf"},
    {"symbol": "DIA",     "name": "SPDR Dow Jones Industrial Average ETF",    "asset_type": "etf"},
    {"symbol": "IWM",     "name": "iShares Russell 2000 ETF",                 "asset_type": "etf"},
    {"symbol": "EEM",     "name": "iShares MSCI Emerging Markets ETF",        "asset_type": "etf"},
    {"symbol": "EFA",     "name": "iShares MSCI EAFE ETF",                    "asset_type": "etf"},
    {"symbol": "TLT",     "name": "iShares 20+ Year Treasury Bond ETF",       "asset_type": "etf"},
    {"symbol": "HYG",     "name": "iShares iBoxx High Yield Corp Bond ETF",   "asset_type": "etf"},
    {"symbol": "XLK",     "name": "Technology Select Sector SPDR Fund",       "asset_type": "etf"},
    {"symbol": "XLF",     "name": "Financial Select Sector SPDR Fund",        "asset_type": "etf"},
    {"symbol": "XLE",     "name": "Energy Select Sector SPDR Fund",           "asset_type": "etf"},
    {"symbol": "XLV",     "name": "Health Care Select Sector SPDR Fund",      "asset_type": "etf"},

    # ==== Criptomonedas (pares USD) ====
    {"symbol": "BTC-USD", "name": "Bitcoin / US Dollar",                      "asset_type": "crypto"},
    {"symbol": "ETH-USD", "name": "Ethereum / US Dollar",                     "asset_type": "crypto"},
    {"symbol": "SOL-USD", "name": "Solana / US Dollar",                       "asset_type": "crypto"},
    {"symbol": "XRP-USD", "name": "XRP / US Dollar",                          "asset_type": "crypto"},
    {"symbol": "ADA-USD", "name": "Cardano / US Dollar",                      "asset_type": "crypto"},
    {"symbol": "DOGE-USD","name": "Dogecoin / US Dollar",                     "asset_type": "crypto"},
    {"symbol": "LTC-USD", "name": "Litecoin / US Dollar",                     "asset_type": "crypto"},
    {"symbol": "AVAX-USD","name": "Avalanche / US Dollar",                    "asset_type": "crypto"},
    {"symbol": "LINK-USD","name": "Chainlink / US Dollar",                    "asset_type": "crypto"},
    {"symbol": "DOT-USD", "name": "Polkadot / US Dollar",                     "asset_type": "crypto"},

    # ==== Índices (vía Yahoo, con ^) ====
    {"symbol": "^GSPC",   "name": "S&P 500 Index",                             "asset_type": "index"},
    {"symbol": "^NDX",    "name": "Nasdaq-100 Index",                          "asset_type": "index"},
    {"symbol": "^DJI",    "name": "Dow Jones Industrial Average",             "asset_type": "index"},
    {"symbol": "^IXIC",   "name": "Nasdaq Composite Index",                   "asset_type": "index"},
    {"symbol": "^RUT",    "name": "Russell 2000 Index",                       "asset_type": "index"},
    {"symbol": "^STOXX50E","name": "EURO STOXX 50 Index",                     "asset_type": "index"},

    # ==== Forex (pares mayores) ====
    {"symbol": "EURUSD=X","name": "Euro / US Dollar",                         "asset_type": "forex"},
    {"symbol": "GBPUSD=X","name": "British Pound / US Dollar",                "asset_type": "forex"},
    {"symbol": "USDJPY=X","name": "US Dollar / Japanese Yen",                 "asset_type": "forex"},
    {"symbol": "AUDUSD=X","name": "Australian Dollar / US Dollar",            "asset_type": "forex"},
    {"symbol": "USDCAD=X","name": "US Dollar / Canadian Dollar",              "asset_type": "forex"},

    # ==== Commodities (materias primas vía ETFs/ETCs, no futuros) ====
    {"symbol": "GLD",   "name": "Gold",                                   "asset_type": "commodity"},
    {"symbol": "SLV",   "name": "Silver",                                 "asset_type": "commodity"},
    {"symbol": "PPLT",  "name": "Platinum",                               "asset_type": "commodity"},
    {"symbol": "PALL",  "name": "Palladium",                              "asset_type": "commodity"},
    {"symbol": "CPER",  "name": "Copper",                                 "asset_type": "commodity"},

    {"symbol": "USO",   "name": "Crude Oil",                              "asset_type": "commodity"},
    {"symbol": "BNO",   "name": "Brent Oil",                              "asset_type": "commodity"},
    {"symbol": "UNG",   "name": "Natural Gas",                            "asset_type": "commodity"},

    {"symbol": "WEAT",  "name": "Wheat",                                  "asset_type": "commodity"},
    {"symbol": "CORN",  "name": "Corn",                                   "asset_type": "commodity"},
    {"symbol": "SOYB",  "name": "Soybeans",                               "asset_type": "commodity"},

    {"symbol": "JO",    "name": "Coffee",                                 "asset_type": "commodity"},
    {"symbol": "SGG",   "name": "Sugar",                                  "asset_type": "commodity"},
    {"symbol": "BAL",   "name": "Cotton",                                 "asset_type": "commodity"},
]


def main() -> None:
    db = SessionLocal()
    try:
        for data in ASSETS_TO_CREATE:
            symbol = data["symbol"]

            existing = (
                db.query(Asset)
                .filter(Asset.symbol == symbol)
                .first()
            )
            if existing:
                print(f"[SKIP] {symbol} ya existe (id={existing.id})")
                continue

            asset = Asset(
                symbol=symbol,
                name=data["name"],
                asset_type=data["asset_type"],
            )

            db.add(asset)
            db.commit()
            db.refresh(asset)
            print(f"[OK] Creado asset {asset.symbol} (id={asset.id})")
    finally:
        db.close()


if __name__ == "__main__":
    main()
