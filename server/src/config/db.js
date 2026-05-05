import mongoose from "mongoose";

export async function connectDb() {
  const uri = process.env.MONGO_URI || "mongodb://127.0.0.1:27017/smart_question_bank";
  mongoose.set("strictQuery", true);
  await mongoose.connect(uri, {
    serverSelectionTimeoutMS: Number(process.env.MONGO_SERVER_SELECTION_TIMEOUT_MS || 5000)
  });
  return mongoose.connection;
}
