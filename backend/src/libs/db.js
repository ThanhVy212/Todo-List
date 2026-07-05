import mongoose from "mongoose";

export const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_CONNECTIONSTRING);
    console.log("DB connect successful");
  } catch (err) {
    console.log("Error connect database:", err);
    process.exit(1);
  }
};
