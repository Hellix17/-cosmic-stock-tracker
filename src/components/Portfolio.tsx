import React, { useState, useEffect } from 'react';
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js';
import { Pie } from 'react-chartjs-2';

ChartJS.register(ArcElement, Tooltip, Legend);

interface PortfolioStock {
  symbol: string;
  shares: number;
  averagePrice: number;
  dividendYield: number;
  nextDividendDate: string;
  dividendAmount: number;
}

export const Portfolio: React.FC = () => {
  const [portfolio, setPortfolio] = useState<PortfolioStock[]>(() => {
    const saved = localStorage.getItem('portfolio');
    return saved ? JSON.parse(saved) : [];
  });

  const [totalValue, setTotalValue] = useState(0);

  useEffect(() => {
    // Calculează valoarea totală a portofoliului
    const total = portfolio.reduce((sum, stock) => 
      sum + (stock.shares * stock.averagePrice), 0);
    setTotalValue(total);
    
    // Salvează portofoliul în localStorage
    localStorage.setItem('portfolio', JSON.stringify(portfolio));
  }, [portfolio]);

  const handleDeleteStock = (symbol: string) => {
    setPortfolio(portfolio.filter(stock => stock.symbol !== symbol));
  };

  const pieChartData = {
    labels: portfolio.map(stock => stock.symbol),
    datasets: [{
      data: portfolio.map(stock => (stock.shares * stock.averagePrice / totalValue * 100).toFixed(2)),
      backgroundColor: [
        '#FF6384',
        '#36A2EB',
        '#FFCE56',
        '#4BC0C0',
        '#9966FF',
        '#FF9F40'
      ]
    }]
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('ro-RO', {
      style: 'currency',
      currency: 'USD'
    }).format(value);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ro-RO');
  };

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-3xl font-bold mb-6 text-center bg-clip-text text-transparent bg-gradient-to-r from-purple-400 to-pink-600">
        Portofoliul Meu
      </h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Grafic Circular */}
        <div className="bg-gray-800 p-6 rounded-lg backdrop-blur-md bg-opacity-50">
          <h2 className="text-xl font-semibold mb-4 text-white">Distribuția Portofoliului</h2>
          <div className="aspect-square">
            <Pie data={pieChartData} />
          </div>
          <p className="mt-4 text-center text-white">
            Valoare Totală: {formatCurrency(totalValue)}
          </p>
        </div>

        {/* Lista Acțiunilor */}
        <div className="bg-gray-800 p-6 rounded-lg backdrop-blur-md bg-opacity-50">
          <h2 className="text-xl font-semibold mb-4 text-white">Acțiunile Mele</h2>
          <div className="space-y-4">
            {portfolio.map((stock, index) => (
              <div key={index} className="bg-gray-700 p-4 rounded-lg relative">
                <button
                  onClick={() => handleDeleteStock(stock.symbol)}
                  className="absolute top-2 right-2 text-red-500 hover:text-red-400"
                >
                  <i className="fas fa-trash"></i>
                </button>
                <h3 className="text-lg font-semibold text-white">{stock.symbol}</h3>
                <div className="grid grid-cols-2 gap-2 mt-2 text-gray-300">
                  <p>Acțiuni deținute: {stock.shares}</p>
                  <p>Preț mediu: {formatCurrency(stock.averagePrice)}</p>
                  <p>Randament dividend: {stock.dividendYield}%</p>
                  <p>Următorul dividend: {formatDate(stock.nextDividendDate)}</p>
                  <p>Sumă dividend: {formatCurrency(stock.dividendAmount)}</p>
                  <p>Valoare totală: {formatCurrency(stock.shares * stock.averagePrice)}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}; 