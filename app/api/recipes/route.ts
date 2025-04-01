import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic'; // This alone should handle Netlify caching

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get('q') || '';

  try {
    // Simple empty query check
    if (!query.trim()) return NextResponse.json([]);

    const apiUrl = `https://www.themealdb.com/api/json/v1/1/search.php?s=${encodeURIComponent(query)}`;
    
    const response = await fetch(apiUrl, { cache: 'no-store' });
    
    if (!response.ok) throw new Error('API request failed');

    const data = await response.json();
    const meals = data?.meals || [];
    
    return NextResponse.json(meals);

  } catch (error) {
    console.error('Error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch recipes' },
      { status: 500 }
    );
  }
}