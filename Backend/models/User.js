const mongoose = require("mongoose");
const { getMongoConnected, LocalUser } = require("./dbAdapter");

const userSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: true,
            trim: true
        },

        email: {
            type: String,
            required: true,
            unique: true,
            lowercase: true
        },

        password: {
            type: String,
            required: true
        },
        resetTokenHash: String,
        resetTokenExpires: Date,
        monthlyBudget: { type: Number, min: 0, default: null }
    },
    {
        timestamps: true
    }
);

const MongooseUser = mongoose.models.User || mongoose.model("User", userSchema);

const User = new Proxy(MongooseUser, {
    get(target, prop) {
        if (!getMongoConnected() && prop in LocalUser) {
            return LocalUser[prop];
        }
        return target[prop];
    }
});

module.exports = User;
