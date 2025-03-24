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
  Filler,
  ChartData
} from 'chart.js'
import finnhub, { CompanyProfile, StockCandles, StockDividend } from 'finnhub'
import './App.css'

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
)

// Configurare client Finnhub
const finnhubClient = new finnhub.DefaultApi()
finnhub.ApiClient.instance.authentications['api_key'].apiKey = import.meta.env.VITE_FINNHUB_API_KEY as string

interface StockData {
  labels: string[]
  prices: number[]
  dividendPerShare: number
  nextDividendDate: string
  dividendFrequency: 'Quarterly' | 'Annually' | 'Monthly' | 'Semi-Annually' | 'Unknown'
  companyName: string
}

interface PortfolioItem {
  symbol: string
  shares: number
  price: number
  dividendPerShare: number
  nextDividendDate: string
  dividendFrequency: string
  companyName: string
}

function App() {
  const [symbol, setSymbol] = useState('')
  const [stockData, setStockData] = useState<StockData | null>(null)
  const [portfolio, setPortfolio] = useState<PortfolioItem[]>([])
  const [loading, setLoading] = useState(false)
  const [selectedShares, setSelectedShares] = useState('1')
  const [error, setError] = useState<string | null>(null)

  const formatDate = (timestamp: number) => {
    return new Date(timestamp * 1000).toISOString().split('T')[0]
  }

  const getDividendFrequency = (dividendHistory: any[]) => {
    if (dividendHistory.length < 2) return 'Unknown'
    
    const intervals = dividendHistory
      .slice(1)
      .map((_, i) => {
        const diff = dividendHistory[i].date - dividendHistory[i + 1].date
        return Math.round(diff / (24 * 60 * 60))
      })

    const avgInterval = intervals.reduce((a, b) => a + b, 0) / intervals.length

    if (avgInterval <= 35) return 'Monthly'
    if (avgInterval <= 100) return 'Quarterly'
    if (avgInterval <= 190) return 'Semi-Annually'
    return 'Annually'
  }

  const searchStock = async () => {
    if (!symbol) return
    setError(null)
    setLoading(true)
    setStockData(null)
    
    try {
      // Obținem datele companiei
      const companyData = await new Promise<CompanyProfile>((resolve, reject) => {
        finnhubClient.companyProfile2({ symbol }, (error, data) => {
          if (error) reject(error)
          else resolve(data)
        })
      })

      if (!companyData || !companyData.name) {
        throw new Error('Simbol invalid sau companie negăsită')
      }

      // Obținem istoricul prețurilor
      const today = Math.floor(Date.now() / 1000)
      const oneMonthAgo = today - 30 * 24 * 60 * 60

      const candlesData = await new Promise<StockCandles>((resolve, reject) => {
        finnhubClient.stockCandles(symbol, 'D', oneMonthAgo, today, (error, data) => {
          if (error) reject(error)
          else resolve(data)
        })
      })

      if (!candlesData || candlesData.s === 'no_data') {
        throw new Error('Nu există date disponibile pentru acest simbol')
      }

      // Obținem datele despre dividende
      const fromDate = new Date(oneMonthAgo * 1000).toISOString().split('T')[0]
      const toDate = new Date((today + 365 * 24 * 60 * 60) * 1000).toISOString().split('T')[0]

      const dividendsData = await new Promise<StockDividend[]>((resolve, reject) => {
        finnhubClient.stockDividends(symbol, fromDate, toDate, (error, data) => {
          if (error) reject(error)
          else resolve(data)
        })
      })

      // Verificăm dacă avem un array valid de dividende
      const sortedDividends = Array.isArray(dividendsData) && dividendsData.length > 0
        ? dividendsData.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
        : []
      const nextDividend = sortedDividends[0]
      const dividendFrequency = Array.isArray(dividendsData) ? getDividendFrequency(dividendsData) : 'Unknown'

      const stockData: StockData = {
        labels: candlesData.t.map(formatDate),
        prices: candlesData.c,
        dividendPerShare: nextDividend?.amount || 0,
        nextDividendDate: nextDividend ? nextDividend.date : 'N/A',
        dividendFrequency: dividendFrequency,
        companyName: companyData.name
      }

      setStockData(stockData)
    } catch (error) {
      console.error('Error fetching stock data:', error)
      setError(error instanceof Error ? error.message : 'A apărut o eroare la încărcarea datelor')
      setStockData(null)
    } finally {
      setLoading(false)
    }
  }

  const addToPortfolio = () => {
    if (!stockData) return
    const lastPrice = stockData.prices[stockData.prices.length - 1]
    const shares = parseFloat(selectedShares)
    if (isNaN(shares) || shares <= 0) return

    setPortfolio([...portfolio, {
      symbol,
      shares,
      price: lastPrice,
      dividendPerShare: stockData.dividendPerShare,
      nextDividendDate: stockData.nextDividendDate,
      dividendFrequency: stockData.dividendFrequency,
      companyName: stockData.companyName
    }])
    setSelectedShares('1')
  }

  const updateShares = (index: number, newShares: string) => {
    const shares = parseFloat(newShares)
    if (isNaN(shares) || shares < 0) return

    const newPortfolio = [...portfolio]
    newPortfolio[index] = { ...newPortfolio[index], shares }
    setPortfolio(newPortfolio)
  }

  const calculateNextDividend = (item: PortfolioItem) => {
    return (item.shares * item.dividendPerShare).toFixed(2)
  }

  const calculateAnnualDividend = (item: PortfolioItem) => {
    const multiplier = {
      'Monthly': 12,
      'Quarterly': 4,
      'Semi-Annually': 2,
      'Annually': 1,
      'Unknown': 0
    }[item.dividendFrequency] || 0

    return (item.shares * item.dividendPerShare * multiplier).toFixed(2)
  }

  const chartData: ChartData<'line'> | null = stockData ? {
    labels: stockData.labels,
    datasets: [
      {
        label: `${symbol} - ${stockData.companyName}`,
        data: stockData.prices,
        fill: true,
        borderColor: '#9D4EDD',
        backgroundColor: 'rgba(157, 78, 221, 0.1)',
        tension: 0.4,
      },
    ],
  } : null

  const chartOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top' as const,
        labels: {
          color: '#ffffff'
        }
      },
      tooltip: {
        callbacks: {
          label: (context: any) => `$${context.raw.toFixed(2)}`
        }
      }
    },
    scales: {
      y: {
        type: 'linear' as const,
        grid: {
          color: 'rgba(157, 78, 221, 0.1)'
        },
        ticks: {
          color: '#B4A5CD',
          callback: (value: number | string) => {
            if (typeof value === 'number') {
              return `$${value.toFixed(2)}`
            }
            return value
          }
        }
      },
      x: {
        type: 'category' as const,
        grid: {
          color: 'rgba(157, 78, 221, 0.1)'
        },
        ticks: {
          color: '#B4A5CD'
        }
      }
    }
  } as const

  return (
    <div className="min-h-screen bg-gradient-to-b from-primary-bg to-secondary-bg p-4">
      <header className="container mx-auto py-6">
        <h1 className="text-4xl font-bold gradient-text">Cosmic Stock Tracker</h1>
      </header>
      
      <main className="container mx-auto mt-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Search Panel */}
          <div className="cosmic-card">
            <h2 className="text-2xl font-semibold mb-4 gradient-text">Stock Search</h2>
            <div className="space-y-4">
              <input
                type="text"
                placeholder="Enter stock symbol..."
                className="cosmic-input w-full p-2"
                value={symbol}
                onChange={(e) => setSymbol(e.target.value.toUpperCase())}
                onKeyPress={(e) => e.key === 'Enter' && searchStock()}
              />
              <button 
                className="cosmic-button w-full"
                onClick={searchStock}
                disabled={loading}
              >
                {loading ? 'Searching...' : 'Search'}
                <svg
                  className="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                  />
                </svg>
              </button>
              {error && (
                <div className="text-red-400 text-sm mt-2">
                  {error}
                </div>
              )}
            </div>
          </div>

          {/* Chart Panel */}
          <div className="cosmic-card lg:col-span-2">
            <h2 className="text-2xl font-semibold mb-4 gradient-text">
              {stockData ? `${symbol} - ${stockData.companyName}` : 'Price Chart'}
            </h2>
            {stockData ? (
              <>
                <div className="cosmic-chart mb-4">
                  {chartData && <Line data={chartData} options={chartOptions} />}
                </div>
                <div className="flex gap-4 items-center mb-4">
                  <input
                    type="number"
                    step="0.01"
                    min="0.01"
                    className="cosmic-input p-2 w-32"
                    value={selectedShares}
                    onChange={(e) => setSelectedShares(e.target.value)}
                    placeholder="Shares"
                  />
                  <button 
                    className="cosmic-button"
                    onClick={addToPortfolio}
                  >
                    Add to Portfolio
                  </button>
                </div>
                <div className="text-text-secondary space-y-2">
                  <p>Dividend per Share: ${stockData.dividendPerShare.toFixed(2)}</p>
                  <p>Next Dividend Date: {stockData.nextDividendDate}</p>
                  <p>Frequency: {stockData.dividendFrequency}</p>
                </div>
              </>
            ) : (
              <div className="text-center text-text-secondary py-12">
                Search for a stock to see its price chart
              </div>
            )}
          </div>

          {/* Portfolio Panel */}
          <div className="cosmic-card lg:col-span-3">
            <h2 className="text-2xl font-semibold mb-4 gradient-text">Portfolio</h2>
            {portfolio.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="text-left text-text-secondary">
                      <th className="p-2">Symbol</th>
                      <th className="p-2">Company</th>
                      <th className="p-2">Shares</th>
                      <th className="p-2">Price</th>
                      <th className="p-2">Total Value</th>
                      <th className="p-2">Next Dividend Date</th>
                      <th className="p-2">Next Dividend</th>
                      <th className="p-2">Annual Dividend</th>
                      <th className="p-2">Frequency</th>
                    </tr>
                  </thead>
                  <tbody>
                    {portfolio.map((item, index) => (
                      <tr key={index} className="border-t border-accent-color/10">
                        <td className="p-2">{item.symbol}</td>
                        <td className="p-2">{item.companyName}</td>
                        <td className="p-2">
                          <input
                            type="number"
                            step="0.01"
                            min="0.01"
                            className="cosmic-input p-1 w-24"
                            value={item.shares}
                            onChange={(e) => updateShares(index, e.target.value)}
                          />
                        </td>
                        <td className="p-2">${item.price.toFixed(2)}</td>
                        <td className="p-2">${(item.shares * item.price).toFixed(2)}</td>
                        <td className="p-2">{item.nextDividendDate}</td>
                        <td className="p-2">${calculateNextDividend(item)}</td>
                        <td className="p-2">${calculateAnnualDividend(item)}</td>
                        <td className="p-2">{item.dividendFrequency}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="text-center text-text-secondary py-8">
                Your portfolio is empty. Add some stocks!
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  )
}

export default App 