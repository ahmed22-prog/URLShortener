import mongoose from "mongoose";

const analyticsSchema = new mongoose.Schema({
  shortUrlId: { type: String, required: true },  
  timestamp: { type: Date, default: Date.now },
  ipAddress: String,
});

export default mongoose.model("Analytics", analyticsSchema);
