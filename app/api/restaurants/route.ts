import { NextResponse } from 'next/server';

export const revalidate = 3600;

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const lat = searchParams.get('lat');
  const lng = searchParams.get('lng');

  // Validate coordinates
  if (!lat || !lng || isNaN(Number(lat)) || isNaN(Number(lng))) {
    return NextResponse.json(
      { error: 'Invalid coordinates provided' },
      { status: 400 }
    );
  }

  try {
    const nominatimResponse = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`,
      {
        headers: {
          'User-Agent': 'YourAppName (your@email.com)'
        }
      }
    );
    const locationData = await nominatimResponse.json();

    // Find restaurants
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

    const overpassResponse = await fetch(
      `https://overpass-api.de/api/interpreter?data=${encodeURIComponent(overpassQuery)}`
    );
    const restaurants = await overpassResponse.json();

    const results = restaurants.elements
      .filter((place: any) => place.tags?.name)
      .map((place: any) => ({
        id: place.id.toString(),
        name: place.tags.name,
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
    });

  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to fetch locations' },
      { status: 500 }
    );
  }
}