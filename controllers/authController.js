const bcrypt = require('bcrypt');
const User = require('../models/user');

const login = async (req, res) => {
    try {
        const { username, password } = req.body;

        const user = await User.findOne({ username });
        if (!user) {
            console.warn('Invalid username');
            return res.status(401).json({ success: false, message: 'Tên người dùng hoặc mật khẩu không hợp lệ' });
        }

        const isPasswordValid = await bcrypt.compare(password, user.password);
        console.log(`Password match: ${isPasswordValid}`);
        if (!isPasswordValid) {
            console.warn('Invalid password');
            return res.status(401).json({ success: false, message: 'Tên người dùng hoặc mật khẩu không hợp lệ' });
        }

        req.session.userId = user._id;
        req.session.role = user.role;

        console.log('User logged in successfully:', username);
        return res.status(200).json({
            success: true,
            message: 'Login successful',
            redirectUrl: '/dashboard',
            user: { id: user._id, username: user.username, role: user.role }
        });
    } catch (error) {
        console.error('Error during login:', error);
        return res.status(500).json({ success: false, message: 'An error occurred during login', error: error.message });
    }
};

const logout = (req, res) => {
    req.session.destroy(() => {
        res.redirect('/');
    });
};
const renderChangePassword = async (req, res) => {
    res.render('change-password');
};

const changePassword = async (req, res) => {
    const { currentPassword, newPassword, confirmPassword } = req.body;

    if (!req.session.userId) {
        return res.status(401).json({ message: 'Unauthorized' });
    }

    if (newPassword !== confirmPassword) {
        return res.status(400).json({ message: 'Mật khẩu mới không khớp.' });
    }

    try {
        const user = await User.findById(req.session.userId);

        const isMatch = await bcrypt.compare(currentPassword, user.password);
        if (!isMatch) {
            return res.status(400).json({ message: 'Mật khẩu hiện tại không đúng.' });
        }

        const hashedPassword = await bcrypt.hash(newPassword, 10);
        user.password = hashedPassword;
        await user.save();
        return res.status(200).json({ message: 'Đã cập nhật mật khẩu thành công!' });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ error: 'Đã xảy ra lỗi khi cập nhật mật khẩu.' });
    }
};


module.exports = { login, logout, changePassword, renderChangePassword };