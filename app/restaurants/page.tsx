'use client';
import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { FiMapPin, FiCompass, FiLoader, FiNavigation, FiAlertTriangle, FiRefreshCw, FiStar, FiChevronLeft, FiChevronRight } from 'react-icons/fi';
import dynamic from 'next/dynamic';
import { BasicErrorBoundary } from '../../components/BasicErrorBoundary';

interface Coordinates {
  lat: number;
  lon: number;
}

interface Restaurant {
  id: string;
  name: string;
  address: string;
  distance?: number;
  coordinates?: Coordinates;
  rating?: number;
  lat?: number;
  lon?: number;
}

interface RestaurantAPIResponse {
  restaurants: Restaurant[];
  area?: string;
}

const LocationAnimation = dynamic(() => import('../../components/LocationAnimation'), { 
  ssr: false,
  loading: () => (
    <div className="w-[60px] h-[60px] flex items-center justify-center">
      <div className="animate-pulse text-purple-500">...</div>
    </div>
  )
});

function RestaurantFinderComponent() {
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [location, setLocation] = useState('');
  const [loading, setLoading] = useState(true);
  const [geolocationLoading, setGeolocationLoading] = useState(false);
  const [error, setError] = useState('');
  const [userLocation, setUserLocation] = useState<Coordinates>();
  const [maxDistance, setMaxDistance] = useState<number>(2000);
  const [showAnimation, setShowAnimation] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [restaurantsPerPage] = useState(6); 

  const calculateDistance = useCallback((lat: number, lon: number) => {
    if (!userLocation) return undefined;
    
    const toRad = (x: number) => x * Math.PI / 180;
    const R = 6371;
    
    const dLat = toRad(lat - userLocation.lat);
    const dLon = toRad(lon - userLocation.lon);
    
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(toRad(userLocation.lat)) * 
      Math.cos(toRad(lat)) * 
      Math.sin(dLon/2) * Math.sin(dLon/2);
      
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return Math.round(R * c * 1000);
  }, [userLocation]);

  const fetchRestaurants = useCallback(async (lat: number, lon: number, isFallback = false) => {
    setLoading(true);
    setError('');
    
    try {
      const response = await fetch(`/api/restaurants?lat=${lat}&lon=${lon}`);
      
      if (!response.ok) {
        let friendlyError = 'Could not load restaurants';
        if (response.status === 400) {
          friendlyError = 'Invalid location data';
        } else if (response.status === 500) {
          friendlyError = 'Service unavailable';
        }
        throw new Error(friendlyError);
      }
      
      const data: RestaurantAPIResponse = await response.json();
      
      const restaurantsWithDistance = data.restaurants
        .map((r) => ({
          ...r,
          distance: r.lat && r.lon ? calculateDistance(r.lat, r.lon) : undefined,
          rating: Math.floor(Math.random() * 5) + 1,
          coordinates: { lat: r.lat || 0, lon: r.lon || 0 }
        }))
        .sort((a, b) => 
          (a.distance || Infinity) - (b.distance || Infinity)
        );
      
      setLocation(isFallback ? `Default Location (${data.area || 'Lagos'})` : data.area || 'Nearby');
      setRestaurants(restaurantsWithDistance);
      setUserLocation({ lat, lon });
    } catch (err) {
      console.error('Fetch error:', err);
      const errorMessage = err instanceof Error 
        ? err.message 
        : 'Failed to load restaurants';
      
      setError(errorMessage);
      
      if (!isFallback) {
        fetchRestaurants(6.5244, 3.3792, true);
      }
    } finally {
      setLoading(false);
      setTimeout(() => setShowAnimation(false), 3000);
    }
  }, [calculateDistance]);

  const filteredRestaurants = useCallback(() => {
    const filtered = restaurants.filter(r => !r.distance || r.distance <= maxDistance);
    const indexOfLastRestaurant = currentPage * restaurantsPerPage;
    const indexOfFirstRestaurant = indexOfLastRestaurant - restaurantsPerPage;
    return {
      currentRestaurants: filtered.slice(indexOfFirstRestaurant, indexOfLastRestaurant),
      totalRestaurants: filtered.length
    };
  }, [restaurants, maxDistance, currentPage, restaurantsPerPage]);

  const totalPages = Math.ceil(filteredRestaurants().totalRestaurants / restaurantsPerPage);

  const paginate = (pageNumber: number) => setCurrentPage(pageNumber);
  const nextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage(currentPage + 1);
    }
  };
  const prevPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
    }
  };

  useEffect(() => {
    setCurrentPage(1);
  }, [maxDistance]);

  const handleRetry = useCallback(() => {
    setCurrentPage(1);
    setLoading(true);
    setGeolocationLoading(true);
    setError('');
    setShowAnimation(true);

    if (!navigator.geolocation) {
      setError('Geolocation not supported - using default location');
      fetchRestaurants(6.5244, 3.3792, true);
      setGeolocationLoading(false);
      return;
    }

    const onSuccess = (position: GeolocationPosition) => {
      setGeolocationLoading(false);
      fetchRestaurants(
        position.coords.latitude, 
        position.coords.longitude
      );
    };

    const onError = (err: GeolocationPositionError) => {
      setGeolocationLoading(false);
      let errorMessage = 'Could not determine your location';
      
      switch(err.code) {
        case 1: errorMessage = 'Please enable location permissions'; break;
        case 2: errorMessage = 'Location unavailable - check connection'; break;
        case 3: errorMessage = 'Location request timed out'; break;
      }

      setError(errorMessage);
      fetchRestaurants(6.5244, 3.3792, true);
    };

    navigator.geolocation.getCurrentPosition(
      onSuccess,
      onError,
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  }, [fetchRestaurants]);

  const useDefaultLocation = useCallback(() => {
    setCurrentPage(1);
    setError('');
    setLoading(true);
    fetchRestaurants(6.5244, 3.3792, true);
  }, [fetchRestaurants]);

  useEffect(() => {
    handleRetry();
  }, [handleRetry]);

  const { currentRestaurants, totalRestaurants } = filteredRestaurants();

  return (
    <div className="min-h-screen bg-purple-50 p-4 md:p-8">
      <div className="max-w-4xl mx-auto">
        <motion.header 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="flex items-center gap-3 mb-4">
            <FiCompass className="text-purple-600 text-3xl" />
            <h1 className="text-3xl md:text-4xl font-bold text-purple-800">
              {location ? `${location} Restaurants` : 'Finding Restaurants...'}
            </h1>
            <div className="ml-auto flex items-center gap-2">
              <button 
                onClick={handleRetry}
                className="p-2 text-purple-600 hover:text-purple-800 transition-colors"
                disabled={loading || geolocationLoading}
                aria-label="Refresh restaurants"
              >
                <FiRefreshCw className={geolocationLoading ? 'animate-spin' : ''} />
              </button>
              {showAnimation && <LocationAnimation size={100} />}
            </div>
          </div>
          
          {error && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="bg-red-100 text-red-700 p-4 rounded-lg flex items-start gap-3 mb-4"
            >
              <FiAlertTriangle className="flex-shrink-0 mt-0.5" />
              <div>
                <p className="mb-2">
                  {error.includes('Invalid location') ? (
                    "No Restaurant location found"
                  ) : error.includes('unavailable') ? (
                    "Service unavailable - try again later"
                  ) : (
                    error
                  )}
                </p>
              </div>
            </motion.div>
          )}

          <div className="mt-6 flex flex-col sm:flex-row sm:items-center gap-4">
            <label className="text-purple-700 flex items-center gap-2">
              Max distance:
              <select 
                value={maxDistance}
                onChange={(e) => setMaxDistance(Number(e.target.value))}
                className="bg-white border border-purple-200 rounded px-3 py-1"
                disabled={loading}
                aria-label="Select maximum distance"
              >
                <option value={500}>500m</option>
                <option value={1000}>1km</option>
                <option value={2000}>2km</option>
                <option value={5000}>5km</option>
              </select>
            </label>
            {totalRestaurants > 0 && (
              <span className="text-purple-600">
                Showing {currentRestaurants.length} of {totalRestaurants} restaurants
              </span>
            )}
          </div>
        </motion.header>

        {loading ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex flex-col items-center justify-center py-12"
          >
            <FiLoader className="animate-spin text-purple-500 text-4xl mb-4" />
            <p className="text-purple-700">
              {geolocationLoading ? 'Detecting your location...' : 'Loading restaurants...'}
            </p>
          </motion.div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
              {currentRestaurants.length > 0 ? (
                currentRestaurants.map((restaurant) => (
                  <motion.div
                    key={`${restaurant.id}-${restaurant.distance}`}
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.3 }}
                    whileHover={{ scale: 1.02 }}
                    className="bg-white rounded-xl shadow-md hover:shadow-lg transition-all p-5 border-l-4 border-purple-500"
                  >
                    <div className="flex items-start gap-3">
                      <FiMapPin className="text-purple-500 mt-1 flex-shrink-0" />
                      <div className="flex-1">
                        <div className="flex justify-between items-start">
                          <h2 className="text-lg md:text-xl font-semibold text-purple-800 mb-1">
                            {restaurant.name}
                          </h2>
                          {restaurant.rating && (
                            <div className="flex items-center text-yellow-500">
                              <FiStar className="mr-1" />
                              {restaurant.rating}
                            </div>
                          )}
                        </div>
                        <p className="text-purple-600 mb-2">
                          {restaurant.address || 'Address not available'}
                        </p>
                        {restaurant.distance && (
                          <div className="flex items-center text-purple-500 text-sm">
                            <FiNavigation className="mr-1" />
                            {restaurant.distance < 1000 
                              ? `${restaurant.distance}m away` 
                              : `${(restaurant.distance/1000).toFixed(1)}km away`}
                          </div>
                        )}
                      </div>
                    </div>
                  </motion.div>
                ))
              ) : (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="col-span-2 text-center pt-6 pb-12"
                >
                  <p className="text-purple-700 text-lg mb-6">
                    No restaurants found within {maxDistance}m
                  </p>
                  <div className="flex gap-3 justify-center mt-8">
                    <button
                      onClick={handleRetry}
                      className="bg-purple-500 hover:bg-purple-600 text-white px-6 py-2 rounded-lg inline-flex items-center transition-colors"
                      disabled={loading}
                      aria-label="Try again"
                    >
                      <FiCompass className="mr-2" />
                      Try Again
                    </button>
                    <button
                      onClick={useDefaultLocation}
                      className="bg-white text-purple-600 border border-purple-300 hover:bg-purple-50 px-6 py-2 rounded-lg inline-flex items-center transition-colors"
                      disabled={loading}
                      aria-label="Use default location"
                    >
                      <FiMapPin className="mr-2" />
                      Default Location
                    </button>
                  </div>
                </motion.div>
              )}
            </div>

            {totalPages > 1 && (
              <div className="flex justify-center mt-8">
                <nav className="inline-flex items-center space-x-1">
                  <button
                    onClick={prevPage}
                    disabled={currentPage === 1}
                    className={`p-2 rounded-md ${currentPage === 1 ? 'text-gray-400 cursor-not-allowed' : 'text-purple-600 hover:bg-purple-100'}`}
                    aria-label="Previous page"
                  >
                    <FiChevronLeft className="w-5 h-5" />
                  </button>

                  {Array.from({ length: totalPages }, (_, i) => i + 1).map((number) => (
                    <button
                      key={number}
                      onClick={() => paginate(number)}
                      className={`px-3 py-1 rounded-md ${currentPage === number ? 'bg-purple-600 text-white' : 'text-purple-600 hover:bg-purple-100'}`}
                      aria-label={`Go to page ${number}`}
                    >
                      {number}
                    </button>
                  ))}

                  <button
                    onClick={nextPage}
                    disabled={currentPage === totalPages}
                    className={`p-2 rounded-md ${currentPage === totalPages ? 'text-gray-400 cursor-not-allowed' : 'text-purple-600 hover:bg-purple-100'}`}
                    aria-label="Next page"
                  >
                    <FiChevronRight className="w-5 h-5" />
                  </button>
                </nav>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

export default function RestaurantFinder() {
  return (
    <BasicErrorBoundary>
      <RestaurantFinderComponent />
    </BasicErrorBoundary>
  );
}