const express = require("express")
const router = express.Router();
const User = require("../models/user")
const passport = require("passport")
const { transporter, sender } = require("../settings")
const async = require("async")
const crypto = require("crypto")

router.get("/login", (req, res) => {
    res.render("Auth/login", { page: "login" })
})

router.post("/login", passport.authenticate('local', {
    failureRedirect: "/login"
}), (req, res) => {
    console.log("U logged in")
    res.redirect("/home")
})

router.get("/signup", (req, res) => {
    res.render("Auth/signup", { page: "signup" })
})

router.post("/signup", async (req, res) => {
    try {
        const { username, email, password, confirmPassword } = req.body
        const emailToken = crypto.randomBytes(30).toString("hex")
        if (password !== confirmPassword) throw "Password misspelled..."
        const user = new User({ username, email, emailToken })
        const newUser = await User.register(user, password)

        const body = `Hello, Thanks for registering on our site.
            Please click the below link to verify your account.
            https://${req.headers.host}/verify-email/${newUser.emailToken}
        `

        mailOptions = {
            from: sender,
            to: newUser.email,
            subject: "Email verification",
            text: body
        };

        transporter.sendMail(mailOptions, err => {
            if (err) return console.log("error occured", err)
            return console.log('mail sent');
        });
        console.log(newUser)
        res.redirect("/")
    } catch (err) {
        console.log(err)
        res.redirect("/signup")
    }
})

router.get("/verify-email/:id", async (req, res) => {
    try {
        const user = await User.findOneAndUpdate({ emailToken: { $eq: req.params.id } }, { emailToken: null, isEmailVerified: true })
        if (user.username === "Admin" && user.email === "achiever2704@gmail.com") {
            user.isAdmin = true;
            await user.save()
        }
        console.log(user)
        console.log("email verified...")
        req.login(user, err => {
            if (err) throw "Failed to authenticate"
            console.log("logged in")
            res.redirect("/home")
        })
    } catch (err) {
        console.log(err)
        res.redirect("/")
    }
})

router.get("/forgotPass", (req, res) => {
    res.render("Auth/forgot", { page: "ForgetPassword" })
})

router.post("/forgotPass", (req, res, next) => {
    async.waterfall([
        done => {
            crypto.randomBytes(20, (err, buf) => {
                const token = buf.toString('hex');
                done(err, token);
            });
        },
        (token, done) => {
            User.findOne({ email: { $eq: req.body.email } }, (err, user) => {
                if (!user) {
                    console.log("No account with this email address was registered")
                    return res.redirect('/account/forgotPass');
                }
                user.resetPasswordToken = token;
                user.resetPasswordExpires = Date.now() + 3600000; // 1 hour
                user.save(err => {
                    done(err, token, user);
                })
            });
        },
        (token, user, done) => {
            const body = `You are receiving this because you (or someone else) have requested the reset of the password for your account.\n\n'
                Please click on the following link, or paste this into your browser to complete the process:\n\n
                https://${req.headers.host}/reset/${token}\n\n
                If you did not request this, please ignore this email and your password will remain unchanged.\n
            `
            mailOptions = {
                from: sender,
                to: user.email,
                subject: "Forgot Password",
                text: body
            };
            transporter.sendMail(mailOptions, err => {
                console.log('mail sent');
                done(err, 'done');
            });
        }
    ], err => {
        if (err) return next(err);
        res.redirect('/forgotPass');
    });
})

router.get("/reset/:token", (req, res) => {
    const { token } = req.params;
    User.findOne({ resetPasswordToken: token, resetPasswordExpires: { $gt: Date.now() } }, (err, user) => {
        if (!user) {
            console.log("Password reset token is invalid or has expired.")
            return res.redirect('/forgotPass');
        }
        res.render('Auth/reset', { token: token, page: "Reset Password" });
    });
})

router.post("/reset/:token", (req, res) => {
    const { token } = req.params;
    async.waterfall([
        done => {
            User.findOne({ resetPasswordToken: token, resetPasswordExpires: { $gt: Date.now() } }, (err, user) => {
                if (!user) {
                    console.log("Password reset token is invalid or has expired.")
                    return res.redirect('back');
                }
                if (req.body.password === req.body.confirm) {
                    user.setPassword(req.body.password, err => {
                        user.resetPasswordToken = undefined;
                        user.resetPasswordExpires = undefined;

                        user.save(err => {
                            req.logIn(user, err => {
                                done(err, user);
                            });
                        });
                    })
                } else {
                    console.log("Passwords do not match.")
                    return res.redirect('back');
                }
            });
        },
        (user, done) => {
            const body = `Hello,\n\n
                This is a confirmation that the password for your account ${user.email} has just been changed.\n`

            mailOptions = {
                from: sender,
                to: user.email,
                subject: "Reset Password",
                text: body
            };

            transporter.sendMail(mailOptions, err => {
                console.log('mail sent');
                console.log("Success! Your password has been changed.")
                done(err, 'done');
            });
        }
    ], err => {
        res.redirect('/home');
    });
})

router.get("/logout", (req, res) => {
    req.logout()
    console.log("U logged out...")
    res.redirect("/")
})

module.exports = router
