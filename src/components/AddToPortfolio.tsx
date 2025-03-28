import React, { useState } from 'react';

interface AddToPortfolioProps {
  symbol: string;
  currentPrice: number;
}

export const AddToPortfolio: React.FC<AddToPortfolioProps> = ({ symbol, currentPrice }) => {
  const [shares, setShares] = useState('');
  const [showForm, setShowForm] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const portfolio = JSON.parse(localStorage.getItem('portfolio') || '[]');
    
    // Verifică dacă acțiunea există deja în portofoliu
    const existingStockIndex = portfolio.findIndex((stock: any) => stock.symbol === symbol);
    
    const newStock = {
      symbol,
      shares: Number(shares),
      averagePrice: currentPrice,
      dividendYield: 0, // Vom actualiza aceste valori când vom avea datele
      nextDividendDate: '', // Vom actualiza aceste valori când vom avea datele
      dividendAmount: 0 // Vom actualiza aceste valori când vom avea datele
    };

    if (existingStockIndex >= 0) {
      // Actualizează numărul de acțiuni și prețul mediu
      const existingStock = portfolio[existingStockIndex];
      const totalShares = existingStock.shares + Number(shares);
      const totalCost = (existingStock.shares * existingStock.averagePrice) + (Number(shares) * currentPrice);
      const newAveragePrice = totalCost / totalShares;
      
      portfolio[existingStockIndex] = {
        ...existingStock,
        shares: totalShares,
        averagePrice: newAveragePrice
      };
    } else {
      portfolio.push(newStock);
    }

    localStorage.setItem('portfolio', JSON.stringify(portfolio));
    setShares('');
    setShowForm(false);
  };

  return (
    <div className="mt-4">
      <button
        onClick={() => setShowForm(!showForm)}
        className="bg-purple-600 hover:bg-purple-700 text-white font-bold py-2 px-4 rounded"
      >
        {showForm ? 'Anulează' : 'Adaugă în Portofoliu'}
      </button>

      {showForm && (
        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-300">
              Număr de Acțiuni
            </label>
            <input
              type="number"
              min="1"
              value={shares}
              onChange={(e) => setShares(e.target.value)}
              className="mt-1 block w-full rounded-md bg-gray-700 border-gray-600 text-white"
              required
            />
          </div>
          <div className="text-gray-300">
            <p>Preț per acțiune: ${currentPrice}</p>
            <p>Cost total: ${(Number(shares) * currentPrice).toFixed(2)}</p>
          </div>
          <button
            type="submit"
            className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded"
          >
            Confirmă Adăugarea
          </button>
        </form>
      )}
    </div>
  );
}; 