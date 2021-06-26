const mongoose = require("mongoose")

const paymentSchema = new mongoose.Schema({
    winnerName: String,
    contestId: String,
    status: String,
    amount: Number,
    bankType: String,
    accountNumber: Number,
    ifscCode: String,
    holderName: String
})

module.exports = mongoose.model("Payment", paymentSchema)
