# Cosmic Stock Tracker 🚀

Un tracker modern pentru acțiuni cu o interfață spațială unică, dezvoltat cu Flask și Supabase.

## Caracteristici ✨

- Design cosmic cu efecte de particule și stele
- Căutare în timp real a acțiunilor
- Vizualizare grafică a evoluției prețurilor
- Informații detaliate despre companii
- Integrare cu Finnhub pentru date în timp real
- Stocare date în Supabase

## Tehnologii Utilizate 🛠

- Frontend:
  - HTML5
  - CSS3 (cu efecte moderne)
  - JavaScript
  - TailwindCSS
  - Chart.js
- Backend:
  - Python
  - Flask
  - Supabase
  - Finnhub API

## Instalare 🔧

1. Clonează repository-ul:

```bash
git clone https://github.com/yourusername/cosmic-stock-tracker.git
cd cosmic-stock-tracker
```

2. Instalează dependențele:

```bash
pip install -r requirements.txt
```

3. Creează un fișier `.env` în directorul rădăcină și adaugă:

```env
FINNHUB_API_KEY=your_finnhub_api_key
SUPABASE_URL=your_supabase_url
SUPABASE_KEY=your_supabase_key
```

4. Pornește serverul:

```bash
python app/server.py
```

5. Accesează aplicația la `http://127.0.0.1:5000`

## Structura Proiectului 📁

```
cosmic-stock-tracker/
├── app/
│   ├── static/
│   │   ├── css/
│   │   │   └── styles.css
│   │   └── js/
│   │       └── main.js
│   ├── templates/
│   │   └── index.html
│   ├── utils/
│   │   ├── __init__.py
│   │   ├── stock_utils.py
│   │   └── supabase_client.py
│   └── server.py
├── requirements.txt
└── README.md
```

## Configurare Supabase 📊

1. Creează un proiect nou în Supabase
2. Creează următoarele tabele:

### Tabelul `stocks`:

- `symbol` (text, primary key)
- `price` (jsonb)
- `summaryDetail` (jsonb)
- `assetProfile` (jsonb)

### Tabelul `stock_history`:

- `symbol` (text, primary key)
- `chart` (jsonb)

## Contribuție 🤝

Contribuțiile sunt binevenite! Te rugăm să deschizi un issue înainte de a trimite un pull request.

## Licență 📝

Acest proiect este licențiat sub [MIT License](LICENSE).
