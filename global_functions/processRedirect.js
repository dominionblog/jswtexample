module.exports = req => {
    req.query.err = typeof req.query.err == 'string' ? req.query.err : null
    req.query.success = typeof req.query.success == "string" ? req.query.success : null
}