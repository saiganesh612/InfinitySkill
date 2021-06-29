const mongoose = require("mongoose")

const reportSchema = new mongoose.Schema({
    username: String,
    reportedOn: String,
    contestName: String,
    contestId: String,
    status: String,
    reason: String
})

module.exports = mongoose.model("Report", reportSchema)
