const moment = require("moment");
const fs = require("fs");
// const AdminActionDB = require("../models/admin_action");
const sizeOf = require("image-size");
const pathLib = require("path");
const Jimp = require("jimp");
const convert = require("heic-convert");
const admin = require("firebase-admin");
const axios = require("axios");
const FormData = require("form-data");

// const Constant = require("../helper/constants");
// const helper = require("../helper/helper");
// const serviceAccount = require("../../dawaiwallet-firebase-adminsdk-5d165-31596ebc90 (1).json");
// const LabelModel = require("../models/labelModel");
// const LanguageModel = require("../models/lablelLanguageModel")

// const firebaseApp = admin.initializeApp({
//   credential: admin.credential.cert(serviceAccount),
// });

exports.generateRandomString = (length = 6, isNumber = false) => {
    const characters = isNumber
        ? "0123456789"
        : "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
    let result = "";

    if (isNumber) {
        result += "123456789".charAt(Math.floor(Math.random() * 9)); // First character cannot be '0'
    } else {
        result += "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz123456789".charAt(Math.floor(Math.random() * characters.length - 1));
    }

    for (let i = 0; i < length - 1; i++) {
        result += characters.charAt(Math.floor(Math.random() * characters.length));
    }

    return result;
};

exports.getImageUrl = async (filename, name = "SH") => {
    if (filename === "" || filename === undefined || filename === null) {
        filename =
            "https://ui-avatars.com/api/?name=" +
            name +
            "&rounded=true&background=c39a56&color=fff&format=png";
    } else {
        filename = process.env.SITE_URL + filename;
    }
    return filename;
};

exports.writeErrorLog = async (req, error) => {
    const requestURL = req.protocol + "://" + req.get("host") + req.originalUrl;
    const requestBody = JSON.stringify(req.body);
    const date = moment().format("MMMM Do YYYY, h:mm:ss a");
    fs.appendFileSync(
        "errorLog.log",
        "REQUEST DATE : " +
        date +
        "\n" +
        "API URL : " +
        requestURL +
        "\n" +
        "API PARAMETER : " +
        requestBody +
        "\n" +
        "Error : " +
        error +
        "\n\n"
    );
};

exports.getSlugName = (title) => {
    const titleLOwerCase = title.toLowerCase();
    const slug = titleLOwerCase.replace(/ /g, "-");
    return slug;
};

exports.call_msg_notification = async (registration_ids, messages) => {
    const message = {
        notification: {
            title: "Dawai Wallet",
            body: messages.description,
        },
        token: registration_ids[0],
        data: {
            title: "Dawai Wallet",
            to: messages.to ? String(messages.to) : "",
            description: messages.description ? messages.description : "",
            type: messages.type ? String(messages.type) : "", // 1 dose reminder, 2 refill reminder
            medicine_id: messages.medicine_id ? String(messages.medicine_id) : "",
            referenceId: messages.dose_id ? String(messages.dose_id) : "",
            sound: messages.sound ? "true" : "false",
            vibration: messages.vibration ? "true" : "false",
            click_action: "FLUTTER_NOTIFICATION_CLICK",
        },
    };

    admin
        .messaging()
        .send(message)
        .then(async (result) => {
            console.log(result);
        })
        .catch(async (err) => {
            console.log(err);
        });
};

exports.call_msg_ios_notification = async (registration_ids, messages) => {
    const message = {
        notification: {
            title: "Dawai Wallet",
            body: messages.description,
        },
        token: registration_ids[0],
        data: {
            title: "Dawai Wallet",
            to: messages.to ? String(messages.to) : "",
            description: messages.description ? messages.description : "",
            type: messages.type ? String(messages.type) : "", // 1 dose reminder, 2 refill reminder
            medicine_id: messages.medicine_id ? String(messages.medicine_id) : "",
            referenceId: messages.dose_id ? String(messages.dose_id) : "",
            sound: messages.sound ? String(messages.sound) : "",
            vibration: messages.vibration ? String(messages.vibration) : "",
        },
    };

    admin
        .messaging()
        .send(message)
        .then(async (result) => {
            console.log(result);
        })
        .catch(async (err) => {
            console.log(err);
        });
};

exports.resizeImage = async (params) => {
    try {
        if (!params || !params.filename) return;

        const fileName = params.filename;

        let newPath = params.path; // Assume the path property is present in the object

        // Check if the file extension is supported
        if (!fileName.match(/\.(jpe?g|png|gif|heic)$/gi)) return;

        // Convert HEIC to JPG if necessary
        if (fileName.match(/\.(heic)$/gi)) {
            newPath = await heicToJpg(params.path); // Update newPath with the converted file path
        }

        // Generate new file name with a timestamp or any other logic you prefer
        const newFileName = `compressed_${fileName}${pathLib.extname(newPath)}`;
        const directory = pathLib.dirname(newPath);
        const newFilePath = pathLib.join(directory, newFileName);

        // Compress the image
        await Jimp.read(newPath).then((res) => {
            res
                .resize(50, Jimp.AUTO) // width height
                .quality(50) // set JPEG quality
                .write(newFilePath);
        });

        return newFileName; // Return the new file path
    } catch (err) {
        console.log(err);
    }
};

// exports.getTranslatedResponse = async (label, language = "en") => {
//     try {
//         if (language !== "en") {
//             let languageCheck = await LanguageModel.findOne({
//                 language_code: language,
//             });
//             if (!languageCheck) {
//                 language = "en";
//             }
//         }

//         let listLabel = await LabelModel.find({});
//         for (let index = 0; index < listLabel.length; index++) {
//             const element = listLabel[index];
//             if (element.index == label) {
//                 return element[language];
//             }
//         }
//         return "";
//     } catch (error) {
//         console.log(error);
//     }
// };
