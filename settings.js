const nodemailer = require("nodemailer")

module.exports = {
    sender: "agile11fantasycricket@gmail.com",
    transporter: nodemailer.createTransport({
        service: "Gmail",
        auth: {
            user: "agile11fantasycricket@gmail.com",
            pass: "Agile@11@2021"
        }
    })
}
