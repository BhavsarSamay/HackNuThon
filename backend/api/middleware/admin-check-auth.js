const jwt = require("jsonwebtoken");
const mongoose = require("mongoose");
const AdminModel = require("../models/adminModel");
// const ActiveSessionModel = require("../models/activeSessions")

// const JWTR = require('jwt-redis').default;
// const jwtr = new JWTR(global.redisClient);

module.exports = async (req, res, next) => {
  try {
    const token = req.headers.authorization.split(" ")[1];
    console.log(token)
    const decoded = await jwt.verify(token, process.env.JWT_KEY);
    console.log(decoded)
    // let loginData = await ActiveSessionModel.findOne({ jwt_token: token }).select("updatedAt")
    // if (!loginData) {
    //   return res.status(401).json({
    //     message: "Authentication failed. Please try again.",
    //   });
    // }
    // loginData.updatedAt = new Date()
    // loginData.save()

    const { id } = decoded;
    console.log(decoded.version)
    const userData = await AdminModel.findOne({ _id: id });
    console.log(userData)
    if (!userData) {
      return res.status(401).json({
        message: "Authentication failed. Please try again.",
      });
    }
    req.userData = userData;
    next();
  } catch (err) {
    return res.status(401).json({
      message: "Authentication failed. Please try again.",
    });
  }
};