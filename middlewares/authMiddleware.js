function isAuthenticated(req, res, next) {
    if (!req.session.userId) {
        return res.redirect('/');
    }
    next();
}

function isAdmin(req, res, next) {
    if (req.session.role !== 'admin') {
        return res.status(403).send('Access Denied');
    }
    next();
}
module.exports = { isAuthenticated, isAdmin };