import { useState, useEffect } from 'react'
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
import { supabase } from './supabase'

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
  id?: number
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
  const [userId, setUserId] = useState<string | null>(null)

  useEffect(() => {
    // Verificăm dacă utilizatorul este autentificat
    const checkUser = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        setUserId(user.id)
        // Încărcăm portofoliul utilizatorului
        loadPortfolio(user.id)
      } else {
        // Dacă nu este autentificat, creăm un cont anonim
        const { data: { user: anonUser }, error } = await supabase.auth.signUp({
          email: `${Math.random().toString(36).substring(2)}@anonymous.com`,
          password: Math.random().toString(36).substring(2)
        })
        if (error) {
          console.error('Eroare la crearea contului anonim:', error)
          return
        }
        if (anonUser) {
          setUserId(anonUser.id)
        }
      }
    }

    checkUser()
  }, [])

  const loadPortfolio = async (uid: string) => {
    try {
      const { data, error } = await supabase
        .from('portfolio')
        .select('*')
        .eq('user_id', uid)

      if (error) throw error

      if (data) {
        const portfolioItems: PortfolioItem[] = data.map(item => ({
          id: item.id,
          symbol: item.symbol,
          shares: item.shares,
          price: item.price,
          dividendPerShare: item.dividend_per_share,
          nextDividendDate: item.next_dividend_date,
          dividendFrequency: item.dividend_frequency
        }))
        setPortfolio(portfolioItems)
      }
    } catch (error) {
      console.error('Eroare la încărcarea portofoliului:', error)
    }
  }

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
      const companyDataResponse = await companyResponse.json()
      const companyData = {
        name: companyDataResponse.data?.name || symbol.toUpperCase()
      }

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
      console.log('Răspuns EOD:', eodData)
      
      if (!eodData.data || !Array.isArray(eodData.data) || eodData.data.length === 0) {
        throw new Error('Nu există date disponibile pentru acest simbol')
      }

      const stockPrices: MarketStackEOD[] = eodData.data.map((item: any) => ({
        close: item.close || 0,
        date: item.date
      }))

      // Simulăm date despre dividende
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

  const addToPortfolio = async () => {
    if (!stockData || !userId) return

    const newItem: PortfolioItem = {
      symbol: symbol.toUpperCase(),
      shares: shares,
      price: stockData.prices[stockData.prices.length - 1],
      dividendPerShare: stockData.dividendPerShare,
      nextDividendDate: stockData.nextDividendDate,
      dividendFrequency: stockData.dividendFrequency
    }

    try {
      const { data, error } = await supabase
        .from('portfolio')
        .insert([{
          user_id: userId,
          symbol: newItem.symbol,
          shares: newItem.shares,
          price: newItem.price,
          dividend_per_share: newItem.dividendPerShare,
          next_dividend_date: newItem.nextDividendDate,
          dividend_frequency: newItem.dividendFrequency
        }])
        .select()

      if (error) throw error

      if (data && data[0]) {
        const insertedItem: PortfolioItem = {
          id: data[0].id,
          ...newItem
        }
        setPortfolio(prev => [...prev, insertedItem])
        setShares(1)
      }
    } catch (error) {
      console.error('Eroare la adăugarea în portofoliu:', error)
      setError('Eroare la salvarea în portofoliu')
    }
  }

  const updateShares = async (symbol: string, newShares: number) => {
    try {
      const itemToUpdate = portfolio.find(item => item.symbol === symbol)
      if (!itemToUpdate || !itemToUpdate.id || !userId) return

      const { error } = await supabase
        .from('portfolio')
        .update({
          shares: newShares
        })
        .eq('id', itemToUpdate.id)
        .eq('user_id', userId)

      if (error) throw error

      setPortfolio(prev =>
        prev.map(item =>
          item.symbol === symbol
            ? { ...item, shares: newShares }
            : item
        )
      )
    } catch (error) {
      console.error('Eroare la actualizarea acțiunilor:', error)
      setError('Eroare la actualizarea numărului de acțiuni')
    }
  }

  const deleteFromPortfolio = async (itemId: number) => {
    try {
      if (!userId) return

      const { error } = await supabase
        .from('portfolio')
        .delete()
        .eq('id', itemId)
        .eq('user_id', userId)

      if (error) throw error

      setPortfolio(prev => prev.filter(item => item.id !== itemId))
    } catch (error) {
      console.error('Eroare la ștergerea din portofoliu:', error)
      setError('Eroare la ștergerea din portofoliu')
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
    <div className="min-h-screen bg-gradient-to-br from-gray-900 to-violet-950 text-white p-8">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-4xl font-bold text-center mb-8">Cosmic Stock Tracker</h1>
        
        <div className="flex gap-4 mb-8">
          <input
            type="text"
            value={symbol}
            onChange={(e) => setSymbol(e.target.value.toUpperCase())}
            placeholder="Introduceți simbolul (ex: AAPL)"
            className="flex-1 p-2 rounded bg-violet-900/50 border border-violet-500 focus:outline-none focus:ring-2 focus:ring-violet-400"
            onKeyDown={(e) => e.key === 'Enter' && searchStock()}
          />
          <button
            onClick={searchStock}
            disabled={loading}
            className="px-6 py-2 bg-violet-600 rounded hover:bg-violet-500 transition-colors disabled:opacity-50"
          >
            {loading ? 'Se încarcă...' : 'Caută'}
          </button>
        </div>

        {error && (
          <div className="mb-8 p-4 bg-red-500/20 border border-red-500 rounded text-red-200">
            {error}
          </div>
        )}

        <div className="space-y-8">
          {stockData && (
            <>
              <div className="bg-violet-900/20 p-6 rounded-lg border border-violet-500/30">
                <h2 className="text-2xl font-semibold mb-4">{stockData.companyName} ({symbol.toUpperCase()})</h2>
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
                      legend: { labels: { color: 'rgba(255, 255, 255, 0.9)' } }
                    }
                  }} />}
                </div>
              </div>

              <div className="bg-violet-900/20 p-6 rounded-lg border border-violet-500/30">
                <h3 className="text-xl font-semibold mb-4">Adaugă la portofoliu</h3>
                <div className="flex gap-4 items-center">
                  <input
                    type="number"
                    value={shares}
                    onChange={(e) => setShares(Math.max(0.01, Number(e.target.value)))}
                    step="0.01"
                    min="0.01"
                    className="w-32 p-2 rounded bg-violet-900/50 border border-violet-500 focus:outline-none focus:ring-2 focus:ring-violet-400"
                  />
                  <button
                    onClick={addToPortfolio}
                    className="px-6 py-2 bg-violet-600 rounded hover:bg-violet-500 transition-colors"
                  >
                    Adaugă la portofoliu
                  </button>
                </div>
              </div>
            </>
          )}

          {portfolio.length > 0 && (
            <div className="bg-violet-900/20 p-6 rounded-lg border border-violet-500/30">
              <h3 className="text-xl font-semibold mb-4">Portofoliul meu</h3>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="text-violet-300">
                      <th className="text-left p-2">Simbol</th>
                      <th className="text-left p-2">Acțiuni</th>
                      <th className="text-right p-2">Preț/acțiune</th>
                      <th className="text-right p-2">Valoare totală</th>
                      <th className="text-right p-2">Dividend/acțiune</th>
                      <th className="text-right p-2">Dividend estimat</th>
                      <th className="text-left p-2">Următorul dividend</th>
                      <th className="text-left p-2">Frecvență</th>
                      <th className="text-center p-2">Acțiuni</th>
                    </tr>
                  </thead>
                  <tbody>
                    {portfolio.map((item) => (
                      <tr key={item.symbol} className="border-t border-violet-500/30">
                        <td className="p-2">{item.symbol}</td>
                        <td className="p-2">
                          <input
                            type="number"
                            value={item.shares}
                            onChange={(e) => updateShares(item.symbol, Math.max(0.01, Number(e.target.value)))}
                            step="0.01"
                            min="0.01"
                            className="w-24 p-1 rounded bg-violet-900/50 border border-violet-500 focus:outline-none focus:ring-2 focus:ring-violet-400"
                          />
                        </td>
                        <td className="text-right p-2">${item.price.toFixed(2)}</td>
                        <td className="text-right p-2">${(item.price * item.shares).toFixed(2)}</td>
                        <td className="text-right p-2">${item.dividendPerShare.toFixed(3)}</td>
                        <td className="text-right p-2">${(item.dividendPerShare * item.shares).toFixed(2)}</td>
                        <td className="p-2">{item.nextDividendDate}</td>
                        <td className="p-2">{item.dividendFrequency}</td>
                        <td className="p-2 text-center">
                          <button
                            onClick={() => item.id && deleteFromPortfolio(item.id)}
                            className="px-3 py-1 bg-red-600 rounded hover:bg-red-500 transition-colors text-sm"
                          >
                            Șterge
                          </button>
                        </td>
                      </tr>
                    ))}
                    <tr className="border-t border-violet-500/30 font-semibold">
                      <td className="p-2">Total</td>
                      <td className="p-2"></td>
                      <td className="p-2"></td>
                      <td className="text-right p-2">
                        ${portfolio.reduce((sum, item) => sum + item.price * item.shares, 0).toFixed(2)}
                      </td>
                      <td className="p-2"></td>
                      <td className="text-right p-2">
                        ${portfolio.reduce((sum, item) => sum + item.dividendPerShare * item.shares, 0).toFixed(2)}
                      </td>
                      <td className="p-2"></td>
                      <td className="p-2"></td>
                      <td className="p-2"></td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default App 