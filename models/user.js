let mongoose = require("mongoose")
let crypto = require("crypto")
let dotenv = require("dotenv")

dotenv.config()

let userSchema = new mongoose.Schema({
    username: {type: String, required: true},
    password: {type: String, required: true}
})
/**
 * Verify that the password conforms to the given RegExp pattern. Will throw an error if it does not. Will return the hashed password as a hex value if it it does.
 * @param {String} pass - The password as a plaintext string
 * @returns {String} - Hexadecimal password
 */
let processPass = pass => {
    // Make sure the password matches the pattern
    let pattern = new RegExp(process.env.CREDENTIAL_PATTERN)
    if (!pass.match(pattern)) {
        throw Error("bad-password")
    }
    // Hash the password
    let passHash = crypto.createHash(process.env.CRYPTOALGO)
    passHash.update(pass)
    return passHash.digest('hex')
}
/**
 * Test the username against the regex pattern to see if it is valid.
 * @param {String} name - Username to be tested
 */
let processUsername = name => {
    let pattern = new RegExp(process.env.CREDENTIAL_PATTERN)
    if (!name.match(pattern)) {
        throw Error("bad-username")
    }
}

// Called when a document is being modified
// userSchema.pre("findOneAndUpdate", async function(next) {
//     // We need to access the document first
//     let docToUpdate = await this.model.findOne(this.getQuery())
//     /**
//      * Note: Of course the username already exists that's why we are modifying it!
//      */
//     // Hash the password
//     docToUpdate.set('password',processPass(docToUpdate.get('password')))
//     // Verify the username
//     processUsername(docToUpdate.get('username'))
//     // Save the document
//     await docToUpdate.save()
//     // Proceed
//     next()
// })

// Called when a document is saved for the first time
userSchema.pre("save", async function(next) { // DO NOT USE ARROW FUNCTION AS THIS WILL BE UNDEFINED
    // Hash the password
    this.set('password',processPass(this.get('password')))
    // Verify the username
    processUsername(this.get('username'))
    // Proceed
    next()
})


let userModel = mongoose.model("user",userSchema)

module.exports = userModel