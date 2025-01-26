# URL Shortener

A simple URL shortener application built using **Node.js, Express, MongoDB, Redis, and JavaScript**. This project allows users to shorten long URLs, track analytics, and manage URL expiration.

## Features

- ✅ **Shorten URLs** with a custom-generated short link.
- 📌 **Store URLs** in MongoDB with an expiration time.
- ⚡ **Fast access** using Redis caching.
- 📊 **Track analytics**, including click count and user IP logging.
- 🔄 **Auto-expiry** of URLs after a set time.
- 🎨 **Frontend UI** for easy URL shortening.

---

## 📂 Project Structure

```
├── models
│   ├── ShortUrl.js          # URL Schema (Short URLs, Expiration, Analytics)
│   ├── Analytics.js         # Stores analytics data (IP, Timestamp)
│
├── public
│   ├── index.html           # Frontend UI (Simple HTML page)
│   ├── styles.css           # Styling for the UI
│   ├── script.js            # Handles API calls from the frontend
│
├── index.js                 # Main server file (Express API)
├── analyticsWorker.js       # Worker for processing analytics from Redis
├── package.json             # Dependencies and project scripts
├── README.md                # Documentation
```

---

## 🚀 Getting Started

### 1️⃣ Prerequisites

Ensure you have the following installed:

- **Node.js** (v16+)
- **MongoDB**
- **Redis**

### 2️⃣ Installation

Clone the repository and install dependencies:

```bash
git clone https://github.com/your-repo/url-shortener.git
cd url-shortener
npm install
```

### 3️⃣ Start MongoDB and Redis

Make sure **MongoDB** and **Redis** are running on your system:

```bash
mongod --dbpath /path-to-mongo-data
redis-server
```

### 4️⃣ Run the Application

Start the Express server:

```bash
npm run dev
```

Start the Analytics Worker:

```bash
node analyticsWorker.js
```

---

## 🛠 API Endpoints

### ➤ Shorten a URL

**POST** `/shortUrl`

```json
{
  "fullUrl": "https://example.com",
  "expirationMinutes": 120
}
```

*Response:*

```json
{
  "full": "https://example.com",
  "short": "abc123",
  "expiresAt": "2025-01-26T14:30:00.000Z"
}
```

---

### ➤ Redirect to Original URL

**GET** `/shortUrls/:shortUrl`

- Redirects the user to the original URL.
- Logs analytics (IP and timestamp).

---

### ➤ Get URL Analytics

**GET** `/analytics/:shortUrl` *Response:*

```json
{
  "shortUrl": "abc123",
  "fullUrl": "https://example.com",
  "clicks": 25,
  "analytics": [
    { "ip": "192.168.1.1", "timestamp": "2025-01-26T14:30:00.000Z" },
    { "ip": "192.168.1.2", "timestamp": "2025-01-26T14:45:00.000Z" }
  ]
}
```

---

## ⚙️ Configuration

Create a `.env` file to store environment variables:

```plaintext
MONGO_URI=mongodb://127.0.0.1/urlShortener
REDIS_URI=redis://127.0.0.1:6379
PORT=5000
```

---

## 📌 Tech Stack

- **Backend:** Node.js, Express, MongoDB (Mongoose), Redis
- **Frontend:** HTML, CSS, JavaScript
- **Caching:** Redis (for fast URL lookups)
- **Worker:** Redis Pub/Sub for analytics tracking

---

## 🛠 Dependencies

- **express** - Web framework for Node.js
- **mongoose** - MongoDB ODM for schema management
- **ioredis** - Redis client for caching and Pub/Sub
- **cors** - Middleware for handling CORS requests
- **prepend-http** - Ensures URLs have an HTTP/HTTPS prefix
- **shortid** - Generates unique short IDs

---

## 🌟 Future Improvements

✅ Custom short URLs\
✅ Admin panel for URL management\
✅ More analytics (browser, country, etc.)

