const express = require("express");
const app = express();
const morgan = require("morgan");
require("dotenv").config();
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const dbConfig = require("./api/config/db");
const cron = require("node-cron");
const helper = require("./api/helper/helper")
// const swaggerUi = require("swagger-ui-express");
// const swaggerSpec = require("./swagger"); // Update the path if necessary
// const swaggerAuth = require("./api/middleware/swagger-auth")
const session = require('express-session');
// const { createClient } = require('@redis/client');
// require("./calculation_crone")
// require("./delToken_crone")


var cors = require("cors");
// require("./api/paytab/paytab");



// const redisClient = createClient();
// redisClient.on("error", (err) => console.error("Redis Client Error:", err));

// (async () => {
//   try {
//     await redisClient.connect();
//     console.log("Redis client connected successfully");
//   } catch (err) {
//     console.error("Error connecting Redis client:", err);
//   }
// })();
// global.redisClient = redisClient;

const adminRoutes = require("./api/routes/admin/admin");
// const adminProjectRoutes = require("./api/routes/admin/projectCtrl")
// const adminPaymentRoutes = require("./api/routes/admin/paymentCtrl")

mongoose.Promise = global.Promise;
// app.use("/api-docs", swaggerAuth, swaggerUi.serve, swaggerUi.setup(swaggerSpec));

app.use(cors());
app.use(morgan("dev"));
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json({ limit: "100mb" }));
app.use("/uploads", express.static("uploads"));
// app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerFile));

app.use((req, res, next) => {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Headers", "*");

    if (req.method === "OPTIONS") {
        res.header("Access-Control-Allow-Methods", "PUT, POST, PATCH, DELETE");
        return res.status(200).json({});
    }
    next();
});

// app.use(session({
//   secret: 'your-secret-key', // Secret key for session encryption (make sure to change it to something unique)
//   resave: false,             // Don't save session if it hasn't been modified
//   saveUninitialized: false,   // Save session even if it is uninitialized
//   cookie: {
//     secure: false,           // Set to true if you're using HTTPS (for production)  // Optional: Set a cookie expiration time (e.g., 1 day)
//   },
// }));

// Admin Routes
app.use("/api/admin", adminRoutes);
// // app.use("/api/admin/user", adminUserRoutes);
// app.use("/api/admin/project", adminProjectRoutes)
// app.use("/api/admin/payment", adminPaymentRoutes)

app.get("/setupdone", (req, res) => {
    console.log("Setup done 1234")
    return res.json({ message: "setup done 1234" })
})
app.use("/cancel", (req, res) => {
    console.log("cancel");
    console.log(req);

});

app.use("/success", (req, res) => {
    console.log("success");
    console.log(req);
});

app.use((req, res, next) => {
    const error = new Error("Not Found");
    error.status = 404;
    next(error);
});

app.use(async (error, req, res, next) => {
    res.status(error.status || 500);
    if (error.status) {
        return res.json({
            message: error.message,
        });
    }
    await helper.writeErrorLog(req, error);
    return res.json({
        message: "Internal Server Error",
        error: error.message,
    });
});


module.exports = app;
