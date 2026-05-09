const express = require('express');
const cors = require('cors');
require('dotenv').config();

const authRoutes = require('./routes/auth');
const foodRoutes = require('./routes/food');
const bmiRoutes = require('./routes/bmi');
const logsRoutes = require('./routes/logs');

const app = express();

app.use(cors({
  origin:'*',
  methods:['GET','POST','PUT','DELETE'],
  allowedHeaders:['Content-Type']

}
));
app.use(express.json());

app.use('/api/auth', authRoutes);
app.use('/api/food', foodRoutes);
app.use('/api/bmi', bmiRoutes);
app.use('/api/logs', logsRoutes);

app.get('/', (req, res) => {
  res.json({ message: 'NutriTracker API is running!' });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});