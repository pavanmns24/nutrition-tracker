const express = require('express');
const router = express.Router();
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_KEY
);

// Add food log
router.post('/add', async (req, res) => {
  const { user_id, food_name, quantity_grams, calories, protein, carbs, fats, fiber } = req.body;
  try {
    const { data, error } = await supabase.from('food_logs').insert({
      user_id,
      food_name,
      quantity_grams,
      calories: (calories * quantity_grams) / 100,
      protein: (protein * quantity_grams) / 100,
      carbs: (carbs * quantity_grams) / 100,
      fats: (fats * quantity_grams) / 100,
      fiber: (fiber * quantity_grams) / 100,
    });
    if (error) return res.status(400).json({ error: error.message });
    res.json({ message: 'Food logged successfully!', data });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get today's logs
router.get('/today/:user_id', async (req, res) => {
  try {
    const today = new Date().toISOString().split('T')[0];
    const { data, error } = await supabase
      .from('food_logs')
      .select('*')
      .eq('user_id', req.params.user_id)
      .gte('logged_at', `${today}T00:00:00`)
      .lte('logged_at', `${today}T23:59:59`);
    if (error) return res.status(400).json({ error: error.message });

    // Calculate totals
    const totals = data.reduce((acc, log) => ({
      calories: acc.calories + log.calories,
      protein: acc.protein + log.protein,
      carbs: acc.carbs + log.carbs,
      fats: acc.fats + log.fats,
      fiber: acc.fiber + log.fiber,
    }), { calories: 0, protein: 0, carbs: 0, fats: 0, fiber: 0 });

    res.json({ logs: data, totals });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get logs by date
router.get('/date/:user_id/:date', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('food_logs')
      .select('*')
      .eq('user_id', req.params.user_id)
      .gte('logged_at', `${req.params.date}T00:00:00`)
      .lte('logged_at', `${req.params.date}T23:59:59`);
    if (error) return res.status(400).json({ error: error.message });
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Delete food log
router.delete('/delete/:id', async (req, res) => {
  try {
    const { error } = await supabase
      .from('food_logs')
      .delete()
      .eq('id', req.params.id);
    if (error) return res.status(400).json({ error: error.message });
    res.json({ message: 'Log deleted successfully!' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
// Get weekly logs + report
router.get('/weekly/:user_id', async (req, res) => {
  try {
    const today = new Date();
    const weekAgo = new Date();
    weekAgo.setDate(today.getDate() - 6);
 
    const { data, error } = await supabase
      .from('food_logs')
      .select('*')
      .eq('user_id', req.params.user_id)
      .gte('logged_at', weekAgo.toISOString())
      .lte('logged_at', today.toISOString())
      .order('logged_at', { ascending: true });
 
    if (error) return res.status(400).json({ error: error.message });
 
    // Group by day
    const days = {};
    data.forEach(log => {
      const day = log.logged_at.split('T')[0];
      if (!days[day]) {
        days[day] = { calories: 0, protein: 0, carbs: 0, fats: 0, logs: [] };
      }
      days[day].calories += log.calories;
      days[day].protein += log.protein;
      days[day].carbs += log.carbs;
      days[day].fats += log.fats;
      days[day].logs.push(log);
    });
 
    // Build 7 day report
    const report = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(today.getDate() - i);
      const key = d.toISOString().split('T')[0];
      const dayName = d.toLocaleDateString('en-IN', { weekday: 'short', month: 'short', day: 'numeric' });
      report.push({
        date: key,
        dayName,
        calories: Math.round(days[key]?.calories || 0),
        protein: Math.round(days[key]?.protein || 0),
        carbs: Math.round(days[key]?.carbs || 0),
        fats: Math.round(days[key]?.fats || 0),
        logged: !!days[key],
      });
    }
 
    // Summary stats
    const loggedDays = report.filter(d => d.logged);
    const avgCalories = loggedDays.length
      ? Math.round(loggedDays.reduce((a, b) => a + b.calories, 0) / loggedDays.length)
      : 0;
    const avgProtein = loggedDays.length
      ? Math.round(loggedDays.reduce((a, b) => a + b.protein, 0) / loggedDays.length)
      : 0;
    const bestDay = loggedDays.sort((a, b) => b.calories - a.calories)[0];
    const worstDay = loggedDays.sort((a, b) => a.calories - b.calories)[0];
 
    res.json({ report, avgCalories, avgProtein, bestDay, worstDay });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
 
module.exports = router;