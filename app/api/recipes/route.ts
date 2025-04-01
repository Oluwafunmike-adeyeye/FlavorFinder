import { NextResponse } from 'next/server';


interface Meal {
  idMeal: string;
  strMeal: string;
  strMealThumb: string;
  [key: string]: any; 
}

interface MealDBResponse {
  meals: Meal[] | null;
}

// Force dynamic behavior on Netlify
export const dynamic = 'force-dynamic';
export const revalidate = 0; // Prevent all caching

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get('q') || '';
  const timestamp = Date.now(); 

  try {
    if (!query.trim()) {
      return NextResponse.json([], { 
        status: 200,
        headers: {
          'Cache-Control': 'no-store, max-age=0',
          'CDN-Cache-Control': 'no-store',
          'Vary': 'query'
        }
      });
    }

    const apiUrl = `https://www.themealdb.com/api/json/v1/1/search.php?s=${encodeURIComponent(query)}&t=${timestamp}`;
    
    console.log(`Fetching from MealDB: ${apiUrl}`);
    
    const response = await fetch(apiUrl, {
      cache: 'no-store'
    });
    
    if (!response.ok) {
      throw new Error(`MealDB API error: ${response.status}`);
    }

    const data: MealDBResponse = await response.json();
    
    // Validate and normalize response
    const meals = Array.isArray(data?.meals) ? data.meals : [];
    const results = meals.map((meal: Meal) => ({
      ...meal,
      idMeal: meal.idMeal || '',
      strMeal: meal.strMeal || 'Unnamed Meal',
      strMealThumb: meal.strMealThumb || '/default-meal.jpg'
    }));

    return NextResponse.json(results, {
      headers: {
        'Cache-Control': 'no-store, max-age=0',
        'CDN-Cache-Control': 'no-store',
        'Vary': 'query'
      }
    });
    
  } catch (error) {
    console.error('API Error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch recipes' },
      { 
        status: 500,
        headers: {
          'Cache-Control': 'no-store, max-age=0'
        }
      }
    );
  }
}