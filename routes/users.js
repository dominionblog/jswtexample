let express = require('express');
let router = express.Router()
let User = require("../models/user")
let processRedirect = require("../global_functions/processRedirect")
let queryString = require("query-string")

router.put("/edit/:id", async (req, res) => {
    let user = await User.findById(req.params.id)
    user.set("username",req.body.username)
    user.save().then(_ => {
        res.status(200)
        res.render("edituser",{user: user,err: null, success: "Changes saved!"})
    }).catch(err => {
        if (err.type = "ValidationError") {
            res.status(400)
            return res.render("edituser",{user: user, err: "The username you supplied does not correspond with the guidlines.", success: null})
        }
        res.status(500)
        res.render("edituser",{user:user, err: "An unknown error occured", success: null})
    })
})
router.delete("/delete/:id", async (req, res) => {
    User.findByIdAndDelete(req.params.id).then(doc => {
        if (req.decoded.id == doc.get('id')) {
            return res.redirect("/auth/logout") // The account that is currently open no longer exists
        }
        // Show the user that a deletation successfully occured
        let params = queryString.stringify({
            success: "User deleted"
        })
        res.redirect("/users/view/all?" + params)
    }).catch(err => {
        res.status(500)
        res.render("index",{err: "An unknown error occured and your changes could not be saved", success: null})
    })
})
router.get("/view/all", async (req, res) => {
    let users = await User.find().lean()
    processRedirect(req)
    res.render("allusers",{users: users, user: req.decoded, err: req.query.err, success: req.query.success})
})
router.get("/view/:id", async (req, res) => {
    let user = await User.findById(req.params.id)
    processRedirect(req)
    res.render("edituser",{user: user, success: req.query.success, err: req.query.err})
})

module.exports = router