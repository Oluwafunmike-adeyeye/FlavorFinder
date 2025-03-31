import { NextResponse } from 'next/server';
import axios from 'axios';

export const revalidate = 86400; 

export async function GET() {
  try {
    const response = await axios.get(
      'https://api.exchangerate-api.com/v4/latest/NGN'
    );
    return NextResponse.json(response.data);
  } catch (error) {
    console.error('Exchange rate fetch error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch exchange rates' },
      { status: 500 }
    );
  }
}