import { useState } from 'react'
import './App.css'

function App() {
  const [symbol, setSymbol] = useState('')

  return (
    <div className="min-h-screen bg-gradient-to-b from-primary-bg to-secondary-bg p-4">
      <header className="container mx-auto py-6">
        <h1 className="text-4xl font-bold gradient-text">Cosmic Stock Tracker</h1>
      </header>
      <main className="container mx-auto mt-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div className="bg-secondary-bg/50 backdrop-blur-lg rounded-lg p-6 shadow-lg border border-accent-color/20">
            <h2 className="text-2xl font-semibold mb-4 gradient-text">Stock Search</h2>
            <div className="space-y-4">
              <input
                type="text"
                placeholder="Enter stock symbol..."
                className="cosmic-input w-full p-2"
                value={symbol}
                onChange={(e) => setSymbol(e.target.value)}
              />
              <button className="cosmic-button w-full">
                Search
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
        </div>
      </main>
    </div>
  )
}

export default App 