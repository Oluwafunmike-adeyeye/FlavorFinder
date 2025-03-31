'use client';
import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useQuery } from '@tanstack/react-query';
import axios from 'axios';
import { FiSearch, FiDollarSign, FiChevronLeft, FiChevronRight } from 'react-icons/fi';
import dynamic from 'next/dynamic';
import Image from 'next/image';
import { BasicErrorBoundary } from '../components/BasicErrorBoundary';

// Type definitions
interface Ingredient {
  name: string;
  measure: string;
}

interface MealAPIResponse {
  idMeal: string;
  strMeal: string;
  strMealThumb: string;
  [key: `strIngredient${number}`]: string | undefined;
  [key: `strMeasure${number}`]: string | undefined;
}

interface Meal extends MealAPIResponse {
  ingredients: Ingredient[];
  estimatedCalories: number;
  estimatedCost: number;
}

// Dynamic imports 
const RecipeAnimation = dynamic(() => import('../components/RecipeAnimation'), { 
  ssr: false,
  loading: () => <div className="h-48 flex items-center justify-center text-purple-500">Loading recipes...</div>
});

const LoadingAnimation = dynamic(() => import('../components/LoadingSpinner'), { 
  ssr: false,
  loading: () => <div className="h-48 flex items-center justify-center text-purple-500">Loading...</div>
});

const ErrorAnimation = dynamic(() => import('../components/ErrorAnimation'), { 
  ssr: false,
  loading: () => <div className="h-48 flex items-center justify-center text-purple-500">Loading error handler...</div>
});

