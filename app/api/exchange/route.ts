import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic'; 

export async function GET() {
  try {
    const response = await fetch('https://api.exchangerate-api.com/v4/latest/NGN', {
      cache: 'no-store'
    });

    if (!response.ok) throw new Error('Failed to fetch rates');

    const data = await response.json();
    
    return NextResponse.json(data, {
      headers: {
        'Cache-Control': 'no-store',
        'Access-Control-Allow-Origin': '*'
      }
    });

  } catch (error) {
    console.error('Exchange rate error:', error);
    
    return NextResponse.json(
      { rates: { USD: 0.0012 }, last_updated: new Date().toISOString() },
      { status: 500, headers: { 'Cache-Control': 'no-store' } }
    );
  }
}