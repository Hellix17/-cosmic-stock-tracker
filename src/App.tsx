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

interface StockData {
  labels: string[]
  prices: number[]
  dividendPerShare: number
  nextDividendDate: string
  dividendFrequency: 'Quarterly' | 'Annually' | 'Monthly' | 'Semi-Annually'
}

interface PortfolioItem {
  symbol: string
  shares: number
  price: number
  dividendPerShare: number
  nextDividendDate: string
  dividendFrequency: string
}

function App() {
  const [symbol, setSymbol] = useState('')
  const [stockData, setStockData] = useState<StockData | null>(null)
  const [portfolio, setPortfolio] = useState<PortfolioItem[]>([])
  const [loading, setLoading] = useState(false)
  const [selectedShares, setSelectedShares] = useState('1')

  const searchStock = async () => {
    if (!symbol) return
    
    setLoading(true)
    try {
      // Aici vom adăuga integrarea cu API-ul Finnhub
      const demoData: StockData = {
        labels: Array.from({ length: 30 }, (_, i) => `Day ${i + 1}`),
        prices: Array.from({ length: 30 }, () => Math.random() * 100 + 50),
        dividendPerShare: Number((Math.random() * 5).toFixed(2)),
        nextDividendDate: '2024-04-15',
        dividendFrequency: 'Quarterly'
      }
      setStockData(demoData)
    } catch (error) {
      console.error('Error fetching stock data:', error)
    }
    setLoading(false)
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
      dividendFrequency: stockData.dividendFrequency
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

  const chartData: ChartData<'line'> | null = stockData ? {
    labels: stockData.labels,
    datasets: [
      {
        label: symbol.toUpperCase(),
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
    },
    scales: {
      y: {
        grid: {
          color: 'rgba(157, 78, 221, 0.1)'
        },
        ticks: {
          color: '#B4A5CD'
        }
      },
      x: {
        grid: {
          color: 'rgba(157, 78, 221, 0.1)'
        },
        ticks: {
          color: '#B4A5CD'
        }
      }
    }
  }

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
            </div>
          </div>

          {/* Chart Panel */}
          <div className="cosmic-card lg:col-span-2">
            <h2 className="text-2xl font-semibold mb-4 gradient-text">Price Chart</h2>
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
                  <p>Dividend per Share: ${stockData.dividendPerShare}</p>
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
                      <th className="p-2">Shares</th>
                      <th className="p-2">Price</th>
                      <th className="p-2">Total Value</th>
                      <th className="p-2">Next Dividend Date</th>
                      <th className="p-2">Expected Dividend</th>
                      <th className="p-2">Frequency</th>
                    </tr>
                  </thead>
                  <tbody>
                    {portfolio.map((item, index) => (
                      <tr key={index} className="border-t border-accent-color/10">
                        <td className="p-2">{item.symbol}</td>
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