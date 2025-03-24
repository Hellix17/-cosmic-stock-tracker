/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_FINNHUB_API_KEY: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}

declare module 'finnhub' {
  export interface CompanyProfile {
    name: string
    [key: string]: any
  }

  export interface StockCandles {
    s: string
    t: number[]
    c: number[]
    [key: string]: any
  }

  export interface StockDividend {
    date: string
    amount: number
    [key: string]: any
  }

  export class DefaultApi {
    companyProfile2(params: { symbol: string }, callback: (error: any, data: CompanyProfile, response: any) => void): void
    stockCandles(symbol: string, resolution: string, from: number, to: number, callback: (error: any, data: StockCandles, response: any) => void): void
    stockDividends(symbol: string, from: string, to: string, callback: (error: any, data: StockDividend[], response: any) => void): void
  }

  export class ApiClient {
    static instance: {
      authentications: {
        'api_key': {
          apiKey: string
        }
      }
    }
  }

  export default {
    DefaultApi,
    ApiClient
  }
} 