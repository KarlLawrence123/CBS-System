const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const sequelize = require('./config/database');

dotenv.config();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// Database Connection
sequelize.authenticate()
    .then(() => {
        console.log('Connected to MySQL database');
        return sequelize.sync(); // This creates the tables if they don't exist
    })
    .then(() => {
        console.log('Database synchronized');
    })
    .catch(err => console.error('Database connection error:', err));

// Routes
app.use('/api/auth', require('./routes/auth'));

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
}); 