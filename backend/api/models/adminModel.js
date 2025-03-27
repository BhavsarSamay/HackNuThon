const mongoose = require("mongoose");
let aggregatePaginate = require("mongoose-aggregate-paginate-v2");
let mongoosePaginate = require("mongoose-paginate-v2");

const adminSchema = mongoose.Schema(
    {
        name: {
            type: String,
            required: true,
        },
        email: {
            type: String,
            required: true,
            unique: true,
        },
        password: {
            type: String,
            required: true,
        },
        profile_pic: {
            type: String,
            default: "",
        },
        status: {
            type: Number,
            default: 1, // 1=active, 2=inactive
        },
        version: {
            type: Number,
            default: 0,
        },
        two_factor_authentication: {
            type: Boolean,
            default: false,
        },
    },
    { timestamps: true }
);

adminSchema.index({ status: -1 });

adminSchema.plugin(aggregatePaginate);
adminSchema.plugin(mongoosePaginate);
module.exports = mongoose.model("admin", adminSchema);
