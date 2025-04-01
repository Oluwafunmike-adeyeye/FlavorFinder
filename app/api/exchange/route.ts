import { NextResponse } from 'next/server';
import axios from 'axios';

export const dynamic = 'force-dynamic';
export const revalidate = 0; // Netlify-specific no-cache directive

interface ExchangeRateResponse {
  rates: {
    USD: number;
    [key: string]: number;
  };
  last_updated: string;
}

export async function GET() {
  const timestamp = Date.now(); // Cache-busting parameter
  
  try {
    const response = await axios.get<ExchangeRateResponse>(
      `https://api.exchangerate-api.com/v4/latest/NGN?t=${timestamp}`,
      {
        timeout: 5000,
        headers: {
          'Accept-Encoding': 'gzip,deflate,compress',
        }
      }
    );

    return NextResponse.json(response.data, {
      headers: {
        'Cache-Control': 'no-store, max-age=0', // Changed from public cache
        'CDN-Cache-Control': 'no-store', // Netlify-specific
        'Vary': 'Accept-Encoding, NGN-USD', // More specific
        'Access-Control-Allow-Origin': '*',
        'X-RateLimit-Reset': response.headers['x-ratelimit-reset'] || ''
      }
    });

  } catch (error: unknown) {
    console.error('Exchange rate fetch error:', error);
    
    const fallbackData: ExchangeRateResponse = {
      rates: { USD: 0.0012 },
      last_updated: new Date().toISOString()
    };
    
    // Different error handling for Axios vs other errors
    if (axios.isAxiosError(error)) {
      return NextResponse.json(
        error.response?.data || fallbackData,
        { 
          status: error.response?.status || 500,
          headers: {
            'Access-Control-Allow-Origin': '*',
            'Cache-Control': 'no-store, max-age=60' // Shorter cache for errors
          }
        }
      );
    }
    
    return NextResponse.json(fallbackData, { 
      status: 500,
      headers: {
        'Cache-Control': 'no-store, max-age=60'
      }
    });
  }
}