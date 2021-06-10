const mongoose = require('mongoose');

const contestSchema = new mongoose.Schema({
    owner: String,
    contestName: String,
    motive: String,
    coverPhoto: {
        url: String,
        filename: String
    },
    rules: {
        url: String,
        filename: String
    },
    startDate: String,
    endDate: String,
    votingStart: String,
    votingEnd: String,
    WinnerDate: String,
    description: String,
    category: String,
    subCategory: String,
    prizeMoney: Number,
    entryFee: Number,
    peopleInterested: Number,
    peopleParticipated: Number,
    isApproved: {
        type: Boolean,
        default: false
    }
})

module.exports = mongoose.model("Contest", contestSchema)
