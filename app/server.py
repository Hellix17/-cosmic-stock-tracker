from flask import Flask, render_template, jsonify, request
from flask_cors import CORS
from utils.stock_utils import get_stock_info, get_stock_history, search_stocks
from datetime import datetime, timedelta
import os
import logging

# Configurare logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

app = Flask(__name__, 
    static_folder='static',  # Specificăm folderul pentru fișiere statice
    template_folder='templates'  # Specificăm folderul pentru template-uri
)
CORS(app)

# Configurare pentru development
app.config['SEND_FILE_MAX_AGE_DEFAULT'] = 0
app.config['TEMPLATES_AUTO_RELOAD'] = True

@app.route('/')
def index():
    logger.info("Accesare pagină principală")
    return render_template('index.html')

@app.route('/api/stock/<symbol>', methods=['GET'])
def get_stock_data(symbol):
    """
    Endpoint pentru obținerea informațiilor despre o acțiune.
    """
    logger.info(f"Cerere pentru informații despre acțiunea: {symbol}")
    try:
        stock_data = get_stock_info(symbol)
        
        if not stock_data:
            logger.warning(f"Nu s-au găsit date pentru simbolul: {symbol}")
            return jsonify({'error': 'Nu s-au găsit date pentru acest simbol'}), 404
            
        logger.info(f"Date găsite pentru simbolul: {symbol}")
        return jsonify(stock_data)
    except Exception as e:
        logger.error(f"Eroare la obținerea datelor pentru {symbol}: {str(e)}")
        return jsonify({'error': 'Eroare internă la procesarea cererii'}), 500

@app.route('/api/stock/history/<symbol>', methods=['GET'])
def get_stock_history_data(symbol):
    """
    Endpoint pentru obținerea istoricului unei acțiuni.
    """
    logger.info(f"Cerere pentru istoricul acțiunii: {symbol}")
    try:
        period = request.args.get('period', '1mo')
        interval = request.args.get('interval', '1d')
        
        logger.info(f"Parametri: period={period}, interval={interval}")
        
        history_data = get_stock_history(symbol, period, interval)
        
        if not history_data:
            logger.warning(f"Nu s-au găsit date istorice pentru simbolul: {symbol}")
            return jsonify({'error': 'Nu s-au găsit date istorice pentru acest simbol'}), 404
            
        logger.info(f"Date istorice găsite pentru simbolul: {symbol}")
        return jsonify(history_data)
    except Exception as e:
        logger.error(f"Eroare la obținerea istoricului pentru {symbol}: {str(e)}")
        return jsonify({'error': 'Eroare internă la procesarea cererii'}), 500

@app.route('/api/search', methods=['GET'])
def search_stocks_endpoint():
    """
    Endpoint pentru căutarea acțiunilor.
    """
    query = request.args.get('q', '')
    logger.info(f"Cerere de căutare pentru: {query}")
    
    try:
        if not query:
            logger.warning("Cerere de căutare fără parametru")
            return jsonify({'error': 'Parametrul de căutare este obligatoriu'}), 400
            
        results = search_stocks(query)
        logger.info(f"Rezultate găsite pentru căutarea: {query}")
        return jsonify({'quotes': results})
    except Exception as e:
        logger.error(f"Eroare la căutarea acțiunilor: {str(e)}")
        return jsonify({'error': 'Eroare internă la procesarea cererii'}), 500

@app.route('/api/health', methods=['GET'])
def health_check():
    """
    Endpoint pentru verificarea stării serverului.
    """
    logger.info("Verificare stare server")
    return jsonify({
        'status': 'healthy',
        'timestamp': datetime.now().isoformat()
    })

@app.errorhandler(404)
def not_found_error(error):
    logger.warning(f"Pagină negăsită: {request.url}")
    return jsonify({'error': 'Pagina nu a fost găsită'}), 404

@app.errorhandler(500)
def internal_error(error):
    logger.error(f"Eroare internă: {str(error)}")
    return jsonify({'error': 'Eroare internă la server'}), 500

if __name__ == '__main__':
    logger.info("Pornire server Flask")
    app.run(debug=True, port=5000) 