import { NextResponse } from 'next/server';

// important for Netlify functions
export const dynamic = 'force-dynamic';

interface OverpassElement {
  id: number;
  lat?: number;
  lon?: number;
  tags?: {
    name?: string;
    'addr:street'?: string;
    'addr:housenumber'?: string;
    'addr:city'?: string;
  };
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
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const lat = searchParams.get('lat');
  const lng = searchParams.get('lng');

  // Validate coordinates
  if (!lat || !lng || isNaN(Number(lat)) || isNaN(Number(lng))) {
    return NextResponse.json(
      { error: 'Invalid coordinates provided' },
      { 
        status: 400,
        headers: {
          'Access-Control-Allow-Origin': '*'
        }
      }
    );
  }

  try {
    // Get location name with timeout
    const nominatimPromise = fetch(
      `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`,
      {
        headers: {
          'User-Agent': 'FlavorFinderPH (your-email@example.com)',
        },
        signal: AbortSignal.timeout(5000) 
      }
    );

    // Build Overpass query
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
      `https://overpass-api.de/api/interpreter?data=${encodeURIComponent(overpassQuery)}`,
      {
        signal: AbortSignal.timeout(8000) 
      }
    );

    // Parallel requests with error handling
    const [nominatimResponse, overpassResponse] = await Promise.all([
      nominatimPromise.catch(() => ({})),
      overpassPromise.catch(() => ({ json: () => ({ elements: [] }) }))
    ]);

    const locationData = nominatimResponse instanceof Response 
      ? await nominatimResponse.json() 
      : { address: {} };

    const restaurants = overpassResponse instanceof Response
      ? await overpassResponse.json()
      : { elements: [] };

    // Process results
    const results: RestaurantResult[] = restaurants.elements
      .filter((place: OverpassElement) => place.tags?.name)
      .map((place: OverpassElement) => ({
        id: place.id.toString(),
        name: place.tags?.name || 'Unnamed Restaurant',
        address: [
          place.tags?.['addr:street'],
          place.tags?.['addr:housenumber'],
          place.tags?.['addr:city']
        ].filter(Boolean).join(', '),
        lat: place.lat || place.center?.lat,
        lon: place.lon || place.center?.lon
      }));

    return NextResponse.json({
      area: locationData.address?.city || 
           locationData.address?.town || 
           'Nearby',
      restaurants: results
    }, {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Cache-Control': 'public, s-maxage=3600' 
      }
    });

  } catch (error) {
    console.error("Error fetching locations:", error);
    return NextResponse.json(
      { 
        error: 'Failed to fetch locations',
        fallbackData: [] 
      },
      { 
        status: 500,
        headers: {
          'Access-Control-Allow-Origin': '*'
        }
      }
    );
  }
}