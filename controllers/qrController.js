const QRCode = require('qrcode');
const User = require('../models/user');

const renderQrPage = async (req, res) => {
    try {
        const user = await User.findById(req.session.userId); // Lấy thông tin user từ session

        if (!user) {
            // Xử lý trường hợp không tìm thấy user trong session (ví dụ, user chưa đăng nhập)
            return res.redirect('/login'); // Chuyển hướng đến trang đăng nhập
        }

        res.render('qr', { user: user }); // Truyền biến user vào view
    } catch (err) {
        console.error("Error rendering QR page:", err);
        res.status(500).send("Internal Server Error"); // Hoặc render một trang lỗi khác
    }
};
const generateQrCode = async (req, res) => {
    const url = req.body.url;

    if (!url) {
        return res.status(400).json({ message: 'URL is required' });
    }

    try {
        const qrCodeDataURL = await QRCode.toDataURL(url);

        res.json({ qrCode: qrCodeDataURL }); // Return Data URL for image
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Failed to generate QR code' });
    }
};

module.exports = {
    renderQrPage,
    generateQrCode,
};