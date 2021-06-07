const mongoose = require('mongoose');

const contestSchema = new mongoose.Schema({
    owner: String,
    contestName: String,
    motive: String,
    startDate: String,
    endDate: String,
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
