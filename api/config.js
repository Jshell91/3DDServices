// Configuration for different environments
require('dotenv').config();

const config = {
  development: {
    port: 3000,
    cors: {
      origin: ['http://localhost:3000', 'http://127.0.0.1:3000'],
      credentials: true
    },
    session: {
      secure: false,
      sameSite: 'lax'
    }
  },
  production: {
    port: process.env.PORT || 3000,
    cors: {
      origin: [
        'http://localhost:3000',
        'http://127.0.0.1:3000',
        'http://157.230.112.247:3000',
        `http://${process.env.PGHOST}:3000`,
        `https://${process.env.PGHOST}:3000`
      ],
      credentials: true
    },
    session: {
      secure: false, // Keep false unless using HTTPS
      sameSite: 'lax'
    }
  }
};

const env = process.env.NODE_ENV || 'development';

module.exports = config[env];
