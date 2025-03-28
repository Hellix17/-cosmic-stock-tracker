document.addEventListener('DOMContentLoaded', () => {
    const searchInput = document.getElementById('stockSearch');
    const searchBtn = document.getElementById('searchBtn');
    const stockGrid = document.getElementById('stockGrid');
    const chartContainer = document.getElementById('chartContainer');

    // Funcție pentru a crea un card de acțiune
    function createStockCard(stockData) {
        const card = document.createElement('div');
        card.className = 'stock-card';

        const priceChange = stockData.price.regularMarketChange;
        const priceChangePercent = stockData.price.regularMarketChangePercent;
        const priceColor = priceChange >= 0 ? 'text-green-400' : 'text-red-400';

        card.innerHTML = `
            <div class="flex justify-between items-start mb-4">
                <div>
                    <h3 class="text-xl font-bold gradient-text">${stockData.price.longName}</h3>
                    <p class="text-gray-400">${stockData.price.shortName}</p>
                </div>
                <div class="text-right">
                    <p class="text-2xl font-bold">${stockData.price.regularMarketPrice.toFixed(2)} USD</p>
                    <p class="${priceColor}">
                        ${priceChange >= 0 ? '+' : ''}${priceChange.toFixed(2)} (${priceChangePercent.toFixed(2)}%)
                    </p>
                </div>
            </div>
            <div class="grid grid-cols-2 gap-4 mb-4">
                <div>
                    <p class="text-gray-400">Volum</p>
                    <p class="font-semibold">${stockData.price.regularMarketVolume.toLocaleString()}</p>
                </div>
                <div>
                    <p class="text-gray-400">Capitalizare</p>
                    <p class="font-semibold">${(stockData.price.marketCap / 1e9).toFixed(2)}B USD</p>
                </div>
                <div>
                    <p class="text-gray-400">Sector</p>
                    <p class="font-semibold">${stockData.assetProfile.sector || 'N/A'}</p>
                </div>
                <div>
                    <p class="text-gray-400">Țară</p>
                    <p class="font-semibold">${stockData.assetProfile.country || 'N/A'}</p>
                </div>
            </div>
            <div class="mb-4">
                <p class="text-gray-400">Descriere</p>
                <p class="text-sm">${stockData.assetProfile.description || 'Nu există descriere disponibilă.'}</p>
            </div>
            <div class="flex justify-between items-center">
                <button class="cosmic-button px-4 py-2 rounded-lg text-sm view-history" data-symbol="${stockData.price.shortName}">
                    <i class="fas fa-chart-line mr-2"></i>Vezi Istoric
                </button>
                <div>
                    <span class="text-gray-400">52W High:</span>
                    <span class="font-semibold">${stockData.summaryDetail.fiftyTwoWeekHigh.toFixed(2)}</span>
                    <span class="text-gray-400 ml-4">52W Low:</span>
                    <span class="font-semibold">${stockData.summaryDetail.fiftyTwoWeekLow.toFixed(2)}</span>
                </div>
            </div>
        `;

        // Adaugă event listener pentru butonul de istoric
        const historyBtn = card.querySelector('.view-history');
        historyBtn.addEventListener('click', () => {
            loadStockHistory(stockData.price.shortName);
        });

        return card;
    }

    // Funcție pentru a încărca datele unei acțiuni
    async function loadStockData(symbol) {
        try {
            const response = await fetch(`/api/stock/${symbol}`);
            if (!response.ok) throw new Error('Eroare la încărcarea datelor');
            const data = await response.json();
            
            stockGrid.innerHTML = '';
            stockGrid.appendChild(createStockCard(data));
        } catch (error) {
            console.error('Eroare:', error);
            stockGrid.innerHTML = `
                <div class="text-center text-red-400 p-4">
                    <i class="fas fa-exclamation-triangle text-2xl mb-2"></i>
                    <p>Nu s-au putut încărca datele. Vă rugăm încercați din nou.</p>
                </div>
            `;
        }
    }

    // Funcție pentru a încărca istoricul unei acțiuni
    async function loadStockHistory(symbol) {
        try {
            const response = await fetch(`/api/stock/history/${symbol}?period=1mo&interval=1d`);
            if (!response.ok) throw new Error('Eroare la încărcarea istoricului');
            const data = await response.json();
            
            // Pregătește datele pentru grafic
            const timestamps = data.chart.result[0].timestamp;
            const prices = data.chart.result[0].indicators.quote[0].close;
            const volumes = data.chart.result[0].indicators.quote[0].volume;

            // Creează graficul
            chartContainer.innerHTML = '<canvas id="priceChart"></canvas>';
            chartContainer.classList.remove('hidden');

            const ctx = document.getElementById('priceChart').getContext('2d');
            new Chart(ctx, {
                type: 'line',
                data: {
                    labels: timestamps.map(t => new Date(t * 1000).toLocaleDateString()),
                    datasets: [{
                        label: 'Preț (USD)',
                        data: prices,
                        borderColor: '#9f7aea',
                        backgroundColor: 'rgba(159, 122, 234, 0.1)',
                        borderWidth: 2,
                        fill: true,
                        tension: 0.4
                    }]
                },
                options: {
                    responsive: true,
                    plugins: {
                        legend: {
                            labels: {
                                color: '#e2e8f0'
                            }
                        }
                    },
                    scales: {
                        x: {
                            grid: {
                                color: 'rgba(255, 255, 255, 0.1)'
                            },
                            ticks: {
                                color: '#e2e8f0'
                            }
                        },
                        y: {
                            grid: {
                                color: 'rgba(255, 255, 255, 0.1)'
                            },
                            ticks: {
                                color: '#e2e8f0'
                            }
                        }
                    }
                }
            });
        } catch (error) {
            console.error('Eroare:', error);
            chartContainer.innerHTML = `
                <div class="text-center text-red-400 p-4">
                    <i class="fas fa-exclamation-triangle text-2xl mb-2"></i>
                    <p>Nu s-a putut încărca istoricul. Vă rugăm încercați din nou.</p>
                </div>
            `;
            chartContainer.classList.remove('hidden');
        }
    }

    // Event listeners
    searchBtn.addEventListener('click', () => {
        const symbol = searchInput.value.trim().toUpperCase();
        if (symbol) {
            loadStockData(symbol);
        }
    });

    searchInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            const symbol = searchInput.value.trim().toUpperCase();
            if (symbol) {
                loadStockData(symbol);
            }
        }
    });
}); 