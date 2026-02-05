const dotenv = require("dotenv");

// Set environment variables for tests
process.env.NODE_ENV = "test";
process.env.TOKEN_EXPIRATION = "3s";

// Load test environment file before any tests run
dotenv.config({ path: ".env.test" });
