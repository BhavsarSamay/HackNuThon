const mongoose = require("mongoose");
const moment = require("moment-timezone");
const fs = require("fs");
// const FCMDB = require("../models/fcmModel");
// const UserModel = require("../models/userModel");
// const Helper = require("./index");
const QRCode = require("qrcode");
const logFolder = "./Logs/Error_log";
const path = require("path");

exports.writeErrorLog = async (req, error) => {
    try {
        if (!fs.existsSync(logFolder)) {
            fs.mkdirSync(logFolder, { recursive: true });
        }
    } catch (error) {
        console.log(error);
    }
    const requestURL = req.protocol + "://" + req.get("host") + req.originalUrl;
    const requestBody = JSON.stringify(req.body);
    const Method = req.method;
    const requestHeaders = JSON.stringify(req.headers);
    const date = moment().format("MMMM Do YYYY, h:mm:ss a");
    const file_date = moment().format("DDMMYYYY");

    const logEntry =
        "ERROR DATE : " +
        date +
        "\n" +
        "API URL : " +
        requestURL +
        "\n" +
        "API METHOD : " +
        Method +
        "\n" +
        "API PARAMETER : " +
        requestBody +
        "\n" +
        "API Headers : " +
        requestHeaders +
        "\n" +
        "Error : " +
        error +
        "\n\n";

    // Append log entry to the file within the log folder

    const logFilePath = path.join(logFolder, `${file_date}_error.log`);
    fs.appendFileSync(logFilePath, logEntry);
};