import express from 'express';
import mongoose from 'mongoose';
import cors from "cors";
import ShortUrl from "./models/ShortUrl.js"; 
import prependHttp from "prepend-http";
import Redis from "ioredis";
import Analytics from "./models/Analytics.js";
const redis = new Redis();
const app= express();   
app.use(express.json());
app.use(cors());
//this link should be in .env file
mongoose.connect("mongodb://127.0.0.1/urlShortener", {
    useNewUrlParser: true, 
    useUnifiedTopology: true,
  })
  .then(() => console.log("MongoDB Connected"))
  .catch((error) => console.error("MongoDB Connection Error:", error));

const PORT = 5000; //port should be in .env file
app.get("/",(req, res) =>{
    ShortUrl.find().then((urls)=> res.send(urls));
});

/**
 * @route POST /shortUrl
 * @description Creates a short URL from a given full URL and stores it in the database and cache.
 * @param {Object} req - The request object containing the full URL in the body.
 * @param {Object} res - The response object used to send back the created short URL or an error message.
 * @returns {JSON} Returns the newly created short URL along with expiration details.
 *
 * @example
 * Request body:
 * {
 *   "fullUrl": "https://example.com",
 *   "expirationMinutes": 120
 * }
 *
 * Response:
 * {
 *   "full": "https://example.com",
 *   "short": "abc123",
 *   "expiresAt": "2025-01-26T14:30:00.000Z"
 * }
 */
app.post('/shortUrl', async (req, res) => {
    try {
        // Validate that the request body contains a fullUrl
        if (!req.body || !req.body.fullUrl) {
            return res.status(400).json({ error: "fullUrl is required" });
        }

        // Ensure the URL has a valid HTTP/HTTPS prefix
        let fullUrl = prependHttp(req.body.fullUrl);
        console.log("Received URL:", fullUrl);

        // Set the expiration time, defaulting to 60 minutes if not provided
        let expirationMinutes = req.body.expirationMinutes || 60;
        let expiresAt = new Date(Date.now() + expirationMinutes * 60 * 1000);

        // Create a new short URL entry in the database
        const newShortUrl = await ShortUrl.create({ full: fullUrl, expiresAt });

        // Store the short URL mapping in Redis with an expiration time
        await redis.setex(newShortUrl.short, expirationMinutes * 60, fullUrl);

        res.status(201).json(newShortUrl);
    } catch (error) {
        console.error("Server Error:", error);
        res.status(500).json({ message: "Internal Server Error" });
    }
});

/**
 * @route GET /shortUrls/:shortUrl
 * @description Retrieves the original URL from a shortened URL and redirects the user. 
 *              Also logs analytics data and updates the database.
 * @param {Object} req - The request object containing the shortened URL as a parameter.
 * @param {Object} res - The response object used to redirect to the original URL or return an error message.
 * @returns {Redirect|JSON} Redirects to the original URL or returns an error if the short URL is not found or expired.
 *
 * @example
 * Request:
 * GET /shortUrls/abc123
 *
 * Response (Redirect):
 * 302 Found -> Redirects to the original URL.
 *
 * Response (Not Found):
 * {
 *   "error": "Shortened URL not found"
 * }
 *
 * Response (Expired):
 * {
 *   "error": "This shortened URL has expired"
 * }
 */
app.get("/shortUrls/:shortUrl", async (req, res) => {
    try {
        // Extract the short URL key from the request parameters
        const shortUrlKey = req.params.shortUrl;

        // Check if the URL exists in the Redis cache
        const cachedUrl = await redis.get(shortUrlKey);
        if (cachedUrl) {
            console.log("URL Retrieved from Redis Cache:", cachedUrl);

            // Publish an analytics event for tracking user visits
            await redis.publish("analytics_event", JSON.stringify({
                shortUrlId: shortUrlKey, 
                ipAddress: req.ip, 
            }));

            // Update click count and store analytics data in the database
            await ShortUrl.findOneAndUpdate(
                { short: shortUrlKey },
                { 
                  $inc: { clicks: 1 }, 
                  $push: { analytics: { ip: req.ip, timestamp: new Date() } }
                }
            );

            // Redirect to the original URL
            return res.redirect(cachedUrl);
        }

        // If not in cache, retrieve from the database
        const shortUrl = await ShortUrl.findOne({ short: shortUrlKey });

        // If the shortened URL does not exist, return a 404 error
        if (!shortUrl) {
            return res.status(404).json({ error: "Shortened URL not found" });
        }

        // Check if the URL has expired
        if (new Date() > shortUrl.expiresAt) {
            return res.status(410).json({ error: "This shortened URL has expired" });
        }

        // Get the user's IP address (handling proxies)
        const userIp = req.headers["x-forwarded-for"] || req.ip;

        // Log analytics data in Redis
        await redis.publish("analytics_event", JSON.stringify({
            shortUrlId: shortUrl.short, 
            ipAddress: userIp, 
        }));

        // Store the URL in Redis cache for faster future retrieval (expires in 1 hour)
        await redis.setex(shortUrl.short, 3600, shortUrl.full);

        // Redirect the user to the original URL
        res.redirect(shortUrl.full);
    } catch (error) {
        console.error("Server Error:", error);
        res.status(500).json({ message: "Internal Server Error" });
    }
});

/**
 * @route GET /analytics/:shortUrl
 * @description Retrieves analytics data for a given shortened URL, including the number of clicks and user activity.
 * @param {Object} req - The request object containing the shortened URL as a parameter.
 * @param {Object} res - The response object used to return the analytics data or an error message.
 * @returns {JSON} Returns analytics data including click count and user tracking information.
 *
 * @example
 * Request:
 * GET /analytics/abc123
 *
 * Response (Success):
 * {
 *   "shortUrl": "abc123",
 *   "fullUrl": "https://example.com",
 *   "clicks": 25,
 *   "analytics": [
 *     { "ip": "192.168.1.1", "timestamp": "2025-01-26T14:30:00.000Z" },
 *     { "ip": "192.168.1.2", "timestamp": "2025-01-26T14:45:00.000Z" }
 *   ]
 * }
 *
 * Response (Not Found):
 * {
 *   "error": "Shortened URL not found"
 * }
 */
app.get("/analytics/:shortUrl", async (req, res) => {
    try {
        // Fetch the short URL details from the database
        const shortUrl = await ShortUrl.findOne({ short: req.params.shortUrl });

        // If the short URL is not found, return a 404 error
        if (!shortUrl) {
            return res.status(404).json({ error: "Shortened URL not found" });
        }

        // Fetch analytics data related to the short URL from the database
        const analyticsData = await Analytics.find({ shortUrlId: shortUrl._id });

        // Return the analytics response including full URL, click count, and user tracking details
        res.json({
            shortUrl: shortUrl.short,
            fullUrl: shortUrl.full,
            clicks: shortUrl.clicks,
            analytics: analyticsData,
        });
    } catch (error) {
        console.error("Server Error:", error);
        res.status(500).json({ message: "Internal Server Error" });
    }
});

// Start the server and listen on the specified port
app.listen(PORT, () => console.log("SERVER IS RUNNING ON PORT", PORT));
