import { NextResponse } from 'next/server';


export const dynamic = 'force-dynamic';
export const revalidate = 0; 

interface OverpassTags {
  name: string;
  'addr:street'?: string;
  'addr:housenumber'?: string;
  'addr:city'?: string;
  [key: string]: string | undefined; 
}

interface OverpassElement {
  id: number;
  lat?: number;
  lon?: number;
  tags?: OverpassTags;
  center?: {
    lat: number;
    lon: number;
  };
}

interface RestaurantResult {
  id: string;
  name: string;
  address: string;
  lat?: number;
  lon?: number;
  distance?: number;
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const lat = searchParams.get('lat');
  const lng = searchParams.get('lng');
  const timestamp = Date.now(); // Cache-busting parameter

  // Validate coordinates
  if (!lat || !lng || isNaN(Number(lat)) || isNaN(Number(lng))) {
    return NextResponse.json(
      { error: 'Invalid coordinates provided' },
      { 
        status: 400,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Cache-Control': 'no-store, max-age=0'
        }
      }
    );
  }

  try {
    // Get location name with timeout and cache-busting
    const nominatimPromise = fetch(
      `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&t=${timestamp}`,
      {
        headers: {
          'User-Agent': 'FlavorFinderPH (your-email@example.com)',
        },
        signal: AbortSignal.timeout(5000),
        cache: 'no-store'
      }
    );

    // Build Overpass query with cache-busting
    const overpassQuery = `
      [out:json];
      (
        node[amenity=restaurant](around:2000,${lat},${lng});
        way[amenity=restaurant](around:2000,${lat},${lng});
      );
      out body;
      >;
      out tags qt;
    `;

    const overpassPromise = fetch(
      `https://overpass-api.de/api/interpreter?data=${encodeURIComponent(overpassQuery)}&t=${timestamp}`,
      {
        signal: AbortSignal.timeout(8000),
        cache: 'no-store'
      }
    );

    // Parallel requests with proper error handling
    const [nominatimResponse, overpassResponse] = await Promise.all([
      nominatimPromise.catch(() => null),
      overpassPromise.catch(() => null)
    ]);

    // Handle failed responses
    if (!nominatimResponse || !overpassResponse) {
      throw new Error('One or more API requests failed');
    }

    const [locationData, restaurants] = await Promise.all([
      nominatimResponse.json().catch(() => ({ address: {} })),
      overpassResponse.json().catch(() => ({ elements: [] }))
    ]);

    
    const results: RestaurantResult[] = [];
    
    for (const place of restaurants.elements) {
      if (!place.tags?.name) continue;

      const addressParts = [
        place.tags['addr:street'],
        place.tags['addr:housenumber'],
        place.tags['addr:city']
      ].filter((part): part is string => !!part);

      results.push({
        id: place.id.toString(),
        name: place.tags.name,
        address: addressParts.length > 0 
          ? addressParts.join(', ') 
          : 'Address not available',
        lat: place.lat ?? place.center?.lat,
        lon: place.lon ?? place.center?.lon
      });
    }

    return NextResponse.json({
      area: locationData.address?.city || 
           locationData.address?.town || 
           'Nearby',
      restaurants: results
    }, {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Cache-Control': 'no-store, max-age=0',
        'CDN-Cache-Control': 'no-store',
        'Vary': 'lat, lng',
        'X-Cache-Bust': timestamp.toString()
      }
    });

  } catch (error) {
    console.error("Error fetching locations:", error);
    return NextResponse.json(
      { 
        error: error instanceof Error ? error.message : 'Failed to fetch locations',
        restaurants: [] // Consistent return shape
      },
      { 
        status: 500,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Cache-Control': 'no-store, max-age=60'
        }
      }
    );
  }
}