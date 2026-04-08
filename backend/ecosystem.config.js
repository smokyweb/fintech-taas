module.exports = {
  apps: [{
    name: 'fintech-taas',
    script: 'src/index.js',
    env: {
      PORT: 3061,
      NODE_ENV: 'production',
      JWT_SECRET: 'tradeflow-secret-2024'
    }
  }]
};
