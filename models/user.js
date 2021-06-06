const mongoose = require("mongoose")
const passportLocalMongoose = require("passport-local-mongoose")

const userSchema = new mongoose.Schema({
    email: {
        type: String,
        unique: true,
        required: true
    },
    emailToken: String,
    isEmailVerified: {
        type: Boolean,
        default: false
    },
    resetPasswordToken: String,
    resetPasswordExpires: Date,
    postedContests: [
        {
            type: mongoose.Schema.Types.ObjectID,
            ref: "Contest"
        }
    ],
    participatedContest: [
        {
            type: mongoose.Schema.Types.ObjectID,
            ref: "Contest"
        }
    ],
    isAdmin: {
        type: Boolean,
        default: false
    }
})

userSchema.plugin(passportLocalMongoose)

module.exports = mongoose.model("User", userSchema)
