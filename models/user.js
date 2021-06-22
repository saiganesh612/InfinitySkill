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
            _id: false,
            contestId: String,
            status: {
                type: String,
                default: "Inprogress"
            },
            points: {
                type: Number,
                default: 0
            },
            workSubmitted: {
                type: String,
                default: "No"
            },
            contestType: {
                type: String,
                default: "free"
            },
            isPaid: {
                type: Boolean,
                default: false
            }
        }
    ],
    isAdmin: {
        type: Boolean,
        default: false
    },
    votes: [
        {
            _id: false,
            contestId: String,
            voteList: [
                {
                    _id: false,
                    isVoted: Boolean,
                    pName: String
                }
            ]
        }
    ]
})

userSchema.plugin(passportLocalMongoose)

module.exports = mongoose.model("User", userSchema)
