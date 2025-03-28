import { useState } from 'react';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import { Portfolio } from './components/Portfolio';
import { AddToPortfolio } from './components/AddToPortfolio';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

type TimePeriod = '1M' | '3M' | '6M' | 'YTD' | '1Y';

function App() {
  const [symbol, setSymbol] = useState('');
  const [stockData, setStockData] = useState<any>(null);
  const [error, setError] = useState('');
  const [selectedPeriod, setSelectedPeriod] = useState<TimePeriod>('1M');
  const [showPortfolio, setShowPortfolio] = useState(false);

  const getStartDate = (period: TimePeriod) => {
    const now = new Date();
    switch (period) {
      case '1M':
        return new Date(now.setMonth(now.getMonth() - 1));
      case '3M':
        return new Date(now.setMonth(now.getMonth() - 3));
      case '6M':
        return new Date(now.setMonth(now.getMonth() - 6));
      case 'YTD':
        return new Date(now.getFullYear(), 0, 1);
      case '1Y':
        return new Date(now.setFullYear(now.getFullYear() - 1));
      default:
        return new Date(now.setMonth(now.getMonth() - 1));
    }
  };

  const searchStock = async (period: TimePeriod = selectedPeriod) => {
    if (!symbol) return;

    try {
      const startDate = getStartDate(period);
      const response = await fetch(
        `https://api.polygon.io/v2/aggs/ticker/${symbol}/range/1/day/${startDate.toISOString().split('T')[0]}/${new Date().toISOString().split('T')[0]}?apiKey=POLYGON_API_KEY&limit=500`
      );
      const data = await response.json();

      if (data.resultsCount === 0) {
        setError('Nu s-au găsit date pentru acest simbol.');
        setStockData(null);
        return;
      }

      setStockData(data);
      setError('');
      setSelectedPeriod(period);
    } catch (err) {
      setError('A apărut o eroare la căutarea datelor.');
      setStockData(null);
    }
  };

  const chartData = stockData?.results ? {
    labels: stockData.results.map((item: any) =>
      new Date(item.t).toLocaleDateString('ro-RO')
    ),
    datasets: [
      {
        label: symbol,
        data: stockData.results.map((item: any) => item.c),
        borderColor: 'rgb(75, 192, 192)',
        tension: 0.1
      }
    ]
  } : null;

  return (
    <div className="min-h-screen bg-gray-900 text-white py-8 px-4 sm:px-6 lg:px-8">
      <nav className="mb-8 flex justify-between items-center">
        <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-purple-400 to-pink-600">
          Cosmic Trade
        </h1>
        <button
          onClick={() => setShowPortfolio(!showPortfolio)}
          className="bg-purple-600 hover:bg-purple-700 text-white font-bold py-2 px-4 rounded"
        >
          {showPortfolio ? 'Vezi Grafic' : 'Vezi Portofoliu'}
        </button>
      </nav>

      {!showPortfolio ? (
        <>
          <div className="max-w-3xl mx-auto">
            <div className="flex gap-4 mb-6">
              <input
                type="text"
                value={symbol}
                onChange={(e) => setSymbol(e.target.value.toUpperCase())}
                placeholder="Introdu simbolul (ex: AAPL)"
                className="flex-1 p-2 rounded bg-gray-800 border border-gray-700"
              />
              <button
                onClick={() => searchStock()}
                className="px-4 py-2 bg-blue-600 rounded hover:bg-blue-700"
              >
                Caută
              </button>
            </div>

            {error && <p className="text-red-500 mb-4">{error}</p>}

            {stockData && (
              <div className="space-y-6">
                <div className="flex justify-center gap-2 mb-4">
                  {(['1M', '3M', '6M', 'YTD', '1Y'] as TimePeriod[]).map((period) => (
                    <button
                      key={period}
                      onClick={() => searchStock(period)}
                      className={`px-3 py-1 rounded ${
                        selectedPeriod === period
                          ? 'bg-blue-600'
                          : 'bg-gray-700 hover:bg-gray-600'
                      }`}
                    >
                      {period}
                    </button>
                  ))}
                </div>

                <div className="bg-gray-800 p-6 rounded-lg backdrop-blur-md bg-opacity-50">
                  {chartData && <Line data={chartData} />}
                </div>

                <AddToPortfolio
                  symbol={symbol}
                  currentPrice={stockData.results[stockData.results.length - 1].c}
                />
              </div>
            )}
          </div>
        </>
      ) : (
        <Portfolio />
      )}
    </div>
  );
}

export default App; 