const User = require('../models/user');
const Report = require('../models/report');

const dashboard = async (req, res) => {
    try {
        const user = await User.findById(req.session.userId);

        let reports;
        if (user.role === 'admin') {
            reports = await Report.find()
                .sort({ createdAt: -1 })
                .populate('userId', 'username role')
                .populate('modifications.modifiedBy', 'username');
        } else {
            reports = await Report.find({ userId: req.session.userId })
                .sort({ createdAt: -1 })
                .populate('modifications.modifiedBy', 'username');
        }
        res.render('dashboard', { user, reports });
    } catch (error) {
        // res.status(500).send('Unable to load dashboard');
        res.status(500).json({ error: 'Unable to load dashboard', serverError: true });
    }
};
// Server Time route handler
const serverTime = async (req, res) => {
    try {
        // Get current server time
        const currentTime = new Date();
        res.json({ time: currentTime });
    } catch (error) {
        // Return error if something goes wrong
        res.status(500).json({ error: 'Unable to fetch server time', serverError: true });
    }
};

module.exports = { dashboard, serverTime };