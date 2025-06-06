import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

interface OverpassElement {
  id: number;
  lat?: number;
  lon?: number;
  center?: {
    lat: number;
    lon: number;
  };
  tags?: {
    name?: string;
    'addr:street'?: string;
    'addr:housenumber'?: string;
    'addr:city'?: string;
    [key: string]: string | undefined;
  };
}

interface Restaurant {
  id: string;
  name: string;
  address: string;
  lat?: number;
  lng?: number;
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const lat = searchParams.get('lat');
  const lng = searchParams.get('lng');

  // Basic coordinate validation
  if (!lat || !lng || isNaN(+lat) || isNaN(+lng)) {
    return NextResponse.json(
      { error: 'Invalid coordinates' },
      { status: 400 }
    );
  }

  try {
    // Fetch restaurants from Overpass
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

    const response = await fetch(
      `https://overpass-api.de/api/interpreter?data=${encodeURIComponent(overpassQuery)}`,
      { cache: 'no-store' }
    );

    const data = await response.json();
    
    // Format results with proper typing
    const restaurants: Restaurant[] = data.elements?.map((place: OverpassElement) => ({
      id: place.id.toString(),
      name: place.tags?.name || 'Unnamed Restaurant',
      address: [
        place.tags?.['addr:street'],
        place.tags?.['addr:housenumber'],
        place.tags?.['addr:city']
      ].filter(Boolean).join(', ') || 'Address not available',
      lat: place.lat ?? place.center?.lat,
      lng: place.lon ?? place.center?.lon
    })) || [];

    return NextResponse.json({
      area: 'Nearby',
      restaurants
    }, {
      headers: {
        'Cache-Control': 'no-store'
      }
    });

  } catch (error) {
    console.error('Error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch restaurants', restaurants: [] },
      { status: 500 }
    );
  }
}