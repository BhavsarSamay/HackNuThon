const AdminModel = require("../../models/adminModel");
const Helper = require("../../helper/index");
const niv = require("node-input-validator");
const mongoose = require("mongoose");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const fs = require("fs");
const TwoFactorAuthentication = require("../../models/twoFactorAuthenticationModel");
const EmailHelper = require("../../helper/email");
const path = require("path");
const JWTR = require('jwt-redis').default;
// const ActiveSessionModel = require("../../models/activeSessions")
const requestIp = require("request-ip");

exports.createAdmin = async (req, res, next) => {
    console.log("reached")
    const objValidation = new niv.Validator(req.body, {
        name: "required|maxLength:55",
        email: "required",
        password: "required|minLength:6",
    });

    const matched = await objValidation.check();
    if (!matched) {
        return res.status(422).send({
            message: "Validation error",
            errors: objValidation.errors,
        });
    }

    try {
        let { name, email, password } = req.body;
        const emailCheck = await AdminModel.findOne({
            email: req.body.email,
            status: {
                $in: [1, 2],
            },
        });

        if (emailCheck) {
            return res.status(409).send({
                message: "Admin email already exists",
            });
        }
        let hash = "";
        if (password) {
            hash = await bcrypt.hash(password, 10);
        }

        const newAdmin = new AdminModel({
            name: name,
            email: email,
            password: hash,
            profile_pic: req.file.filename,
            status: 1,
        });
        const result = await newAdmin.save();

        // JWT token generate
        const token = await jwt.sign(
            {
                email: result.email,
                id: result._id,
            },
            process.env.JWT_KEY,
            {
                expiresIn: "2d",
            }
        );
        return res.status(201).send({
            message: "New Admin created",
            token: token,
            admin: result,
        });
    } catch (error) {
        console.log(error)
        next(error);
    }
};

exports.editAdmin = async (req, res, next) => {
    const id = req.userData.id;

    const { name, email } = req.body;

    try {
        const updateObj = {};

        const existingAdmin = await AdminModel.findById(id);

        if (!existingAdmin) {
            return res.status(404).json({ message: "Admin not found" });
        }

        const rootDir = path.resolve(__dirname, "../../..");

        if (req.file) {
            // delete file from upload folder
            if (
                existingAdmin.profile_pic &&
                fs.existsSync(
                    path.join(
                        rootDir,
                        process.env.ADMIN_PROFILE,
                        existingAdmin.profile_pic
                    )
                )
            ) {
                fs.unlinkSync(
                    path.join(
                        rootDir,
                        process.env.ADMIN_PROFILE,
                        existingAdmin.profile_pic
                    )
                );
            }
            updateObj.profile_pic = req.file.filename;
        }

        // Update the name if provided
        if (name) updateObj.name = name;

        // Validate and update email if provided
        if (email) {
            const userResult = await AdminModel.findOne({
                _id: { $ne: new mongoose.Types.ObjectId(id) }, // Exclude the current admin
                email: email,
                status: { $in: [1, 2] },
            });

            if (userResult) {
                return res.status(409).json({
                    message: "Email already exists",
                });
            }
            updateObj.email = email;
        }

        if (!email) {
            updateObj.email = req.userData.email;
        }

        const result = await AdminModel.findByIdAndUpdate(
            id,
            { $set: updateObj },
            { new: true } // Return the updated document
        ).select("-password -createdAt -updatedAt -__v");

        // Handle the profile picture URL
        if (!result.profile_pic) {
            result.profile_pic = "";
        } else {
            result.profile_pic =
                process.env.SITE_URL + process.env.ADMIN_PROFILE + result.profile_pic;
        }

        return res.status(200).json({
            message: "Admin has been successfully updated",
            result: result,
        });
    } catch (error) {
        next(error);
    }
};

