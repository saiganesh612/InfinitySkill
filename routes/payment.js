const express = require("express")
const router = express.Router()
const User = require("../models/user")
const Contest = require("../models/contest")
const Payment = require("../models/payment")
const { isLoggedIn, isAdmin } = require("../middlewares")
const { transporter, sender } = require("../settings")

router.post("/request-money/:id", isLoggedIn, async (req, res) => {
    const { id } = req.params
    const { username } = req.user
    try {
        const { bankType, accountNumber, confirmAccountNumber, ifsc, holderName } = req.body
        if (accountNumber !== confirmAccountNumber) throw "Account number didn't matched. Please submit the form once again with valid details."

        const user = await User.findOne({ username: { $eq: username } })
        if (!user) throw "Your are not an authenticated user."

        const contest = await Contest.findOne({ _id: { $eq: id } })
        if (!contest) throw "Their is no contest with this reference."

        const newPayment = new Payment({
            winnerName: username, contestId: id, status: "requested", amount: contest.prizeMoney, bankType, accountNumber, ifscCode: ifsc, holderName
        })
        await newPayment.save()

        const { email } = await User.findOne({ username: { $eq: "Admin" } })
        console.log(email)

        const body = `
            Hey Admin,
            ${username} participated in a contest called ${contest.contestName} and he is the winner of that contest.
            Now its your turn to pay him the prize money of ${contest.prizeMoney} within 2-3 days.
            Please, cross verify the details in the contest page and send the money to his account which will be displayed on your dashboard.
        `

        const mailOptions = {
            from: sender,
            to: email,
            subject: "Confirmation details",
            text: body
        }

        transporter.sendMail(mailOptions, err => {
            if (err) return console.log("error occured", err)
            console.log('mail sent');
            req.flash("success", "Thanks we send these details to admin. Money will be deposited within 2-3 working days.")
            res.redirect(`/list-of-participants?id=${id}`)
        })
    } catch (err) {
        err = err ? err : "Something went wrong."
        req.flash("error", err)
        res.redirect(`/list-of-participants?id=${id}`)
    }
})

module.exports = router
