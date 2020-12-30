let chai = require("chai")
let chaiHttp = require("chai-http")
let {expect} = chai
let app = require("../app")
let mongoose = require("mongoose")
let dotenv = require("dotenv")
dotenv.config()
let chaiAsPromised = require("chai-as-promised")

chai.use(chaiHttp)
chai.use(chaiAsPromised)

let agent = chai.request.agent(app).keepOpen()

let sampleUser = {
    username: 'user',
    password: '12345'
}

describe("Logging in", () => {
    before("Connect to DB",done => {
        mongoose.connect(process.env.MONGODBURI).then(_ => {
            done()
        }).catch(err => {
            done(err)
        })
    })
    before("Drop Users Collection", done => {
        mongoose.connection.dropCollection("users").then(_ => {
            done()
        }).catch(err => {
            if (err.code == 26) {
                done() // Collection does not exist
            } else {
                done(err)
            }
        })
    })
    before("register a user", done => {
        agent.post("/auth/register")
        .type('form')
        .send(sampleUser).then(_ => {
            done()
        }).catch(err => {
            done(err)
        })
    })
    it("tries to log in with invalid credentials", done => {
        agent.post("/auth/login")
        .type('form')
        .send({
            username:'not a user',
            password: 'not a user'
        })
        .then(res => {
            expect(res).to.have.status(401)
            done()
        })
    })
    it("Tries to access a protected route without auth", done => {
        agent.post("/users/view/all")
        .then(res => {
            expect(res).to.have.status(401)
            done()
        }).catch(err => {
            done(err)
        })
    })
    it("Logs the user in", done => {
        agent.post("/auth/login")
        .type('form')
        .send(sampleUser)
        .then(res => {
            expect(res).to.have.status(200)
            done()
        }).catch(err => {
            done(err)
        })
    })
    it("tries to access a protected route with a valid token", done => {
        agent.get("/users/view/all")
        .then(res => {
            expect(res).to.have.status(200)
            done()
        }).catch(err => {
            done(err)
        })
    })
})