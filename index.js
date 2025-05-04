const express = require('express');
const cors = require('cors');
const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());

// Example manual race data
const races = [
  {
    id: 1,
    name: "Australian Grand Prix",
    location: "Melbourne",
    date: "2025-03-16",
    winner: "Max Verstappen",
    team: "Red Bull Racing"
  },
  {
    id: 2,
    name: "Bahrain Grand Prix",
    location: "Sakhir",
    date: "2025-03-23",
    winner: "Charles Leclerc",
    team: "Ferrari"
  }
];

// Routes
app.get('/', (req, res) => {
  res.send('Welcome to the F1 Race API');
});

app.get('/api/races', (req, res) => {
  res.json(races);
});

app.get('/api/races/:id', (req, res) => {
  const race = races.find(r => r.id === parseInt(req.params.id));
  if (!race) return res.status(404).json({ error: 'Race not found' });
  res.json(race);
});

app.listen(PORT, () => {
  console.log(`F1 API running on http://localhost:${PORT}`);
});
