const mongoose = require("mongoose");
const TwoFactorAuthenticationSchema = mongoose.Schema(
    {
        token: { type: String, require: true },
        code: { type: Number, require: true },
    },
    { timestamps: true }
);
module.exports = mongoose.model(
    "TwoFactorAuthentication",
    TwoFactorAuthenticationSchema
);
