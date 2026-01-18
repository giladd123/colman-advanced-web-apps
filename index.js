import connectToDatabase from "./database.js";
import mongoose from "mongoose";

function gracefulShutdown() {
    mongoose.connection.close();
    console.log("Mongoose connection closed through app termination");
}

process.loadEnvFile();
process.on("SIGINT", gracefulShutdown).on("SIGTERM", gracefulShutdown);

connectToDatabase();
console.log("Connected to DB")

