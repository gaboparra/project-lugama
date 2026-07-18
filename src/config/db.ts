import mongoose from "mongoose";

const connectDB = async (): Promise<void> => {
  try {
    await mongoose.connect(process.env.MONGO_URI as string);
    console.log("MongoDB connected successfully.");
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error("Error connecting to MongoDB:", message);
    process.exit(1);
  }
};

export default connectDB;
