import requests
import pandas as pd
from datetime import datetime, timedelta
import logging
import json
import os
import time
from pathlib import Path
from dotenv import load_dotenv
from .supabase_client import save_stock_data, get_stock_data, save_stock_history, get_stock_history

# Încarcă variabilele de mediu
load_dotenv()

# Configurare logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Configurare Finnhub
FINNHUB_API_KEY = os.getenv('FINNHUB_API_KEY')
FINNHUB_BASE_URL = 'https://finnhub.io/api/v1'

if not FINNHUB_API_KEY:
    logger.error("Cheia API Finnhub nu a fost găsită în variabilele de mediu!")
    raise ValueError("Cheia API Finnhub este necesară pentru funcționarea aplicației!")

# Configurare cache
API_DELAY = 1  # 1 secundă între cereri pentru a respecta limita de rate

def make_api_request(url, params):
    """
    Face o cerere către API cu delay și gestionare de erori.
    """
    try:
        params['token'] = FINNHUB_API_KEY
        logger.info(f"Facem cerere către {url} cu parametrii: {params}")
        response = requests.get(url, params=params)
        
        if response.status_code == 401:
            logger.error("Cheia API este invalidă sau a expirat!")
            return None
            
        if response.status_code == 429:
            logger.error("Limita de rate a fost depășită!")
            return None
            
        response.raise_for_status()
        data = response.json()
        logger.info(f"Răspuns primit de la API: {data}")
        return data
    except requests.exceptions.RequestException as e:
        logger.error(f"Eroare la cererea către API: {str(e)}")
        if hasattr(e.response, 'text'):
            logger.error(f"Răspunsul API-ului: {e.response.text}")
        return None
    finally:
        time.sleep(API_DELAY)  # Așteaptă între cereri

def get_stock_info(symbol):
    """
    Obține informații despre o acțiune folosind Finnhub.
    """
    try:
        logger.info(f"Încercăm să obținem informații pentru simbolul: {symbol}")
        
        # Încearcă să obțină din Supabase
        cached_data = get_stock_data(symbol)
        if cached_data:
            logger.info(f"Am găsit date în Supabase pentru {symbol}")
            return cached_data
            
        # Obține date de la Finnhub
        quote_data = make_api_request(f"{FINNHUB_BASE_URL}/quote", {'symbol': symbol})
        if not quote_data:
            return None
        
        # Obține informații despre companie
        company_data = make_api_request(f"{FINNHUB_BASE_URL}/stock/profile2", {'symbol': symbol})
        if not company_data:
            return None
        
        result = {
            'price': {
                'regularMarketPrice': float(quote_data.get('c', 0)),  # Current price
                'regularMarketChange': float(quote_data.get('d', 0)),  # Change
                'regularMarketChangePercent': float(quote_data.get('dp', 0)),  # Change percent
                'regularMarketVolume': int(quote_data.get('v', 0)),  # Volume
                'marketCap': float(company_data.get('marketCapitalization', 0)),
                'longName': company_data.get('name', ''),
                'shortName': symbol
            },
            'summaryDetail': {
                'forwardPE': float(company_data.get('metric', {}).get('forwardPE', 0)),
                'dividendYield': float(company_data.get('metric', {}).get('dividendYield', 0)),
                'fiftyTwoWeekHigh': float(quote_data.get('h', 0)),  # High
                'fiftyTwoWeekLow': float(quote_data.get('l', 0))  # Low
            },
            'assetProfile': {
                'sector': company_data.get('finnhubIndustry', ''),
                'industry': company_data.get('industry', ''),
                'country': company_data.get('country', ''),
                'description': company_data.get('description', '')
            }
        }
        
        # Salvează în Supabase
        save_stock_data(symbol, result)
        
        return result
    except Exception as e:
        logger.error(f"Eroare la obținerea informațiilor pentru {symbol}: {str(e)}")
        return None

def get_stock_history(symbol, period='1mo', interval='1d'):
    """
    Obține date istorice pentru o acțiune folosind Finnhub.
    """
    try:
        logger.info(f"Încercăm să obținem istoricul pentru simbolul: {symbol}")
        
        # Încearcă să obțină din Supabase
        cached_data = get_stock_history(symbol)
        if cached_data:
            logger.info(f"Am găsit istoric în Supabase pentru {symbol}")
            return cached_data
        
        # Calculează perioada
        end_date = int(time.time())
        if period == '1mo':
            start_date = end_date - (30 * 24 * 60 * 60)  # 30 zile
        elif period == '1wk':
            start_date = end_date - (7 * 24 * 60 * 60)  # 7 zile
        else:
            start_date = end_date - (24 * 60 * 60)  # 1 zi
        
        params = {
            'symbol': symbol,
            'from': start_date,
            'to': end_date,
            'resolution': 'D' if interval == '1d' else 'W'
        }
        
        data = make_api_request(f"{FINNHUB_BASE_URL}/stock/candle", params)
        if not data:
            logger.error(f"Nu s-au primit date de la API pentru {symbol}")
            return None
            
        if data.get('s') != 'ok':
            logger.error(f"API a returnat eroare pentru {symbol}: {data}")
            return None
            
        if not data.get('c') or not data.get('t'):
            logger.error(f"Date incomplete pentru {symbol}: {data}")
            return None
        
        result = {
            'chart': {
                'result': [{
                    'timestamp': data['t'],
                    'indicators': {
                        'quote': [{
                            'close': data['c'],
                            'volume': data['v']
                        }]
                    }
                }]
            }
        }
        
        # Salvează în Supabase
        save_stock_history(symbol, result)
        
        return result
    except Exception as e:
        logger.error(f"Eroare la obținerea istoricului pentru {symbol}: {str(e)}")
        return None

def search_stocks(query):
    """
    Caută acțiuni după nume sau simbol folosind Finnhub.
    """
    try:
        logger.info(f"Încercăm să căutăm: {query}")
        
        data = make_api_request(f"{FINNHUB_BASE_URL}/search", {'q': query})
        if not data or 'result' not in data:
            logger.warning(f"Nu s-au găsit rezultate pentru: {query}")
            return []
            
        result = [{
            'symbol': item['symbol'],
            'name': item['description'],
            'type': item['type'],
            'region': item.get('country', ''),
            'currency': item.get('currency', 'USD'),
            'matchScore': 1.0  # Finnhub nu oferă scor de potrivire
        } for item in data['result']]
        
        return result
    except Exception as e:
        logger.error(f"Eroare la căutarea acțiunilor: {str(e)}")
        return [] 