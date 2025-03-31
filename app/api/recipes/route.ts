import { NextResponse } from 'next/server';

export const revalidate = 3600; // Revalidate every hour


export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get('q') || '';

  try {
    const response = await fetch(
      `https://www.themealdb.com/api/json/v1/1/search.php?s=${query}`
    );
    
    if (!response.ok) {
      throw new Error(`API responded with ${response.status}`);
    }
    
    const data = await response.json();
    return NextResponse.json(data.meals || []);
    
  } catch (error) {
    console.error('Recipe fetch error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch recipes' },
      { status: 500 }
    );
  }
}