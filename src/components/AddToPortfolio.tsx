import { useState } from 'react';

interface AddToPortfolioProps {
  symbol: string;
  currentPrice: number;
}

export function AddToPortfolio({ symbol, currentPrice }: AddToPortfolioProps) {
  const [shares, setShares] = useState<number>(0);
  const [showForm, setShowForm] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const savedPortfolio = localStorage.getItem('portfolio');
    const portfolio = savedPortfolio ? JSON.parse(savedPortfolio) : [];
    
    const existingStock = portfolio.find((stock: any) => stock.symbol === symbol);
    
    if (existingStock) {
      // Actualizează acțiunile existente
      const totalShares = existingStock.shares + shares;
      const newAveragePrice = ((existingStock.shares * existingStock.averagePrice) + (shares * currentPrice)) / totalShares;
      
      existingStock.shares = totalShares;
      existingStock.averagePrice = newAveragePrice;
    } else {
      // Adaugă acțiuni noi
      portfolio.push({
        symbol,
        shares,
        averagePrice: currentPrice,
        dividends: [] // Vom adăuga dividendele mai târziu
      });
    }
    
    localStorage.setItem('portfolio', JSON.stringify(portfolio));
    setShares(0);
    setShowForm(false);
  };

  return (
    <div className="mt-6">
      <button
        onClick={() => setShowForm(!showForm)}
        className="bg-purple-600 hover:bg-purple-700 text-white font-bold py-2 px-4 rounded"
      >
        {showForm ? 'Anulează' : 'Adaugă în Portofoliu'}
      </button>

      {showForm && (
        <form onSubmit={handleSubmit} className="mt-4 bg-gray-800 p-4 rounded-lg">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">
                Număr de Acțiuni
              </label>
              <input
                type="number"
                value={shares}
                onChange={(e) => setShares(Number(e.target.value))}
                min="1"
                className="w-full p-2 rounded bg-gray-700 border border-gray-600 text-white"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">
                Preț Curent
              </label>
              <input
                type="text"
                value={`$${currentPrice.toFixed(2)}`}
                disabled
                className="w-full p-2 rounded bg-gray-700 border border-gray-600 text-white"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">
                Cost Total
              </label>
              <input
                type="text"
                value={`$${(shares * currentPrice).toFixed(2)}`}
                disabled
                className="w-full p-2 rounded bg-gray-700 border border-gray-600 text-white"
              />
            </div>
          </div>
          <button
            type="submit"
            className="mt-4 w-full bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded"
          >
            Adaugă în Portofoliu
          </button>
        </form>
      )}
    </div>
  );
} 