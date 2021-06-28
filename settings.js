let url
if (process.env.NODE_ENV === "production") url = "https://infinite-skill.herokuapp.com"
else url = "http://localhost:3000"

const nodemailer = require("nodemailer")

module.exports = {
    url,
    sender: process.env.GMAIL_ADDRESS,
    transporter: nodemailer.createTransport({
        service: "Gmail",
        auth: {
            user: process.env.GMAIL_ADDRESS,
            pass: process.env.GMAIL_PASS
        }
    })
}
