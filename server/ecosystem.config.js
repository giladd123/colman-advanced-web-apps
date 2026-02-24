module.exports = {
  apps: [
    {
      name: "colman-app",
      script: "./dist/server.js",
      cwd: "./",

      env: {
        NODE_ENV: "development",
      },

      env_production: {
        NODE_ENV: "production",
      },
    },
  ],
};