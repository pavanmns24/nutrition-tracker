const express = require('express');
const router = express.Router();
const axios = require('axios');

const indianFoods = [
  { name: "Chapati", calories: 104, protein: 3.1, carbs: 18, fats: 2.5, fiber: 1.9 },
  { name: "Dal Tadka", calories: 130, protein: 7.5, carbs: 18, fats: 3.5, fiber: 4 },
  { name: "Rice (cooked)", calories: 130, protein: 2.7, carbs: 28, fats: 0.3, fiber: 0.4 },
  { name: "Idli", calories: 58, protein: 2, carbs: 11, fats: 0.4, fiber: 0.5 },
  { name: "Dosa", calories: 133, protein: 3.4, carbs: 22, fats: 3.7, fiber: 0.9 },
  { name: "Sambar", calories: 55, protein: 3, carbs: 8, fats: 1.2, fiber: 2.5 },
  { name: "Paneer (100g)", calories: 265, protein: 18, carbs: 1.2, fats: 20, fiber: 0 },
  { name: "Chicken Curry", calories: 150, protein: 15, carbs: 5, fats: 8, fiber: 1 },
  { name: "Aloo Sabzi", calories: 110, protein: 2.5, carbs: 18, fats: 3.5, fiber: 2 },
  { name: "Rajma", calories: 140, protein: 8.7, carbs: 22, fats: 0.5, fiber: 6 },
  { name: "Chole", calories: 164, protein: 8.9, carbs: 27, fats: 2.6, fiber: 7 },
  { name: "Poha", calories: 130, protein: 3, carbs: 26, fats: 1.5, fiber: 1.2 },
  { name: "Upma", calories: 145, protein: 3.5, carbs: 24, fats: 4, fiber: 1.5 },
  { name: "Paratha", calories: 200, protein: 4, carbs: 28, fats: 8, fiber: 2 },
  { name: "Biryani (chicken)", calories: 290, protein: 15, carbs: 35, fats: 9, fiber: 1.5 },
  { name: "Puri", calories: 150, protein: 2.5, carbs: 18, fats: 7, fiber: 0.8 },
  { name: "Egg Curry", calories: 175, protein: 12, carbs: 6, fats: 11, fiber: 1 },
  { name: "Palak Paneer", calories: 180, protein: 10, carbs: 8, fats: 12, fiber: 3 },
  { name: "Lassi (sweet)", calories: 150, protein: 5, carbs: 22, fats: 4, fiber: 0 },
  { name: "Curd (100g)", calories: 60, protein: 3.5, carbs: 4.5, fats: 3, fiber: 0 },
  { name: "Banana", calories: 89, protein: 1.1, carbs: 23, fats: 0.3, fiber: 2.6 },
  { name: "Apple", calories: 52, protein: 0.3, carbs: 14, fats: 0.2, fiber: 2.4 },
  { name: "Boiled Egg", calories: 155, protein: 13, carbs: 1.1, fats: 11, fiber: 0 },
  { name: "Milk (100ml)", calories: 61, protein: 3.2, carbs: 4.8, fats: 3.3, fiber: 0 },
  { name: "Oats (cooked)", calories: 71, protein: 2.5, carbs: 12, fats: 1.5, fiber: 1.7 },
  { name: "Peanuts", calories: 567, protein: 26, carbs: 16, fats: 49, fiber: 8.5 },
  { name: "Sweet Potato", calories: 86, protein: 1.6, carbs: 20, fats: 0.1, fiber: 3 },
  { name: "Moong Dal", calories: 105, protein: 7, carbs: 18, fats: 0.4, fiber: 4 },
  { name: "Fish Curry", calories: 160, protein: 18, carbs: 4, fats: 8, fiber: 0.5 },
  { name: "Roti", calories: 104, protein: 3.1, carbs: 18, fats: 2.5, fiber: 1.9 },
];

router.get('/search', async (req, res) => {
  const { q, type } = req.query;
  if (!q) return res.json({ foods: [] });

  try {
    let foods = [];

    if (type === 'indian') {
      const query = q.toLowerCase();
      const results = indianFoods.filter(f => f.name.toLowerCase().includes(query));
      foods = results.length ? results : indianFoods.slice(0, 10);

    } else if (type === 'usda') {
      const r = await axios.get(
        `https://api.nal.usda.gov/fdc/v1/foods/search?query=${q}&api_key=${process.env.USDA_API_KEY}&pageSize=10`
      );
      foods = r.data.foods.map(f => ({
        name:     f.description,
        calories: f.foodNutrients?.find(n => n.nutrientName === 'Energy')?.value || 0,
        protein:  f.foodNutrients?.find(n => n.nutrientName === 'Protein')?.value || 0,
        carbs:    f.foodNutrients?.find(n => n.nutrientName === 'Carbohydrate, by difference')?.value || 0,
        fats:     f.foodNutrients?.find(n => n.nutrientName === 'Total lipid (fat)')?.value || 0,
        fiber:    f.foodNutrients?.find(n => n.nutrientName === 'Fiber, total dietary')?.value || 0,
      }));

    } else if (type === 'natural') {
      const r = await axios.get(
        `https://api.calorieninjas.com/v1/nutrition?query=${q}`,
        { headers: { 'X-Api-Key': process.env.CALORIE_NINJAS_KEY } }
      );
      foods = r.data.items.map(f => ({
        name:     f.name,
        calories: f.calories,
        protein:  f.protein_g,
        carbs:    f.carbohydrates_total_g,
        fats:     f.fat_total_g,
        fiber:    f.fiber_g,
      }));

    } else if (type === 'openfood') {
      const r = await axios.get(
        `https://world.openfoodfacts.org/cgi/search.pl?search_terms=${q}&json=true&page_size=10`
      );
      foods = r.data.products.map(p => ({
        name:     p.product_name || 'Unknown',
        calories: p.nutriments?.['energy-kcal_100g'] || 0,
        protein:  p.nutriments?.proteins_100g || 0,
        carbs:    p.nutriments?.carbohydrates_100g || 0,
        fats:     p.nutriments?.fat_100g || 0,
        fiber:    p.nutriments?.fiber_100g || 0,
      }));
    }

    res.json({ foods });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;