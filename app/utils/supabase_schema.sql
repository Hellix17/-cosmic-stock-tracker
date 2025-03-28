-- Tabel pentru informații despre acțiuni
CREATE TABLE IF NOT EXISTS stock_data (
    symbol TEXT PRIMARY KEY,
    data JSONB NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Tabel pentru istoricul prețurilor
CREATE TABLE IF NOT EXISTS stock_history (
    symbol TEXT PRIMARY KEY,
    data JSONB NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Index pentru căutare rapidă
CREATE INDEX IF NOT EXISTS idx_stock_data_symbol ON stock_data(symbol);
CREATE INDEX IF NOT EXISTS idx_stock_history_symbol ON stock_history(symbol);

-- Funcție pentru actualizarea timestamp-ului
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = TIMEZONE('utc'::text, NOW());
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger pentru actualizarea automată a timestamp-ului
CREATE TRIGGER update_stock_data_updated_at
    BEFORE UPDATE ON stock_data
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_stock_history_updated_at
    BEFORE UPDATE ON stock_history
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column(); 