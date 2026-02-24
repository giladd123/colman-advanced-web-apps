module.exports = {
  apps: [
    {
      name: "colman-app",
      script: "./dist/server.js",
      cwd: "./",

      env: {
        NODE_ENV: "development",
        PORT: 3000,
      },

      env_production: {
        NODE_ENV: "production",
        PORT: 443,
      },
    },
  ],
};