exports.auth = async (req, res, next) => {
    try {
        let user = await AdminModel.aggregate([
            { $match: { _id: new mongoose.Types.ObjectId(req.userData.id) } },
            {
                $project: {
                    name: 1,
                    email: 1,
                    profile_pic: 1,
                    status: 1,
                    two_factor_authentication: 1,
                },
            },
        ]);
        if (user[0].profile_pic == "") {
            user[0].profile_pic = await Helper.getImageUrl(
                user[0].profile_pic,
                user[0].name
            );
        } else {
            user[0].profile_pic =
                process.env.SITE_URL + process.env.ADMIN_PROFILE + user[0].profile_pic;
        }
        return res.status(200).send({
            message: "Admin auth Retrieved",
            result: user[0],
        });
    } catch (error) {
        next(error)
    }
};

exports.login = async (req, res, next) => {
    const objValidation = new niv.Validator(req.body, {
        email: "required",
        password: "required",
    });
    const matched = await objValidation.check();

    if (!matched) {
        return res
            .status(422)
            .send({ message: "Validation error", errors: objValidation.errors });
    }

    try {
        let { email, password } = req.body;

        let admin_data = await AdminModel.aggregate([
            {
                $match: {
                    email: email?.toLowerCase(),
                },
            },
        ]);

        let admin = admin_data[0];

        if (!admin) {
            return res.status(401).json({
                message: "Invalid email or password",
            });
        }

        const passwordResult = await bcrypt.compare(
            password?.trim(),
            admin.password
        );

        if (!passwordResult) {
            return res.status(401).json({
                message: "Invalid email or password",
            });
        }

        // Check for 2-factor authentication
        if (admin.two_factor_authentication) {
            return res.status(201).json({
                message: "Two-factor authentication required",
                two_factor_authentication: admin.two_factor_authentication,
            });
        }

        const token = await jwt.sign({
            email: admin?.email,
            id: admin?._id,
            version: admin?.version,
        },
            process.env.JWT_KEY,
            {
                expiresIn: '5h'
            });

        //   await activeSession(req, res, next, token)

        // If no profile pic, set default empty string
        if (!admin.profile_pic) {
            admin.profile_pic = "";
        } else {
            admin.profile_pic =
                process.env.SITE_URL + process.env.ADMIN_PROFILE + admin.profile_pic;
        }

        // Clean up sensitive fields before sending response
        delete admin.password;
        delete admin.createdAt;
        delete admin.updatedAt;
        delete admin.__v;

        return res.status(200).json({
            message: "Admin Logged in successfully.",
            token: token,
            admin: admin,
        });
    } catch (error) {
        next(error);
    }
};

exports.sendEmail = async (req, res, next) => {
    try {
        const objValidation = new niv.Validator(req.body, {
            email: "required|email",
            resend: "required|in:1,2", // 1 = send 2 = resend
        });

        const matched = await objValidation.check();
        if (!matched) {
            return res.status(422).json({
                message: "Validation error",
                error: objValidation.errors,
            });
        }
        const { resend, email } = req.body;

        let checkEmail = await AdminModel.findOne({
            $expr: {
                $eq: [{ $toLower: "$email" }, email.trim().toLowerCase()],
            },
        });

        if (checkEmail) {
            const otp = Helper.generateRandomString(6, true);
            const token = await generateUniqueToken();
            new TwoFactorAuthentication({
                token: token,
                code: otp,
            }).save();
            let subject = "PMS - Email Verification";
            let content = EmailHelper.verificationMail(otp);
            let mail = await EmailHelper.SendMail(email, subject, content);
            let message = "Verification code has been sent to your email address.";
            if (resend == 2) {
                message = "Verification code has been resent to your email address.";
            }
            return res.status(200).json({
                message: message,
                token: token,
            });
        } else {
            return res.status(401).json({
                message: "No user with this email found",
            });
        }
    } catch (error) {
        next(error)
    }
};

