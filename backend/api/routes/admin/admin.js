const express = require("express");
const router = express.Router();
const AdminController = require("../../controller/admin/adminCtrl");
const adminCheckAuth = require("../../middleware/admin-check-auth");
const multer = require("multer");
const Helper = require("../../helper/index");
const makeRequest = require("../../middleware/make-request");
const folderPath = "./uploads/admin/profile_picture";
const fs = require("fs");
const rateLimiter = require("../../middleware/rateLimiter");

const rate_minutes = process.env.RATE_MINUTES ? process.env.RATE_MINUTES : 1;
const rate_counts = process.env.LIST_COUNT ? process.env.LIST_COUNT : 20;
        
const otp_minutes = process.env.OTP_MINUTES ? process.env.OTP_MINUTES : 1;
const otp_counts = process.env.OTP_COUNT ? process.env.OTP_COUNT : 20;


try {
    if (!fs.existsSync(folderPath)) {
        fs.mkdirSync(folderPath, { recursive: true });
    }
} catch (error) {
    console.log(error);
}

// Set up storage configuration
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, folderPath);
    },
    filename: function (req, file, cb) {
        const sanitizedFileName =
            Helper.generateRandomString(5) +
            "-" +
            sanitizeFileName(file.originalname);
        cb(null, sanitizedFileName);
    },
});

// File filter to restrict allowed file types
const fileFilter = (req, file, cb) => {
    const allowedMimeTypes = [
        "image/png",
        "image/jpg",
        "image/jpeg",
        "image/gif",
        "image/svg+xml",
    ];

    if (allowedMimeTypes.includes(file.mimetype)) {
        cb(null, true);
    } else {
        cb(
            new Error("Only .png, .jpg, .gif, and .jpeg formats are allowed!"),
            false
        );
    }
};

// Upload settings
const upload = multer({
    storage: storage,
    limits: {
        fileSize: 1024 * 1024 * 10,
    },
    fileFilter: fileFilter,
});

// Function to sanitize file names
const sanitizeFileName = (filename) => {
    return filename.replace(/[^a-zA-Z0-9.]/g, "_"); // Replace unwanted characters
};

router.post(
    "/create-admin",
    upload.single("profile_pic"),
    makeRequest,
    rateLimiter(otp_minutes, otp_counts),
    AdminController.createAdmin
);

router.put(
    "/edit",
    adminCheckAuth,
    upload.single("profile_pic"),
    makeRequest,
    rateLimiter(rate_minutes, rate_counts),
    AdminController.editAdmin
  
  );

router.get(
    "/auth",
    makeRequest,
    adminCheckAuth,
    rateLimiter(rate_minutes, rate_counts),
    AdminController.auth
  
  );

  router.post(
    "/login",
    makeRequest,
    rateLimiter(otp_minutes, otp_counts),
  
    AdminController.login,
  );

  router.post(
    "/send-email",
    makeRequest,
    rateLimiter(otp_minutes, otp_counts),
    AdminController.sendEmail
  );

  router.post(
    "/verify-otp",
    makeRequest,
    rateLimiter(otp_minutes, otp_counts),
    AdminController.checkOTP
  );

  router.put(
    "/change-password",
    makeRequest,
    adminCheckAuth,
    rateLimiter(otp_minutes, otp_counts),
    AdminController.changePassword
  
  );
  
  router.put(
    "/update-status",
    makeRequest,
    adminCheckAuth,
    rateLimiter(rate_minutes, rate_counts),
    AdminController.updateStatus
  );

module.exports = router;