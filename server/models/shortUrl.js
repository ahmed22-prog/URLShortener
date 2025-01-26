import mongoose from "mongoose";
import shortid from "shortid";
// import ShortUrl from "./models/ShortUrl.js";
const shortUrlSchema = new mongoose.Schema({
full:{
    type: String,
    required: true,
},
short: {
    type: String,
    default: shortid.generate,
},
createdAt: {
    type: Date,
    default: Date.now,
  },
  expiresAt: {
    type: Date,
    required: true, 
    index: { expires: '0' },
  },
clicks: { 
  type: Number,
  default: 0,
},
analytics: [
  {
    ip: { type: String }, 
    timestamp: { type: Date, default: Date.now }, 
  },
],
});

shortUrlSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });
export default mongoose.model("ShortUrl", shortUrlSchema);
