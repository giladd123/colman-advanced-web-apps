import mongoose from "mongoose";

async function connectToDatabase() {
    try {
        await mongoose.connect(process.env.DATABASE_URL!);
    } catch (error) {
        console.error("Database connection error:", error);
        process.exit(1);
    }
    const db = mongoose.connection;
    db.on("error", error =>console.error(error));
    db.once("open", () => console.log("Connected to Database"));
}

export default connectToDatabase;