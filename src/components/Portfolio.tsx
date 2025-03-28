import { useState, useEffect } from 'react';
import { Pie } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
  ChartData,
  ChartOptions
} from 'chart.js';

ChartJS.register(ArcElement, Tooltip, Legend);

interface Stock {
  symbol: string;
  shares: number;
  averagePrice: number;
  dividends: {
    amount: number;
    date: string;
  }[];
}

export function Portfolio() {
  const [portfolio, setPortfolio] = useState<Stock[]>(() => {
    const savedPortfolio = localStorage.getItem('portfolio');
    return savedPortfolio ? JSON.parse(savedPortfolio) : [];
  });

  const [totalValue, setTotalValue] = useState(0);
  const [currentPrices, setCurrentPrices] = useState<Record<string, number>>({});

  useEffect(() => {
    const fetchCurrentPrices = async () => {
      const prices: Record<string, number> = {};
      for (const stock of portfolio) {
        try {
          const response = await fetch(
            `https://api.polygon.io/v2/aggs/ticker/${stock.symbol}/prev?apiKey=EF4_nNyJgvXfgXUpKgUJm_mQwR7ZHJdJ`
          );
          const data = await response.json();
          if (data.results?.[0]) {
            prices[stock.symbol] = data.results[0].c;
          }
        } catch (error) {
          console.error(`Error fetching price for ${stock.symbol}:`, error);
        }
      }
      setCurrentPrices(prices);
    };

    fetchCurrentPrices();
  }, [portfolio]);

  useEffect(() => {
    const newTotalValue = portfolio.reduce((total, stock) => {
      const currentPrice = currentPrices[stock.symbol] || stock.averagePrice;
      return total + (stock.shares * currentPrice);
    }, 0);
    setTotalValue(newTotalValue);
  }, [portfolio, currentPrices]);

  const deleteStock = (symbol: string) => {
    const newPortfolio = portfolio.filter(stock => stock.symbol !== symbol);
    setPortfolio(newPortfolio);
    localStorage.setItem('portfolio', JSON.stringify(newPortfolio));
  };

  const chartData: ChartData<'pie'> = {
    labels: portfolio.map(stock => stock.symbol),
    datasets: [
      {
        data: portfolio.map(stock => {
          const currentPrice = currentPrices[stock.symbol] || stock.averagePrice;
          return stock.shares * currentPrice;
        }),
        backgroundColor: [
          '#FF6384',
          '#36A2EB',
          '#FFCE56',
          '#4BC0C0',
          '#9966FF',
          '#FF9F40',
          '#FF6384',
          '#36A2EB',
          '#FFCE56',
          '#4BC0C0'
        ]
      }
    ]
  };

  const chartOptions: ChartOptions<'pie'> = {
    responsive: true,
    plugins: {
      legend: {
        position: 'right' as const
      }
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h2 className="text-2xl font-bold mb-6 text-center">Portofoliul Tău</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <div className="bg-gray-800 p-6 rounded-lg">
          <h3 className="text-xl font-semibold mb-4">Distribuția Investițiilor</h3>
          <div className="h-64">
            <Pie data={chartData} options={chartOptions} />
          </div>
        </div>
        
        <div className="bg-gray-800 p-6 rounded-lg">
          <h3 className="text-xl font-semibold mb-4">Sumar Portofoliu</h3>
          <p className="text-2xl font-bold text-green-500">
            ${totalValue.toFixed(2)}
          </p>
          <p className="text-gray-400 mt-2">Valoare Totală</p>
        </div>
      </div>

      <div className="bg-gray-800 rounded-lg overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="bg-gray-700">
              <th className="px-6 py-3 text-left">Simbol</th>
              <th className="px-6 py-3 text-left">Acțiuni</th>
              <th className="px-6 py-3 text-left">Preț Mediu</th>
              <th className="px-6 py-3 text-left">Valoare Curentă</th>
              <th className="px-6 py-3 text-left">% din Portofoliu</th>
              <th className="px-6 py-3 text-left">Acțiuni</th>
            </tr>
          </thead>
          <tbody>
            {portfolio.map((stock) => {
              const currentPrice = currentPrices[stock.symbol] || stock.averagePrice;
              const value = stock.shares * currentPrice;
              const percentage = (value / totalValue) * 100;
              
              return (
                <tr key={stock.symbol} className="border-t border-gray-700">
                  <td className="px-6 py-4">{stock.symbol}</td>
                  <td className="px-6 py-4">{stock.shares}</td>
                  <td className="px-6 py-4">${stock.averagePrice.toFixed(2)}</td>
                  <td className="px-6 py-4">${value.toFixed(2)}</td>
                  <td className="px-6 py-4">{percentage.toFixed(2)}%</td>
                  <td className="px-6 py-4">
                    <button
                      onClick={() => deleteStock(stock.symbol)}
                      className="text-red-500 hover:text-red-700"
                    >
                      Șterge
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="mt-8">
        <h3 className="text-xl font-semibold mb-4">Dividende</h3>
        <div className="bg-gray-800 rounded-lg overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-700">
                <th className="px-6 py-3 text-left">Simbol</th>
                <th className="px-6 py-3 text-left">Data</th>
                <th className="px-6 py-3 text-left">Sumă per Acțiune</th>
                <th className="px-6 py-3 text-left">Total</th>
              </tr>
            </thead>
            <tbody>
              {portfolio.map((stock) => (
                stock.dividends.map((dividend, index) => (
                  <tr key={`${stock.symbol}-${index}`} className="border-t border-gray-700">
                    <td className="px-6 py-4">{stock.symbol}</td>
                    <td className="px-6 py-4">{new Date(dividend.date).toLocaleDateString('ro-RO')}</td>
                    <td className="px-6 py-4">${dividend.amount.toFixed(2)}</td>
                    <td className="px-6 py-4">${(dividend.amount * stock.shares).toFixed(2)}</td>
                  </tr>
                ))
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
} 