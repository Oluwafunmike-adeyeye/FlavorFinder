import { NextResponse } from 'next/server';
import axios from 'axios';

export const dynamic = 'force-dynamic';

interface ExchangeRateResponse {
  rates: {
    USD: number;
    [key: string]: number;
  };
  last_updated: string;
}

export async function GET() {
  try {
    const response = await axios.get<ExchangeRateResponse>(
      'https://api.exchangerate-api.com/v4/latest/NGN',
      {
        timeout: 5000,
        headers: {
          'Accept-Encoding': 'gzip,deflate,compress',
        }
      }
    );

    return NextResponse.json(response.data, {
      headers: {
        'Cache-Control': 'public, s-maxage=86400',
        'CDN-Cache-Control': 'public, s-maxage=86400',
        'Vary': 'Accept-Encoding',
        'Access-Control-Allow-Origin': '*'
      }
    });

  } catch (error: unknown) {
    console.error('Exchange rate fetch error:', error);
    
    const fallbackData: ExchangeRateResponse = {
      rates: { USD: 0.0012 },
      last_updated: new Date().toISOString()
    };
    
    if (axios.isAxiosError(error)) {
      return NextResponse.json(
        error.response?.data || fallbackData,
        { 
          status: error.response?.status || 500,
          headers: {
            'Access-Control-Allow-Origin': '*',
            'Cache-Control': 'public, s-maxage=3600'
          }
        }
      );
    }
    
    return NextResponse.json(fallbackData, { status: 500 });
  }
}