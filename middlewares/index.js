module.exports.isLoggedIn = (req, res, next) => {
    if (!req.isAuthenticated()) {
        req.flash("error", "You need to be LoggedIn");
        return res.redirect("/login");
    }
    next();
}

module.exports.isAdmin = (req, res, next) => {
    if (!req.user.isAdmin) {
        req.flash("error", "This is Admin privileged page. You don't have access to this page.")
        return res.redirect("/home")
    }
    next()
}
