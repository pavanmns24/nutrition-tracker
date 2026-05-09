const express = require('express');
const router = express.Router();
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_KEY
);

// Calculate BMI and TDEE
router.post('/calculate', async (req, res) => {
  const { user_id, weight_kg, height_cm, age, gender, activity_level, goal } = req.body;

  try {
    // Calculate BMI
    const heightM = height_cm / 100;
    const bmi = (weight_kg / (heightM * heightM)).toFixed(2);

    // BMI Category
    let category = '';
    if (bmi < 18.5) category = 'Underweight';
    else if (bmi < 24.9) category = 'Normal';
    else if (bmi < 29.9) category = 'Overweight';
    else category = 'Obese';

    // Calculate BMR (Mifflin-St Jeor Formula)
    let bmr = 0;
    if (gender === 'male') {
      bmr = 10 * weight_kg + 6.25 * height_cm - 5 * age + 5;
    } else {
      bmr = 10 * weight_kg + 6.25 * height_cm - 5 * age - 161;
    }

    // Activity multiplier
    const activityMultipliers = {
      sedentary: 1.2,
      light: 1.375,
      moderate: 1.55,
      active: 1.725,
      very_active: 1.9,
    };
    const multiplier = activityMultipliers[activity_level] || 1.2;
    let tdee = Math.round(bmr * multiplier);

    // Adjust TDEE based on goal
    let targetCalories = tdee;
    let dietPlan = '';
    let recommendation = '';

    if (goal === 'bulk') {
      targetCalories = tdee + 500;
      dietPlan = 'Bulk';
      recommendation = 'Eat 500 calories above maintenance to gain muscle mass.';
    } else if (goal === 'cut') {
      targetCalories = tdee - 500;
      dietPlan = 'Cut';
      recommendation = 'Eat 500 calories below maintenance to lose fat.';
    } else {
      dietPlan = 'Maintain';
      recommendation = 'Eat at maintenance calories to keep your current weight.';
    }

    // Macro targets
    const macros = {
      protein_g: Math.round((targetCalories * 0.3) / 4),
      carbs_g: Math.round((targetCalories * 0.4) / 4),
      fats_g: Math.round((targetCalories * 0.3) / 9),
    };

    // Food suggestions based on goal
    const foodSuggestions = {
      bulk: [
        'Rice', 'Chicken breast', 'Eggs', 'Milk', 'Banana',
        'Oats', 'Paneer', 'Peanut butter', 'Sweet potato', 'Dal'
      ],
      cut: [
        'Grilled chicken', 'Broccoli', 'Cucumber', 'Greek yogurt',
        'Salad', 'Fish', 'Egg whites', 'Green tea', 'Sprouts', 'Tofu'
      ],
      maintain: [
        'Brown rice', 'Lentils', 'Fruits', 'Vegetables',
        'Nuts', 'Whole wheat bread', 'Curd', 'Chicken', 'Fish', 'Eggs'
      ],
    };

    const result = {
      bmi: parseFloat(bmi),
      category,
      bmr: Math.round(bmr),
      tdee,
      targetCalories,
      dietPlan,
      recommendation,
      macros,
      foodSuggestions: foodSuggestions[goal] || foodSuggestions.maintain,
    };

    // Save to database
    if (user_id) {
      await supabase.from('bmi_records').insert({
        user_id,
        bmi: parseFloat(bmi),
        category,
        tdee,
        goal,
      });
    }

    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get BMI history
router.get('/history/:user_id', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('bmi_records')
      .select('*')
      .eq('user_id', req.params.user_id)
      .order('recorded_at', { ascending: false });
    if (error) return res.status(400).json({ error: error.message });
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;