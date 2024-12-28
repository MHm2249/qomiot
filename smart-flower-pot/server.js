const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const bodyParser = require('body-parser');
const path = require('path');

// ============================
//       Configuration
// ============================

const app = express();
const PORT = process.env.PORT || 3000;

// Replace with your actual MongoDB connection string
const MONGODB_URI = 'mongodb+srv://<root>:<1o4lIPLUvw2KoeDbKejbBh8V>@<mongodb://root:1o4lIPLUvw2KoeDbKejbBh8V@qomiot2:27017/my-app?authSource=admin>/<qomiot2>?retryWrites=true&w=majority';

// ============================
//         Middleware
// ============================

app.use(cors());
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, 'public')));

// ============================
//         Database Setup
// ============================

mongoose.connect(MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
});

const db = mongoose.connection;
db.on('error', (error) => console.error('MongoDB connection error:', error));
db.once('open', () => console.log('Connected to MongoDB'));

// Define a schema and model for sensor data
const sensorDataSchema = new mongoose.Schema({
  temperature: Number,
  humidity: Number,
  lightValue: Number,
  timestamp: { type: Date, default: Date.now }
});

const SensorData = mongoose.model('SensorData', sensorDataSchema);

// ============================
//         Routes
// ============================

/**
 * @route   POST /data
 * @desc    Receive sensor data from ESP32
 * @access  Public
 */
app.post('/data', async (req, res) => {
  const { temperature, humidity, lightValue } = req.body;

  if (temperature == null || humidity == null || lightValue == null) {
    return res.status(400).json({ message: 'Missing sensor data' });
  }

  const newData = new SensorData({
    temperature,
    humidity,
    lightValue
  });

  try {
    await newData.save();
    res.status(201).json({ message: 'Sensor data saved successfully' });
  } catch (error) {
    console.error('Error saving sensor data:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

/**
 * @route   GET /api/data
 * @desc    Get the latest 100 sensor data entries
 * @access  Public
 */
app.get('/api/data', async (req, res) => {
  try {
    const data = await SensorData.find().sort({ timestamp: -1 }).limit(100);
    res.json(data);
  } catch (error) {
    console.error('Error fetching sensor data:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

/**
 * @route   GET /
 * @desc    Serve the web dashboard
 * @access  Public
 */
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// ============================
//         Start Server
// ============================

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