const RecipeSearch = () => {
  const [query, setQuery] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [currentCost, setCurrentCost] = useState(0);
  const [exchangeRate, setExchangeRate] = useState(0.0012);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(6); 
  

  // Fetch exchange rate from our API route
  useEffect(() => {
    const fetchExchangeRate = async () => {
      try {
        const response = await axios.get('/api/exchange');
        setExchangeRate(response.data.rates.USD);
      } catch (err) {
        console.error("Using default exchange rate after error:", err);
      }
    };
    fetchExchangeRate();
  }, []);

  // Fetch recipes through our API route
  const { data: meals, isLoading, error } = useQuery<Meal[]>({
    
    queryKey: ['meals', query],
    queryFn: async () => {
      if (!query.trim()) return [];
      
      const response = await axios.get<MealAPIResponse[]>(`/api/recipes?q=${query}`);
      if (!response.data || response.data.length === 0) return [];

      return response.data.map((meal) => {
        const ingredients: Ingredient[] = [];
        for (let i = 1; i <= 20; i++) {
          const ingredientKey = `strIngredient${i}` as const;
          const measureKey = `strMeasure${i}` as const;
          const ingredient = meal[ingredientKey];
          
          if (ingredient?.trim()) {
            ingredients.push({
              name: ingredient,
              measure: meal[measureKey] || ''
            });
          }
        }

        return {
          ...meal,
          ingredients,
          estimatedCalories: calculateCalories(ingredients),
          estimatedCost: calculateCost(ingredients)
        };
      });
    },
    enabled: query.length > 2,
    retry: 2,
    staleTime: 1000 * 60 * 5 
  });

  // Calculate pagination
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentMeals = meals?.slice(indexOfFirstItem, indexOfLastItem) || [];
  const totalPages = Math.ceil((meals?.length || 0) / itemsPerPage);

  // Change page
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
  }, [query]);

  // Nutrition calculation
  const calculateCalories = (ingredients: Ingredient[]) => {
    const proteinCount = ingredients.filter(i => 
      /chicken|beef|fish|egg|meat/i.test(i.name)
    ).length;
    const carbCount = ingredients.filter(i =>
      /rice|pasta|bread|potato|flour/i.test(i.name)
    ).length;
    const vegCount = ingredients.filter(i =>
      /tomato|onion|pepper|vegetable|leaf/i.test(i.name)
    ).length;

    return Math.round(200 + (proteinCount * 120) + (carbCount * 80) + (vegCount * 30));
  };

  // Cost calculation in Naira
  const calculateCost = (ingredients: Ingredient[]) => {
    const baseCost = 500;
    const proteinCost = ingredients.filter(i => 
      /chicken|beef|fish|egg|meat/i.test(i.name)
    ).length * 350;
    const otherCost = ingredients.length * 150;
    
    return baseCost + proteinCost + otherCost;
  };

  const handleConvert = (cost: number) => {
    setCurrentCost(cost * exchangeRate);
    setShowModal(true);
  };

  return (
    <BasicErrorBoundary>
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

          {!query.trim() ? (
            <div className="mt-10 pt-10">
              <RecipeAnimation />
              <p className="text-center text-purple-600 mt-6 font-semibold">Search for delicious recipes</p>
            </div>
          ) : isLoading ? (
            <LoadingAnimation />
          ) : error ? (
            <ErrorAnimation message={error instanceof Error ? error.message : 'Failed to load recipes'} />
          ) : meals?.length === 0 ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center py-12"
            >
              <p className="text-purple-600 text-lg">No recipes found for &quot;{query}&quot;</p>
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
                        src={meal.strMealThumb?.replace('http://', 'https://')}
                        alt={meal.strMeal || 'Meal image'}
                        width={300}
                        height={200}
                        quality={80} 
                        placeholder="blur" 
                        blurDataURL="data:image/png;base64,..." 
                        onError={(e) => {
                          e.currentTarget.src = '/placeholder.jpg';
                        }}
                        className="w-full h-full object-cover transition-transform duration-300 hover:scale-105"
                        loading="lazy"
                      />
                    </div>
                    <div className="p-4">
                      <h3 className="font-bold text-purple-800 mb-2 truncate" title={meal.strMeal}>
                        {meal.strMeal}
                      </h3>
                      <div className="space-y-2 mb-3">
                        <p className="text-purple-600">
                          <span className="font-semibold">Calories:</span> {meal.estimatedCalories}
                        </p>
                        <p className="text-purple-700 font-bold">
                          <span className="font-semibold">Cost:</span> ₦{meal.estimatedCost}
                        </p>
                      </div>
                      <button
                        onClick={() => handleConvert(meal.estimatedCost)}
                        className="w-full bg-purple-500 hover:bg-purple-600 text-white py-2 rounded-lg flex items-center justify-center transition-colors"
                        aria-label={`Convert ${meal.strMeal} cost to USD`}
                      >
                        <FiDollarSign className="mr-2" />
                        Convert to USD
                      </button>
                    </div>
                  </motion.div>
                ))}
              </div>

              {/* Pagination controls */}
              {totalPages > 1 && (
                <div className="flex justify-center mt-8">
                  <nav className="inline-flex rounded-md shadow">
                    <button
                      onClick={prevPage}
                      disabled={currentPage === 1}
                      className={`px-3 py-1 rounded-l-md border border-purple-300 ${currentPage === 1 ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'bg-white text-purple-600 hover:bg-purple-50'}`}
                    >
                      <FiChevronLeft className="h-5 w-5" />
                    </button>
                    
                    {Array.from({ length: totalPages }, (_, i) => i + 1).map((number) => (
                      <button
                        key={number}
                        onClick={() => paginate(number)}
                        className={`px-4 py-1 border-t border-b border-purple-300 ${currentPage === number ? 'bg-purple-500 text-white' : 'bg-white text-purple-600 hover:bg-purple-50'}`}
                      >
                        {number}
                      </button>
                    ))}
                    
                    <button
                      onClick={nextPage}
                      disabled={currentPage === totalPages}
                      className={`px-3 py-1 rounded-r-md border border-purple-300 ${currentPage === totalPages ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'bg-white text-purple-600 hover:bg-purple-50'}`}
                    >
                      <FiChevronRight className="h-5 w-5" />
                    </button>
                  </nav>
                </div>
              )}
            </>
          )}

          {/* USD Conversion Modal */}
          {showModal && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
            >
              <motion.div
                initial={{ scale: 0.9 }}
                animate={{ scale: 1 }}
                className="bg-white p-6 rounded-lg max-w-sm w-full"
              >
                <h3 className="text-xl font-bold text-purple-800 mb-4">
                  USD Conversion
                </h3>
                <div className="space-y-2">
                  <p className="text-purple-600">${currentCost.toFixed(2)}</p>
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
    </BasicErrorBoundary>
  );
};

export default RecipeSearch;