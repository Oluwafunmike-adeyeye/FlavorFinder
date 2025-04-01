import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get('q') || '';
  const timestamp = Date.now();

  try {
    const apiUrl = `https://www.themealdb.com/api/json/v1/1/search.php?s=${encodeURIComponent(query)}&t=${timestamp}`;
    
    const response = await fetch(apiUrl, {
      cache: 'no-store',
      headers: { 'User-Agent': 'RecipeApp' }
    });
    
    if (!response.ok) throw new Error('API failed');
    
    const data = await response.json();
    const meals = data?.meals || [];
    
    return NextResponse.json(meals, {
      headers: {
        'Cache-Control': 'no-store',
        'Netlify-CDN-Cache-Control': 'no-store'
      }
    });

  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to fetch recipes' },
      { status: 500, headers: { 'Cache-Control': 'no-store' } }
    );
  }
}