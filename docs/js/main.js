document.addEventListener('DOMContentLoaded', () => {
    const searchInput = document.getElementById('stockSearch');
    const searchBtn = document.getElementById('searchBtn');
    const stockGrid = document.getElementById('stockGrid');
    const chartContainer = document.getElementById('chartContainer');

    // Funcție pentru a crea un grafic demo
    function createDemoChart() {
        chartContainer.innerHTML = '<canvas id="priceChart"></canvas>';
        chartContainer.classList.remove('hidden');

        const ctx = document.getElementById('priceChart').getContext('2d');
        const labels = Array.from({length: 30}, (_, i) => {
            const date = new Date();
            date.setDate(date.getDate() - (30 - i));
            return date.toLocaleDateString();
        });

        const data = Array.from({length: 30}, (_, i) => {
            return 175.21 + Math.sin(i / 3) * 10 + Math.random() * 5;
        });

        new Chart(ctx, {
            type: 'line',
            data: {
                labels: labels,
                datasets: [{
                    label: 'Preț (USD)',
                    data: data,
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
    }

    // Event listeners
    searchBtn.addEventListener('click', () => {
        const symbol = searchInput.value.trim().toUpperCase();
        if (symbol) {
            createDemoChart();
        }
    });

    searchInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            const symbol = searchInput.value.trim().toUpperCase();
            if (symbol) {
                createDemoChart();
            }
        }
    });

    // Adaugă event listener pentru butonul de istoric
    document.querySelector('.view-history').addEventListener('click', createDemoChart);
}); 