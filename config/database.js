const { Sequelize } = require('sequelize');

const sequelize = new Sequelize('login_system', 'root', 'karllawrence', {
    host: 'localhost',
    dialect: 'mysql',
    logging: false
});

module.exports = sequelize; 