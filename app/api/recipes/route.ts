import { NextResponse } from 'next/server';

// Important for Netlify deployment
export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get('q') || '';

  try {
    // proper error handling for empty queries
    if (!query.trim()) {
      return NextResponse.json([], { status: 200 });
    }

    const apiUrl = `https://www.themealdb.com/api/json/v1/1/search.php?s=${encodeURIComponent(query)}`;
    
    const response = await fetch(apiUrl, {
      next: { revalidate: 3600 } 
    });
    
    if (!response.ok) {
      throw new Error(`MealDB API error: ${response.status}`);
    }

    const data = await response.json();
    
    // headers for CORS and caching
    return NextResponse.json(data.meals || [], {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Cache-Control': 'public, max-age=3600, s-maxage=3600'
      }
    });
    
  } catch (error) {
    console.error('API Error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch recipes' },
      { 
        status: 500,
        headers: {
          'Access-Control-Allow-Origin': '*'
        }
      }
    );
  }
}