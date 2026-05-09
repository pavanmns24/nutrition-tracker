const express = require('express');
const router = express.Router();
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_KEY
);

// Register
router.post('/register', async (req, res) => {
  const { email, password, username } = req.body;
  try {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
    });
    if (error) return res.status(400).json({ error: error.message });

    // Update profile with username
    await supabase
      .from('profiles')
      .update({ username })
      .eq('id', data.user.id);

    res.json({ message: 'Registration successful!', user: data.user });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Login
router.post('/login', async (req, res) => {
  const { email, password } = req.body;
  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (error) return res.status(400).json({ error: error.message });
    res.json({ message: 'Login successful!', session: data.session, user: data.user });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Update Profile
router.put('/profile', async (req, res) => {
  const { user_id, age, gender, height_cm, weight_kg, activity_level, goal, username } = req.body;
  try {
    const { data, error } = await supabase
      .from('profiles')
      .upsert({
        id: user_id,
        age, gender, height_cm, weight_kg, activity_level, goal, username
      }, { onConflict: 'id' });
    if (error) return res.status(400).json({ error: error.message });
    res.json({ message: 'Profile saved!', data });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
 

// Get Profile
router.get('/profile/:id', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', req.params.id)
      .single();
    if (error) return res.status(400).json({ error: error.message });
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;