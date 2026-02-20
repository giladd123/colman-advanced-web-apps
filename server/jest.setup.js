const dotenv = require("dotenv");

// Set environment variables for tests
process.env.NODE_ENV = "test";
process.env.TOKEN_EXPIRATION = "3s";

// Load test environment file from root
dotenv.config({ path: require("path").resolve(__dirname, "../.env.test") });