exports.checkOTP = async (req, res, next) => {
    const ObjValidation = new niv.Validator(req.body, {
        otp: "required|length:6",
        token: "required",
        email: "required|email",
    });
    const matched = await ObjValidation.check();
    if (!matched) {
        return res.status(422).json({
            message: "validation error",
            error: ObjValidation.errors,
        });
    }
    const { otp, email } = req.body;

    try {
        const loginData = await TwoFactorAuthentication.findOne({
            code: Number(otp),
            token: req.body.token,
        });
        if (!loginData) {
            return res.status(402).json({
                message: "Invalid verification details, Please try again.",
            });
        }
        let admin_data = await AdminModel.aggregate([
            {
                $match: {
                    $expr: {
                        $eq: [{ $toLower: "$email" }, email.trim().toLowerCase()],
                    },
                },
            },
        ]);

        let admin = admin_data[0];

        if (admin === null || admin === undefined) {
            return res.status(409).json({
                message: "Invalid email",
            });
        }

        const token = await jwt.sign(
            {
                email: admin?.email,
                id: admin?._id,
                version: admin?.version,
            },
            process.env.JWT_KEY,
            {
                expiresIn: "2d",
            }
        );

        if (
            admin.profile_pic == "" ||
            admin.profile_pic == null ||
            admin.profile_pic == undefined
        ) {
            admin.profile_pic = "";
        } else {
            admin.profile_pic =
                process.env.SITE_URL + process.env.ADMIN_PROFILE + admin.profile_pic;
        }

        delete admin.password;
        delete admin.createdAt;
        delete admin.updatedAt;
        delete admin.__v;

        // delete the token and otp after verified
        await TwoFactorAuthentication.deleteOne({ _id: loginData._id });

        return res.status(200).json({
            message: "Verification code verified successfully.",
            token: token,
            result: admin,
        });
    } catch (error) {
        next(error);
    }
};

exports.changePassword = async (req, res, next) => {
    try {
        const objValidation = new niv.Validator(req.body, {
            new_password: "required|minLength:6",
            old_password: "required|minLength:4",
        });
        const matched = await objValidation.check();

        if (!matched) {
            return res.status(422).send({
                message: "Validation error",
                errors: objValidation.errors,
            });
        }

        let { new_password, old_password } = req.body;
        const id = req.userData.id;

        const admin = await AdminModel.findById(id);

        const compare = await bcrypt.compare(old_password, admin.password);

        if (!compare) {
            return res.status(409).send({ message: "Invalid current password" });
        }

        if (await bcrypt.compare(new_password, admin.password)) {
            return res
                .status(409)
                .send({ message: "New password cannot be same as current password" });
        }

        let new_version = 2;
        if (Number(process.env.inc_version)) {
            new_version = Number(process.env.inc_version);
        }
        if (req.userData.status == 1) {
            const hash = await bcrypt.hash(new_password, 10);

            let result = await AdminModel.findByIdAndUpdate(
                id,
                {
                    $set: {
                        password: hash,
                    },
                    $inc: { version: new_version },
                },
                { new: true }
            );

            const token = await jwt.sign(
                {
                    email: result?.email,
                    id: result?._id,
                    version: result?.version,
                },
                process.env.JWT_KEY,
                {
                    expiresIn: "2d",
                }
            );

            return res.status(200).json({
                token: token,
                message: "Password updated successfully.",
            });
        } else if (req.userData.status == 0) {
            return res.status(409).json({
                message:
                    "Your account is currently deactivated. Please contact the administrator for assistance.",
            });
        } else {
            return res.status(409).json({
                message: "No Record Found.",
            });
        }
    } catch (error) {
        next(error);
    }
};

exports.updateStatus = async (req, res) => {
    const id = req.userData.id;
    const two_factor_authentication = req.body.status;

    try {
        const result = await AdminModel.findByIdAndUpdate(
            id,
            { $set: { two_factor_authentication: two_factor_authentication } },
            {
                new: true,
            }
        ).select("-password -createdAt -updatedAt -__v");
        if (
            result.profile_pic == "" ||
            result.profile_pic == null ||
            result.profile_pic == undefined
        ) {
            result.profile_pic = "";
        } else {
            result.profile_pic =
                process.env.SITE_URL + process.env.ADMIN_PROFILE + result.profile_pic;
        }
        return res.status(200).json({
            message: "Status has been successfully updated",
            result: result,
        });
    } catch (error) {
        next(error)
    }
};

async function generateUniqueToken() {
    while (true) {
        const token = Helper.generateRandomString(56);
        const existsToken = await TwoFactorAuthentication.findOne({ token: token });
        if (!existsToken) {
            return token;
        }
    }
}
