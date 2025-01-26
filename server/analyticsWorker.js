import Redis from "ioredis";
import mongoose from "mongoose";
import Analytics from "./models/Analytics.js";

/**
 * @file analyticsWorker.js
 * @description This script listens to a Redis Pub/Sub channel for analytics events and stores them in MongoDB.
 *              It tracks user interactions with shortened URLs by logging their IP address and timestamps.
 *
 * @dependencies Requires Redis for message subscription and MongoDB (via Mongoose) for storing analytics data.
 *
 * @example
 * Event Published to Redis:
 * {
 *   "shortUrlId": "abc123",
 *   "ipAddress": "192.168.1.1",
 *   "timestamp": "2025-01-26T14:30:00.000Z"
 * }
 *
 * MongoDB Storage Format:
 * {
 *   "_id": "unique_object_id",
 *   "shortUrlId": "abc123",
 *   "ipAddress": "192.168.1.1",
 *   "timestamp": "2025-01-26T14:30:00.000Z"
 * }
 */

// Initialize Redis subscriber instance
const redisSubscriber = new Redis();

// Connect to MongoDB
mongoose.connect("mongodb://127.0.0.1/urlShortener", {
    useNewUrlParser: true, 
    useUnifiedTopology: true,
})
.then(() => console.log("Analytics Worker Connected to MongoDB"))
.catch((error) => console.error("MongoDB Connection Error:", error));

// Subscribe to the Redis Pub/Sub channel for analytics events
redisSubscriber.subscribe("analytics_event");

// Listen for messages on the "analytics_event" channel
redisSubscriber.on("message", async (channel, message) => {
    if (channel === "analytics_event") {
        // Parse incoming event data
        const eventData = JSON.parse(message);
        console.log("📊 Processing Analytics Event:", eventData);

        // Store the event data in the MongoDB analytics collection
        try {
            await Analytics.create({
                shortUrlId: eventData.shortUrlId,
                ipAddress: eventData.ipAddress,
                timestamp: eventData.timestamp || new Date(),
            });
            console.log("Analytics Data Saved Successfully!");
        } catch (error) {
            console.error("Error Saving Analytics Data:", error);
        }
    }
});
