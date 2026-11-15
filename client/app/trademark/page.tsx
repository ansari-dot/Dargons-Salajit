import TrademarkPage, { Trademark } from './TrademarkPage';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

async function fetchTrademarks(): Promise<Trademark[]> {
  try {
    const res = await fetch(`${API_BASE_URL}/trademarks`, {
      cache: 'no-store',
    });
    if (!res.ok) {
      return [];
    }
    const json = await res.json();
    return Array.isArray(json?.data) ? json.data : [];
  } catch (error) {
    return [];
  }
}

export default async function Page() {
  const initialTrademarks = await fetchTrademarks();
  return <TrademarkPage initialTrademarks={initialTrademarks} />;
}
