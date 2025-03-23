from supabase import create_client
import os
from dotenv import load_dotenv
import logging

# Configurare logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Încarcă variabilele de mediu
load_dotenv()

# Configurare Supabase
SUPABASE_URL = os.getenv('SUPABASE_URL')
SUPABASE_KEY = os.getenv('SUPABASE_KEY')

if not SUPABASE_URL or not SUPABASE_KEY:
    logger.error("Credențialele Supabase lipsesc din .env!")
    raise ValueError("Credențialele Supabase sunt necesare!")

# Inițializează clientul Supabase
try:
    supabase = create_client(SUPABASE_URL, SUPABASE_KEY)
    logger.info("Conexiunea la Supabase a fost stabilită cu succes")
except Exception as e:
    logger.error(f"Eroare la conectarea la Supabase: {str(e)}")
    raise

def initialize_tables():
    """
    Inițializează tabelele în Supabase dacă nu există.
    """
    try:
        # Creează tabelul pentru date despre acțiuni
        supabase.table('stocks').select('*').limit(1).execute()
        logger.info("Tabelul 'stocks' există și este accesibil")
    except Exception as e:
        logger.error(f"Eroare la accesarea tabelului 'stocks': {str(e)}")
        logger.info("Asigură-te că tabelul 'stocks' există în Supabase cu următoarea structură:")
        logger.info("- symbol (text, primary key)")
        logger.info("- price (jsonb)")
        logger.info("- summaryDetail (jsonb)")
        logger.info("- assetProfile (jsonb)")

    try:
        # Creează tabelul pentru istoric
        supabase.table('stock_history').select('*').limit(1).execute()
        logger.info("Tabelul 'stock_history' există și este accesibil")
    except Exception as e:
        logger.error(f"Eroare la accesarea tabelului 'stock_history': {str(e)}")
        logger.info("Asigură-te că tabelul 'stock_history' există în Supabase cu următoarea structură:")
        logger.info("- symbol (text, primary key)")
        logger.info("- chart (jsonb)")

# Inițializează tabelele la pornire
initialize_tables()

def save_stock_data(symbol, data):
    """
    Salvează datele despre o acțiune în Supabase.
    """
    try:
        logger.info(f"Încercăm să salvăm datele pentru simbolul: {symbol}")
        
        # Verifică dacă există deja date pentru acest simbol
        existing_data = supabase.table('stocks').select('*').eq('symbol', symbol).execute()
        
        if existing_data.data:
            # Actualizează datele existente
            logger.info(f"Actualizăm datele existente pentru {symbol}")
            supabase.table('stocks').update(data).eq('symbol', symbol).execute()
        else:
            # Adaugă date noi
            logger.info(f"Adăugăm date noi pentru {symbol}")
            data['symbol'] = symbol
            supabase.table('stocks').insert(data).execute()
            
        return True
    except Exception as e:
        logger.error(f"Eroare la salvarea datelor în Supabase: {str(e)}")
        return False

def get_stock_data(symbol):
    """
    Obține datele despre o acțiune din Supabase.
    """
    try:
        logger.info(f"Încercăm să obținem datele pentru simbolul: {symbol}")
        result = supabase.table('stocks').select('*').eq('symbol', symbol).execute()
        
        if result.data:
            logger.info(f"Date găsite pentru {symbol}")
            return result.data[0]
        else:
            logger.info(f"Nu s-au găsit date pentru {symbol}")
            return None
    except Exception as e:
        logger.error(f"Eroare la obținerea datelor din Supabase: {str(e)}")
        return None

def save_stock_history(symbol, history_data):
    """
    Salvează istoricul de prețuri al unei acțiuni în Supabase.
    """
    try:
        logger.info(f"Încercăm să salvăm istoricul pentru simbolul: {symbol}")
        
        # Verifică dacă există deja istoric pentru acest simbol
        existing_data = supabase.table('stock_history').select('*').eq('symbol', symbol).execute()
        
        if existing_data.data:
            # Actualizează istoricul existent
            logger.info(f"Actualizăm istoricul existent pentru {symbol}")
            supabase.table('stock_history').update(history_data).eq('symbol', symbol).execute()
        else:
            # Adaugă istoric nou
            logger.info(f"Adăugăm istoric nou pentru {symbol}")
            history_data['symbol'] = symbol
            supabase.table('stock_history').insert(history_data).execute()
            
        return True
    except Exception as e:
        logger.error(f"Eroare la salvarea istoricului în Supabase: {str(e)}")
        return False

def get_stock_history(symbol):
    """
    Obține istoricul de prețuri al unei acțiuni din Supabase.
    """
    try:
        logger.info(f"Încercăm să obținem istoricul pentru simbolul: {symbol}")
        result = supabase.table('stock_history').select('*').eq('symbol', symbol).execute()
        
        if result.data:
            logger.info(f"Istoric găsit pentru {symbol}")
            return result.data[0]
        else:
            logger.info(f"Nu s-a găsit istoric pentru {symbol}")
            return None
    except Exception as e:
        logger.error(f"Eroare la obținerea istoricului din Supabase: {str(e)}")
        return None 