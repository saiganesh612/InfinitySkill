const express = require("express")
const router = express.Router()
const open = require("open")
const User = require("../models/user")
const Contest = require("../models/contest")
const Payment = require("../models/payment")
const { isLoggedIn } = require("../middlewares")
const { transporter, sender, url } = require("../settings")
const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY)

// Payment for prize money
router.get("/pay-prize-money/:id", isLoggedIn, async (req, res) => {
    try {
        const { id } = req.params
        const contest = await Contest.findOne({ _id: { $eq: id } })

        const dateObj = new Date();
        let month = dateObj.getUTCMonth() + 1; //months from 1-12
        const day = dateObj.getUTCDate();
        const year = dateObj.getUTCFullYear();

        month = month >= 10 ? month : `0${month}`
        today = `${year}-${month}-${day}`

        if (today >= contest.endDate) throw "Sorry, you made it late."

        const session = await stripe.checkout.sessions.create({
            payment_method_types: ['card'],
            line_items: [
                {
                    price_data: {
                        currency: 'INR',
                        product_data: {
                            name: `Prize money for ${contest.contestName} contest.`,
                            images: [contest.coverPhoto.url]
                        },
                        unit_amount: contest.prizeMoney * 100,
                    },
                    quantity: 1,
                },
            ],
            mode: 'payment',
            success_url: `${url}/update-data/${id}`,
            cancel_url: `${url}/home`,
        });

        open(session.url)
            .then(() => {
                req.flash("success", "Your payment was successful")
                res.redirect("/home?")
            })
    } catch (err) {
        err = err ? err : "Can't able to initiate the payment process"
        console.log(err)
        req.flash("error", err)
        res.redirect("/home?")
    }
})

// Creating the checkout session for payment
router.post("/create-checkout-session", isLoggedIn, async (req, res) => {
    try {
        const { amount, id, image } = req.body
        const { username } = req.user
        const contest = await Contest.findOne({ _id: { $eq: id } })

        const session = await stripe.checkout.sessions.create({
            payment_method_types: ['card'],
            line_items: [
                {
                    price_data: {
                        currency: 'INR',
                        product_data: {
                            name: `Entry fee for ${contest.contestName} contest.`,
                            images: [image]
                        },
                        unit_amount: amount * 100,
                    },
                    quantity: 1,
                },
            ],
            mode: 'payment',
            success_url: `${url}/update-data/${username}/${id}`,
            cancel_url: `${url}/contest/${id}`,
        });

        res.status(200).json({ id: session.id, message: "payment success" });
    } catch (err) {
        console.log(err)
        res.status(200).json({ message: "Can't able to initiate the payment process" })
    }
})

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

router.post("/update-payment-status", isLoggedIn, async (req, res) => {
    try {
        const { id, username } = req.body
        await Payment.findOneAndUpdate({ winnerName: { $eq: username }, contestId: { $eq: id } }, { status: "Payment Done" }, { new: true })
        res.status(200).json({ message: "Payment Successful" })
    } catch (err) {
        res.status(200).json({ message: "Can't able to update the status. Try after sometime" })
    }    
})

module.exports = router
