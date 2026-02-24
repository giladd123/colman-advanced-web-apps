module.exports = {
  apps: [
    {
      name: "colman-app",
      script: "./server.js",

      env: {
        NODE_ENV: "development",
      },

      env_production: {
        NODE_ENV: "production",
      },
    },
  ],
};