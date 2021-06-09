const nodemailer = require("nodemailer")

module.exports = {
    sender: process.env.GMAIL_ADDRESS,
    transporter: nodemailer.createTransport({
        service: "Gmail",
        auth: {
            user: process.env.GMAIL_ADDRESS,
            pass: process.env.GMAIL_PASS
        }
    })
}
