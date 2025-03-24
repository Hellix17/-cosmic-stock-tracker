import { Pie } from 'react-chartjs-2'
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
  ChartData
} from 'chart.js'

ChartJS.register(ArcElement, Tooltip, Legend)

interface PortfolioItem {
  symbol: string
  shares: number
  price: number
  dividendPerShare: number
  nextDividendDate: string
  dividendFrequency: string
}

const generateChartColors = (count: number) => {
  const colors = []
  const baseHue = 270 // Violet
  const saturation = 70
  const lightness = 60

  for (let i = 0; i < count; i++) {
    const hue = (baseHue + (360 / count) * i) % 360
    colors.push(`hsl(${hue}, ${saturation}%, ${lightness}%)`)
  }

  return colors
}

function Portfolio() {
  // Încărcăm portofoliul din localStorage
  const portfolio: PortfolioItem[] = JSON.parse(localStorage.getItem('portfolio') || '[]')

  // Calculăm valoarea totală a portofoliului
  const totalValue = portfolio.reduce((sum, item) => sum + item.price * item.shares, 0)

  // Pregătim datele pentru graficul circular
  const chartData: ChartData<'pie'> = {
    labels: portfolio.map(item => `${item.symbol} (${((item.price * item.shares / totalValue) * 100).toFixed(1)}%)`),
    datasets: [{
      data: portfolio.map(item => item.price * item.shares),
      backgroundColor: generateChartColors(portfolio.length),
      borderColor: 'rgba(255, 255, 255, 0.1)',
      borderWidth: 1
    }]
  }

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
            <a
              href="https://hellix17.github.io/Cosmic-trader"
              className="px-4 py-2 bg-violet-600 hover:bg-violet-500 rounded-lg transition-colors text-white font-medium"
            >
              Înapoi la Căutare
            </a>
          </div>
        </header>

        <div className="py-12">
          <h2 className="text-3xl font-bold text-center mb-12 bg-gradient-to-r from-violet-400 to-purple-600 bg-clip-text text-transparent">
            Portofoliul Meu
          </h2>

          {portfolio.length > 0 ? (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Grafic Circular */}
              <div className="bg-white/5 backdrop-blur-sm p-8 rounded-2xl border border-violet-500/30">
                <h3 className="text-xl font-semibold mb-6 text-violet-400">Distribuția Portofoliului</h3>
                <div className="aspect-square">
                  <Pie data={chartData} options={{
                    responsive: true,
                    plugins: {
                      legend: {
                        position: 'right',
                        labels: {
                          color: 'rgba(255, 255, 255, 0.9)',
                          font: {
                            size: 14
                          },
                          padding: 20
                        }
                      },
                      tooltip: {
                        callbacks: {
                          label: (context) => {
                            const value = context.raw as number
                            const percentage = ((value / totalValue) * 100).toFixed(1)
                            return `$${value.toFixed(2)} (${percentage}%)`
                          }
                        }
                      }
                    }
                  }} />
                </div>
              </div>

              {/* Statistici */}
              <div className="bg-white/5 backdrop-blur-sm p-8 rounded-2xl border border-violet-500/30">
                <h3 className="text-xl font-semibold mb-6 text-violet-400">Statistici Portofoliu</h3>
                <div className="space-y-4">
                  <div className="flex justify-between items-center p-4 bg-white/5 rounded-lg">
                    <span>Valoare Totală Portofoliu</span>
                    <span className="font-semibold text-violet-400">${totalValue.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between items-center p-4 bg-white/5 rounded-lg">
                    <span>Dividende Anuale Estimate</span>
                    <span className="font-semibold text-violet-400">
                      ${portfolio.reduce((sum, item) => sum + item.dividendPerShare * item.shares * 4, 0).toFixed(2)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center p-4 bg-white/5 rounded-lg">
                    <span>Număr de Acțiuni</span>
                    <span className="font-semibold text-violet-400">{portfolio.length}</span>
                  </div>
                </div>
              </div>

              {/* Tabel Detaliat */}
              <div className="lg:col-span-2 bg-white/5 backdrop-blur-sm p-8 rounded-2xl border border-violet-500/30">
                <h3 className="text-xl font-semibold mb-6 text-violet-400">Detalii Portofoliu</h3>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="text-violet-300 border-b border-violet-500/30">
                        <th className="text-left p-3">Simbol</th>
                        <th className="text-right p-3">Acțiuni</th>
                        <th className="text-right p-3">Preț/acțiune</th>
                        <th className="text-right p-3">Valoare totală</th>
                        <th className="text-right p-3">% din Portofoliu</th>
                        <th className="text-right p-3">Dividend/acțiune</th>
                        <th className="text-right p-3">Dividend anual est.</th>
                        <th className="text-left p-3">Următorul dividend</th>
                      </tr>
                    </thead>
                    <tbody>
                      {portfolio.map((item) => (
                        <tr key={item.symbol} className="border-b border-violet-500/10 hover:bg-white/5">
                          <td className="p-3 font-medium text-violet-400">{item.symbol}</td>
                          <td className="text-right p-3">{item.shares}</td>
                          <td className="text-right p-3">${item.price.toFixed(2)}</td>
                          <td className="text-right p-3">${(item.price * item.shares).toFixed(2)}</td>
                          <td className="text-right p-3">
                            {((item.price * item.shares / totalValue) * 100).toFixed(1)}%
                          </td>
                          <td className="text-right p-3">${item.dividendPerShare.toFixed(3)}</td>
                          <td className="text-right p-3">
                            ${(item.dividendPerShare * item.shares * 4).toFixed(2)}
                          </td>
                          <td className="p-3">{item.nextDividendDate}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center py-12 text-violet-300">
              <p className="text-lg">Nu aveți nicio acțiune în portofoliu.</p>
              <a
                href="/"
                className="inline-block mt-4 px-6 py-3 bg-violet-600 hover:bg-violet-500 rounded-lg transition-colors text-white font-medium"
              >
                Adăugați Prima Acțiune
              </a>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default Portfolio 