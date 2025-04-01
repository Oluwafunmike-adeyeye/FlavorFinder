'use client';
import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useQuery } from '@tanstack/react-query';
import axios from 'axios';
import { FiSearch, FiDollarSign, FiChevronLeft, FiChevronRight } from 'react-icons/fi';
import dynamic from 'next/dynamic';
import Image from 'next/image';

// Types
interface Ingredient {
  name: string;
  measure: string;
}

interface Meal {
  idMeal: string;
  strMeal: string;
  strMealThumb: string;
  ingredients: Ingredient[];
  estimatedCalories: number;
  estimatedCost: number;
}

// Dynamic imports
const RecipeAnimation = dynamic(() => import('../components/RecipeAnimation'), {
  loading: () => <div className="h-48 flex items-center justify-center text-purple-500">Loading recipes...</div>
});

const LoadingAnimation = dynamic(() => import('../components/LoadingSpinner'), {
  loading: () => <div className="h-48 flex items-center justify-center text-purple-500">Loading...</div>
});

const ErrorAnimation = dynamic(() => import('../components/ErrorAnimation'), {
  loading: () => <div className="h-48 flex items-center justify-center text-purple-500">Loading error handler...</div>
});

const RecipeSearch = () => {
  const [query, setQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [currentCost, setCurrentCost] = useState(0);
  const [exchangeRate, setExchangeRate] = useState(0.0012);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 6;

  // Debounce search input
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(query);
      setCurrentPage(1); 
    }, 500);

    return () => clearTimeout(timer);
  }, [query]);

  // Fetch exchange rate
  useEffect(() => {
    const fetchExchangeRate = async () => {
      try {
        const response = await axios.get('/api/exchange');
        if (response.data?.rates?.USD) {
          setExchangeRate(response.data.rates.USD);
        }
      } catch (err) {
        console.error("Using default exchange rate:", err);
      }
    };
    fetchExchangeRate();
  }, []);

  // Fetch recipes
  const { data: meals, isLoading, isError, error } = useQuery<Meal[]>({
    queryKey: ['meals', debouncedQuery],
    queryFn: async () => {
      if (!debouncedQuery.trim()) return [];
      
      try {
        const response = await axios.get(`/api/recipes?q=${encodeURIComponent(debouncedQuery)}`, {
          headers: {
            'Cache-Control': 'no-store'
          }
        });

        if (!Array.isArray(response.data)) {
          throw new Error('Invalid response format');
        }

        // Transform API response
        return response.data.map((meal: any) => {
          const ingredients: Ingredient[] = [];
          
          // Extract ingredients (1-20)
          for (let i = 1; i <= 20; i++) {
            const ingredient = meal[`strIngredient${i}`];
            if (ingredient?.trim()) {
              ingredients.push({
                name: ingredient,
                measure: meal[`strMeasure${i}`] || ''
              });
            }
          }

          return {
            idMeal: meal.idMeal,
            strMeal: meal.strMeal,
            strMealThumb: meal.strMealThumb || '/default-meal.jpg',
            ingredients,
            estimatedCalories: calculateCalories(ingredients),
            estimatedCost: calculateCost(ingredients)
          };
        });
      } catch (err) {
        console.error('Error fetching recipes:', err);
        throw err;
      }
    },
    retry: 1,
    staleTime: 0,
    enabled: debouncedQuery.length > 2
  });

  // Pagination
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentMeals = meals?.slice(indexOfFirstItem, indexOfLastItem) || [];
  const totalPages = Math.ceil((meals?.length || 0) / itemsPerPage);

  // Helper functions
  const calculateCalories = (ingredients: Ingredient[]): number => {
    const proteinCount = ingredients.filter(i => 
      /chicken|beef|fish|egg|meat|pork/i.test(i.name.toLowerCase())
    ).length;
    const carbCount = ingredients.filter(i =>
      /rice|pasta|bread|potato|flour|noodle/i.test(i.name.toLowerCase())
    ).length;
    const vegCount = ingredients.filter(i =>
      /tomato|onion|pepper|vegetable|leaf|garlic|carrot/i.test(i.name.toLowerCase())
    ).length;

    return Math.round(200 + (proteinCount * 120) + (carbCount * 80) + (vegCount * 30));
  };

  const calculateCost = (ingredients: Ingredient[]): number => {
    const baseCost = 500;
    const proteinCost = ingredients.filter(i => 
      /chicken|beef|fish|egg|meat|pork/i.test(i.name.toLowerCase())
    ).length * 350;
    const otherCost = ingredients.length * 150;
    
    return baseCost + proteinCost + otherCost;
  };

  const handleConvert = (cost: number) => {
    setCurrentCost(cost * exchangeRate);
    setShowModal(true);
  };

  return (
    <div className="min-h-screen bg-purple-50 p-4 md:p-8">
      <div className="max-w-6xl mx-auto">
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h1 className="text-4xl font-bold text-purple-800 mb-4">Recipe Finder</h1>
          <div className="relative">
            <input
              type="text"
              placeholder="Search recipes..."
              className="w-full p-4 rounded-lg shadow-lg border border-purple-200 focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              aria-label="Search recipes"
            />
            <FiSearch className="absolute right-4 top-4 text-purple-500 text-xl" />
          </div>
        </motion.div>

        {!debouncedQuery ? (
          <div className="mt-10 pt-10">
            <RecipeAnimation />
            <p className="text-center text-purple-600 mt-6 text-xl font-semibold">
              Search for delicious recipes
            </p>
          </div>
        ) : isLoading ? (
          <LoadingAnimation />
        ) : isError ? (
          <ErrorAnimation 
            message={error instanceof Error ? error.message : 'Failed to load recipes'}
            onRetry={() => window.location.reload()}
          />
        ) : meals?.length === 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-12"
          >
            <p className="text-purple-600 text-lg">
              No recipes found for "{debouncedQuery}". Try a different search term.
            </p>
          </motion.div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
              {currentMeals.map((meal) => (
                <motion.div
                  key={meal.idMeal}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  whileHover={{ scale: 1.03 }}
                  transition={{ type: "spring", stiffness: 400, damping: 10 }}
                  className="bg-white rounded-xl shadow-md overflow-hidden hover:shadow-xl transition-all"
                >
                  <div className="relative h-48 overflow-hidden">
                    <Image
                      src={meal.strMealThumb}
                      alt={meal.strMeal}
                      fill
                      className="object-cover transition-transform duration-300 hover:scale-105"
                      sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                      priority={false}
                      onError={(e) => {
                        const target = e.currentTarget as HTMLImageElement;
                        target.onerror = null;
                        target.src = '/default-meal.jpg';
                      }}
                    />
                  </div>
                  <div className="p-4">
                    <h3 className="font-bold text-purple-800 mb-2 truncate">
                      {meal.strMeal}
                    </h3>
                    <div className="space-y-2 mb-3">
                      <p className="text-purple-600">
                        <span className="font-semibold">Calories:</span> ~{meal.estimatedCalories}
                      </p>
                      <p className="text-purple-700 font-bold">
                        <span className="font-semibold">Cost:</span> ₦{meal.estimatedCost.toLocaleString()}
                      </p>
                    </div>
                    <button
                      onClick={() => handleConvert(meal.estimatedCost)}
                      className="w-full bg-purple-500 hover:bg-purple-600 text-white py-2 rounded-lg flex items-center justify-center transition-colors"
                    >
                      <FiDollarSign className="mr-2" />
                      Convert to USD
                    </button>
                  </div>
                </motion.div>
              ))}
            </div>

            {totalPages > 1 && (
              <div className="flex justify-center mt-8">
                <nav className="inline-flex rounded-md shadow">
                  <button
                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                    className={`px-3 py-1 rounded-l-md border ${currentPage === 1 ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'bg-white text-purple-600 hover:bg-purple-50'}`}
                  >
                    <FiChevronLeft className="h-5 w-5" />
                  </button>
                  
                  {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                    let pageNum;
                    if (totalPages <= 5) {
                      pageNum = i + 1;
                    } else if (currentPage <= 3) {
                      pageNum = i + 1;
                    } else if (currentPage >= totalPages - 2) {
                      pageNum = totalPages - 4 + i;
                    } else {
                      pageNum = currentPage - 2 + i;
                    }
                    
                    return (
                      <button
                        key={pageNum}
                        onClick={() => setCurrentPage(pageNum)}
                        className={`px-4 py-1 border-t border-b ${currentPage === pageNum ? 'bg-purple-500 text-white' : 'bg-white text-purple-600 hover:bg-purple-50'}`}
                      >
                        {pageNum}
                      </button>
                    );
                  })}
                  
                  <button
                    onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                    disabled={currentPage === totalPages}
                    className={`px-3 py-1 rounded-r-md border ${currentPage === totalPages ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'bg-white text-purple-600 hover:bg-purple-50'}`}
                  >
                    <FiChevronRight className="h-5 w-5" />
                  </button>
                </nav>
              </div>
            )}
          </>
        )}

        {/* Conversion Modal */}
        {showModal && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            onClick={() => setShowModal(false)}
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
          >
            <motion.div
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white p-6 rounded-lg max-w-sm w-full"
            >
              <h3 className="text-xl font-bold text-purple-800 mb-4">
                USD Conversion
              </h3>
              <div className="space-y-2">
                <p className="text-2xl font-semibold text-purple-600">
                  ${currentCost.toFixed(2)}
                </p>
                <p className="text-sm text-purple-400">
                  Exchange rate: $1 ≈ ₦{(1/exchangeRate).toFixed(2)}
                </p>
              </div>
              <button
                onClick={() => setShowModal(false)}
                className="mt-6 w-full bg-purple-500 hover:bg-purple-600 text-white py-2 rounded-lg transition-colors"
              >
                Close
              </button>
            </motion.div>
          </motion.div>
        )}
      </div>
    </div>
  );
};

export default RecipeSearch;