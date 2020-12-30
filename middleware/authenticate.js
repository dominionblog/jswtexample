let dotenv = require("dotenv")
let jwt = require("jsonwebtoken")

if (process.env.NODE_ENV != 'production') {
    dotenv.config()
}

module.exports = (req, res, next) => {
    let token = req.cookies.auth
    jwt.verify(token,process.env.SECRET,(err, decoded) => {
        if (err) {
            res.status(401)
            return res.render("index",{err: "Your session has expired. Please log in again", success: null})
        } else {
            req.decoded = decoded
            next()
        }
    })
}