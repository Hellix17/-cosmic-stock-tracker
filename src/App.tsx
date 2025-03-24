import { useState } from 'react'
import { Line } from 'react-chartjs-2'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  ChartData
} from 'chart.js'

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
)

interface StockData {
  labels: string[]
  prices: number[]
  companyName: string
  dividendPerShare: number
  nextDividendDate: string
  dividendFrequency: string
}

interface PortfolioItem {
  symbol: string
  shares: number
  price: number
  dividendPerShare: number
  nextDividendDate: string
  dividendFrequency: string
}

interface MarketStackEOD {
  close: number
  date: string
}

interface MarketStackCompany {
  name: string
}

const formatDate = (dateStr: string) => {
  const date = new Date(dateStr)
  return date.toLocaleDateString('ro-RO', { day: '2-digit', month: 'short' })
}

function App() {
  const [symbol, setSymbol] = useState('')
  const [stockData, setStockData] = useState<StockData | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [portfolio, setPortfolio] = useState<PortfolioItem[]>([])
  const [shares, setShares] = useState<number>(1)

  const searchStock = async () => {
    if (!symbol) return
    setError(null)
    setLoading(true)
    setStockData(null)

    const API_KEY = import.meta.env.VITE_MARKETSTACK_API_KEY
    const BASE_URL = 'https://api.marketstack.com/v1'
    
    try {
      console.log('Începem căutarea pentru simbolul:', symbol)
      console.log('Folosim cheia API:', API_KEY ? 'DA' : 'NU')

      if (!API_KEY) {
        throw new Error('Cheia API MarketStack nu este configurată corect')
      }

      // Obținem datele companiei
      console.log('Încercăm să obținem datele companiei...')
      const companyResponse = await fetch(`${BASE_URL}/tickers/${symbol}?access_key=${API_KEY}`)
      if (!companyResponse.ok) {
        throw new Error(`Eroare la obținerea datelor companiei: ${companyResponse.statusText}`)
      }
      const companyData: MarketStackCompany = await companyResponse.json()

      // Obținem istoricul prețurilor
      const endDate = new Date().toISOString().split('T')[0]
      const startDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
      
      console.log('Încercăm să obținem datele despre prețuri...')
      const eodResponse = await fetch(
        `${BASE_URL}/eod?access_key=${API_KEY}&symbols=${symbol}&date_from=${startDate}&date_to=${endDate}&limit=30`
      )
      if (!eodResponse.ok) {
        throw new Error(`Eroare la obținerea datelor EOD: ${eodResponse.statusText}`)
      }
      const eodData = await eodResponse.json()
      const stockPrices: MarketStackEOD[] = eodData.data || []

      if (!stockPrices.length) {
        throw new Error('Nu există date disponibile pentru acest simbol')
      }

      // Simulăm date despre dividende (MarketStack nu oferă date despre dividende în planul gratuit)
      const mockDividend = {
        amount: (stockPrices[0]?.close || 0) * 0.02, // 2% dividend yield
        nextDate: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        frequency: 'Trimestrial'
      }

      console.log('Construim obiectul stockData...')
      const stockData: StockData = {
        labels: stockPrices.map(day => formatDate(day.date)).reverse(),
        prices: stockPrices.map(day => day.close).reverse(),
        companyName: companyData.name,
        dividendPerShare: mockDividend.amount,
        nextDividendDate: mockDividend.nextDate,
        dividendFrequency: mockDividend.frequency
      }

      console.log('StockData final:', stockData)
      setStockData(stockData)
    } catch (error) {
      console.error('Eroare completă:', error)
      let errorMessage = 'A apărut o eroare la încărcarea datelor'
      
      if (error instanceof Error) {
        if (error.message.includes('Failed to fetch')) {
          errorMessage = 'Eroare de conexiune. Verificați conexiunea la internet și încercați din nou.'
        } else if (error.message.includes('NetworkError')) {
          errorMessage = 'Eroare de rețea. Verificați dacă aveți acces la internet.'
        } else if (error.message.includes('402')) {
          errorMessage = 'Limită API depășită. Încercați mai târziu.'
        } else {
          errorMessage = error.message
        }
      }
      
      setError(errorMessage)
      setStockData(null)
    } finally {
      setLoading(false)
    }
  }

  const addToPortfolio = () => {
    if (!stockData) {
      setError('Nu există date despre acțiuni pentru a adăuga la portofoliu')
      return
    }

    // Verificăm dacă acțiunea există deja în portofoliu
    const existingStock = portfolio.find(item => item.symbol === symbol.toUpperCase())
    if (existingStock) {
      // Actualizăm numărul de acțiuni dacă simbolul există deja
      setPortfolio(prev =>
        prev.map(item =>
          item.symbol === symbol.toUpperCase()
            ? { ...item, shares: item.shares + shares }
            : item
        )
      )
    } else {
      // Adăugăm o nouă intrare în portofoliu
      const newItem: PortfolioItem = {
        symbol: symbol.toUpperCase(),
        shares: shares,
        price: stockData.prices[stockData.prices.length - 1],
        dividendPerShare: stockData.dividendPerShare,
        nextDividendDate: stockData.nextDividendDate,
        dividendFrequency: stockData.dividendFrequency
      }
      setPortfolio(prev => [...prev, newItem])
    }

    // Resetăm numărul de acțiuni și afișăm un mesaj de succes
    setShares(1)
    setError(null)
    // Afișăm un mesaj de confirmare temporar
    const successMessage = existingStock 
      ? `Am actualizat ${shares} acțiuni pentru ${symbol.toUpperCase()}`
      : `Am adăugat ${shares} acțiuni noi pentru ${symbol.toUpperCase()}`
    
    const tempDiv = document.createElement('div')
    tempDiv.className = 'fixed bottom-4 right-4 bg-green-500/90 text-white px-6 py-3 rounded-lg shadow-lg'
    tempDiv.textContent = successMessage
    document.body.appendChild(tempDiv)
    
    setTimeout(() => {
      document.body.removeChild(tempDiv)
    }, 3000)
  }

  const updateShares = (symbol: string, newShares: number) => {
    if (newShares <= 0) {
      // Dacă numărul de acțiuni este 0 sau negativ, eliminăm acțiunea din portofoliu
      setPortfolio(prev => prev.filter(item => item.symbol !== symbol))
    } else {
      // Altfel, actualizăm numărul de acțiuni
      setPortfolio(prev =>
        prev.map(item =>
          item.symbol === symbol
            ? { ...item, shares: newShares }
            : item
        )
      )
    }
  }

  const chartData: ChartData<'line'> | null = stockData ? {
    labels: stockData.labels,
    datasets: [
      {
        label: 'Preț acțiune',
        data: stockData.prices,
        borderColor: 'rgb(139, 92, 246)',
        backgroundColor: 'rgba(139, 92, 246, 0.5)',
        tension: 0.1
      }
    ]
  } : null

  return (
    <div className="min-h-screen bg-[#0A0B1E] bg-[url('/stars.png')] text-white">
      <div className="max-w-7xl mx-auto px-4">
        {/* Header */}
        <header className="py-6 border-b border-violet-800/30">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-2xl">🌙</span>
              <h1 className="text-2xl font-medium bg-gradient-to-r from-violet-400 to-purple-600 bg-clip-text text-transparent">
                Stock Tracker
              </h1>
            </div>
          </div>
        </header>

        {/* Hero Section */}
        <div className="py-20 text-center space-y-6">
          <h2 className="text-5xl font-bold bg-gradient-to-r from-violet-400 to-purple-600 bg-clip-text text-transparent">
            Bun venit în Spațiul Investițiilor!
          </h2>
          <p className="text-violet-300 text-lg">
            Urmărește evoluția acțiunilor într-un mod interactiv și elegant.
          </p>

          {/* Search Bar */}
          <div className="max-w-2xl mx-auto mt-12">
            <div className="relative flex items-center">
              <input
                type="text"
                value={symbol}
                onChange={(e) => setSymbol(e.target.value.toUpperCase())}
                placeholder="Introduceți simbolul (ex: AAPL)"
                className="w-full px-6 py-4 bg-white/5 border border-violet-500/30 rounded-lg focus:outline-none focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20 text-lg"
                onKeyDown={(e) => e.key === 'Enter' && searchStock()}
              />
              <button
                onClick={searchStock}
                disabled={loading}
                className="absolute right-2 px-6 py-2 bg-violet-600 hover:bg-violet-500 rounded-md transition-colors disabled:opacity-50 text-white font-medium"
              >
                {loading ? 'Se încarcă...' : 'Caută'}
              </button>
            </div>
          </div>
        </div>

        {error && (
          <div className="max-w-2xl mx-auto mb-8 p-4 bg-red-500/10 border border-red-500/30 rounded-lg text-red-200">
            {error}
          </div>
        )}

        {stockData && (
          <div className="space-y-8 mb-20">
            <div className="bg-white/5 backdrop-blur-sm p-8 rounded-2xl border border-violet-500/30">
              <h2 className="text-2xl font-semibold mb-6 flex items-center gap-2">
                <span className="text-violet-400">{symbol.toUpperCase()}</span>
                <span className="text-gray-400">•</span>
                <span>{stockData.companyName}</span>
              </h2>
              <div className="h-[400px]">
                {chartData && <Line data={chartData} options={{
                  responsive: true,
                  maintainAspectRatio: false,
                  scales: {
                    y: {
                      ticks: { color: 'rgba(255, 255, 255, 0.7)' },
                      grid: { color: 'rgba(139, 92, 246, 0.1)' }
                    },
                    x: {
                      ticks: { color: 'rgba(255, 255, 255, 0.7)' },
                      grid: { color: 'rgba(139, 92, 246, 0.1)' }
                    }
                  },
                  plugins: {
                    legend: { 
                      labels: { color: 'rgba(255, 255, 255, 0.9)' },
                      display: false
                    }
                  }
                }} />}
              </div>
            </div>

            <div className="bg-white/5 backdrop-blur-sm p-8 rounded-2xl border border-violet-500/30">
              <h3 className="text-xl font-semibold mb-6 text-violet-400">Adaugă la portofoliu</h3>
              <div className="flex gap-4 items-center">
                <input
                  type="number"
                  value={shares}
                  onChange={(e) => setShares(Math.max(0.01, Number(e.target.value)))}
                  step="0.01"
                  min="0.01"
                  className="w-32 px-4 py-2 bg-white/5 border border-violet-500/30 rounded-lg focus:outline-none focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20"
                />
                <button
                  onClick={addToPortfolio}
                  className="px-6 py-2 bg-violet-600 hover:bg-violet-500 rounded-lg transition-colors text-white font-medium"
                >
                  Adaugă la portofoliu
                </button>
              </div>
            </div>

            {portfolio.length > 0 && (
              <div className="bg-white/5 backdrop-blur-sm p-8 rounded-2xl border border-violet-500/30">
                <h3 className="text-xl font-semibold mb-6 text-violet-400">Portofoliul meu</h3>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="text-violet-300 border-b border-violet-500/30">
                        <th className="text-left p-3">Simbol</th>
                        <th className="text-left p-3">Acțiuni</th>
                        <th className="text-right p-3">Preț/acțiune</th>
                        <th className="text-right p-3">Valoare totală</th>
                        <th className="text-right p-3">Dividend/acțiune</th>
                        <th className="text-right p-3">Dividend estimat</th>
                        <th className="text-left p-3">Următorul dividend</th>
                        <th className="text-left p-3">Frecvență</th>
                      </tr>
                    </thead>
                    <tbody>
                      {portfolio.map((item) => (
                        <tr key={item.symbol} className="border-b border-violet-500/10 hover:bg-white/5">
                          <td className="p-3 font-medium text-violet-400">{item.symbol}</td>
                          <td className="p-3">
                            <input
                              type="number"
                              value={item.shares}
                              onChange={(e) => updateShares(item.symbol, Math.max(0.01, Number(e.target.value)))}
                              step="0.01"
                              min="0.01"
                              className="w-24 px-2 py-1 bg-white/5 border border-violet-500/30 rounded-md focus:outline-none focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20"
                            />
                          </td>
                          <td className="text-right p-3">${item.price.toFixed(2)}</td>
                          <td className="text-right p-3 font-medium">${(item.price * item.shares).toFixed(2)}</td>
                          <td className="text-right p-3">${item.dividendPerShare.toFixed(3)}</td>
                          <td className="text-right p-3">${(item.dividendPerShare * item.shares).toFixed(2)}</td>
                          <td className="p-3">{item.nextDividendDate}</td>
                          <td className="p-3">{item.dividendFrequency}</td>
                        </tr>
                      ))}
                      <tr className="border-t border-violet-500/30 font-semibold bg-white/5">
                        <td className="p-3">Total</td>
                        <td className="p-3"></td>
                        <td className="p-3"></td>
                        <td className="text-right p-3 text-violet-400">
                          ${portfolio.reduce((sum, item) => sum + item.price * item.shares, 0).toFixed(2)}
                        </td>
                        <td className="p-3"></td>
                        <td className="text-right p-3 text-violet-400">
                          ${portfolio.reduce((sum, item) => sum + item.dividendPerShare * item.shares, 0).toFixed(2)}
                        </td>
                        <td className="p-3"></td>
                        <td className="p-3"></td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

export default App 