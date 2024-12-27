// Import necessary modules
const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const session = require('express-session');
const bcrypt = require('bcrypt');
const path = require('path');
const app = express();
const ExcelJS = require('exceljs');

// Middleware
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(session({
    secret: 'your-secret-key',
    resave: false,
    saveUninitialized: true,
}));
// Serve static files (CSS, images, etc.)
app.use(express.static(path.join(__dirname, 'public')));

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Connect to MongoDB
const uri = 'mongodb://127.0.0.1:27017/WebTTYT';

mongoose
    .connect(uri, { useNewUrlParser: true, useUnifiedTopology: true })
    .then(() => console.log('Connected to MongoDB using Mongoose!'))
    .catch((err) => console.error('Error connecting to MongoDB:', err));

const db = mongoose.connection;
db.on('error', console.error.bind(console, 'MongoDB connection error:'));
db.once('open', () => {
    console.log('Connected to MongoDB');
});

// Define schemas and models
const UserSchema = new mongoose.Schema({
    name: { type: String, required: true }, // Thêm trường tên người dùng
    username: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    role: { type: String, enum: ['admin', 'user'], default: 'user' },
});


const ReportSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    totalVisits: { type: Number, required: true },
    childrenUnder14: { type: Number, required: true },
    visitsWithIDExcludingChildren: { type: Number, required: true },
    reportingUnit: { type: String, required: true },
    month: { type: Number, required: true },
    year: { type: Number, required: true },
    modifications: [{
        modifiedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }, // Người sửa
        modifiedAt: { type: Date, default: Date.now }, // Thời gian sửa
        modificationCount: { type: Number, default: 0 }, // Số lần sửa
    }],
    createdAt: { type: Date, default: Date.now }, // Thêm trường createdAt
    birthCertificate: { type: Number, required: true },
    deathCertificate: { type: Number, required: true },
});

const User = mongoose.model('User', UserSchema);
const Report = mongoose.model('Report', ReportSchema);

// Routes
app.get('/', (req, res) => {
    res.render('login');
});


// User login
app.post('/login', async (req, res) => {
    try {
        const { username, password } = req.body;

        // Hiển thị thông tin đăng nhập (debug)
        console.log('Received login request:');
        console.log('Username:', username);
        console.log('Password:', password);

        // Tìm người dùng trong cơ sở dữ liệu
        const user = await User.findOne({ username: username });
        if (!user) {
            console.warn('Invalid username');
            return res.status(401).json({ success: false, message: 'Tên người dùng hoặc mật khẩu không hợp lệ' });
        }

        // Kiểm tra mật khẩu
        const isPasswordValid = await bcrypt.compare(password, user.password);
        console.log(`Password match: ${isPasswordValid}`);
        if (!isPasswordValid) {
            console.warn('Invalid password');
            return res.status(401).json({ success: false, message: 'Tên người dùng hoặc mật khẩu không hợp lệ' });
        }

        // Lưu trạng thái đăng nhập vào session
        req.session.userId = user._id;
        req.session.role = user.role;

        // Phản hồi thành công
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
});




// Middleware to check login status
function isAuthenticated(req, res, next) {
    if (!req.session.userId) {
        return res.redirect('/');
    }
    next();
}
// Logout route
app.get('/logout', (req, res) => {
    req.session.destroy(() => {
        res.redirect('/'); // Redirect to home page after logout
    });
});

// Áp dụng middleware
app.get('/change-password', isAuthenticated, (req, res) => {
    res.render('change-password', { user: req.session.user });
});
app.post('/user/change-password', async (req, res) => {
    const { currentPassword, newPassword, confirmPassword } = req.body;

    if (!req.session.userId) {
        return res.status(401).json({ message: 'Unauthorized' });
    }

    if (newPassword !== confirmPassword) {
        return res.status(400).json({ message: 'Mật khẩu mới không khớp.' });
    }

    try {
        const user = await User.findById(req.session.userId);

        // Kiểm tra mật khẩu hiện tại
        const isMatch = await bcrypt.compare(currentPassword, user.password);
        if (!isMatch) {
            return res.status(400).json({ message: 'Mật khẩu hiện tại không đúng.' });
        }

        // Mã hóa và cập nhật mật khẩu mới
        const hashedPassword = await bcrypt.hash(newPassword, 10);
        user.password = hashedPassword;
        await user.save();
        // Instead of redirecting, send a success response
        return res.status(200).json({ message: 'Đã cập nhật mật khẩu thành công!' });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ error: 'Đã xảy ra lỗi khi cập nhật mật khẩu.' });
    }
});


// Admin route to add users
app.post('/admin/add-user', async (req, res) => {
    if (req.session.role !== 'admin') {
        return res.status(403).json({ success: false, message: 'Access denied' });
    }

    try {
        const { name, username, password, role } = req.body;

        if (!name || !username || !password || !role) {
            return res.status(400).json({ success: false, message: 'All fields are required' });
        }

        const existingUser = await User.findOne({ username });
        if (existingUser) {
            return res.status(400).json({ success: false, message: 'Username already exists' });
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        const user = new User({
            name,
            username,
            password: hashedPassword,
            role,
        });

        await user.save();

        res.status(201).json({ success: true, message: 'User added successfully' });
    } catch (error) {
        console.error('Error adding user:', error);
        res.status(500).json({ success: false, message: 'An error occurred', error: error.message });
    }
});

// Dashboard route
app.get('/dashboard', isAuthenticated, async (req, res) => {
    try {
        const user = await User.findById(req.session.userId);

        let reports;
        if (user.role === 'admin') {
            reports = await Report.find()
                .sort({ createdAt: -1 }) // Sắp xếp báo cáo theo thời gian tạo (mới nhất lên trên)
                .populate('userId', 'username role')
                .populate('modifications.modifiedBy', 'username'); // Populate user info for both report and modification
        } else {
            reports = await Report.find({ userId: req.session.userId })
                .sort({ createdAt: -1 }) // Sắp xếp báo cáo theo thời gian tạo
                .populate('modifications.modifiedBy', 'username');
        }

        res.render('dashboard', { user, reports });
    } catch (error) {
        res.status(500).send('Unable to load dashboard');
    }
});


// Update a specific report
app.put('/reports/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const updateData = req.body;

        const report = await Report.findById(id);
        if (!report) return res.status(404).send('Report not found');

        Object.assign(report, updateData);
        report.modifications.push({ modificationCount: report.modifications.length + 1 });

        await report.save();
        res.status(200).send('Report updated successfully');
    } catch (error) {
        res.status(400).send(error);
    }
});
// Add or Edit a report
app.post('/reports/add', async (req, res) => {
    try {
        const { reportId, totalVisits, childrenUnder14, visitsWithIDExcludingChildren, reportingUnit, month, year, birthCertificate, deathCertificate } = req.body;

        if (reportId) {
            // Update existing report
            const report = await Report.findOne({ _id: reportId, userId: req.session.userId });
            if (!report) return res.status(404).send('Report not found');

            report.totalVisits = totalVisits || report.totalVisits;
            report.childrenUnder14 = childrenUnder14 || report.childrenUnder14;
            report.visitsWithIDExcludingChildren = visitsWithIDExcludingChildren || report.visitsWithIDExcludingChildren;
            report.reportingUnit = reportingUnit || report.reportingUnit;
            report.month = month || report.month;
            report.year = year || report.year;
            report.birthCertificate = birthCertificate || report.birthCertificate;
            report.deathCertificate = deathCertificate || report.deathCertificate;
            report.modifications.push({ modificationCount: report.modifications.length + 1 });
            await report.save();
        } else {
            // Add a new report
            const report = new Report({
                userId: req.session.userId,
                totalVisits,
                childrenUnder14,
                visitsWithIDExcludingChildren,
                reportingUnit,
                month,
                year,
                birthCertificate,
                deathCertificate,
            });
            await report.save();
        }

        res.redirect('/dashboard');
    } catch (error) {
        res.status(400).send(error.message);
    }
});

// Delete a report
app.post('/reports/delete/:id', async (req, res) => {
    try {
        // Kiểm tra xem người dùng có đăng nhập không
        if (!req.session.userId) return res.status(401).send('Please log in');

        const reportId = req.params.id;

        // Tìm báo cáo trong cơ sở dữ liệu
        const report = await Report.findById(reportId);

        if (!report) return res.status(404).send('Report not found');

        // Chỉ cho phép admin xóa báo cáo
        if (req.session.role === 'admin') {
            // Xóa báo cáo
            await Report.deleteOne({ _id: reportId });

            res.redirect('/dashboard'); // Quay lại trang dashboard
        } else {
            return res.status(403).send('You do not have permission to delete this report');
        }
    } catch (error) {
        res.status(500).send(error);
    }
});


// Edit a report
app.post('/reports/edit/:id', async (req, res) => {
    try {
        if (!req.session.userId) return res.status(401).send('Please log in');

        const reportId = req.params.id;
        const { totalVisits, childrenUnder14, visitsWithIDExcludingChildren, reportingUnit, month, year, birthCertificate, deathCertificate } = req.body;

        console.log('Received data for editing:', req.body); // Kiểm tra dữ liệu nhận từ form

        // Find the report by ID
        const report = await Report.findById(reportId);

        // Check if report exists
        if (!report) return res.status(404).send('Report not found');

        // Admin can edit any report, users can only edit their own
        if (req.session.role === 'admin' || report.userId.toString() === req.session.userId.toString()) {
            // Update the report with new values (if provided)
            report.totalVisits = totalVisits || report.totalVisits;
            report.childrenUnder14 = childrenUnder14 || report.childrenUnder14;
            report.visitsWithIDExcludingChildren = visitsWithIDExcludingChildren || report.visitsWithIDExcludingChildren;
            report.reportingUnit = reportingUnit || report.reportingUnit;
            report.month = month || report.month;
            report.year = year || report.year;
            report.birthCertificate = birthCertificate || report.birthCertificate;
            report.deathCertificate = deathCertificate || report.deathCertificate;
            // Add a modification record with who modified it and when
            report.modifications.push({
                modifiedBy: req.session.userId, // Lưu userId từ session
                modifiedAt: new Date(), // Lưu thời gian sửa
                modificationCount: report.modifications.length + 1
            });

            // Save the updated report
            await report.save();

            console.log('Report updated successfully');
            // Redirect back to the dashboard
            res.redirect('/dashboard');
        } else {
            return res.status(403).send('You do not have permission to edit this report');
        }
    } catch (error) {
        console.error('Error updating report:', error); // Log error for debugging
        res.status(400).send(error);
    }
});
//xuất báo cáo
app.get('/reports/export', async (req, res) => {
    if (req.session.role !== 'admin') {
        return res.status(403).send('Access denied');
    }

    try {
        const { month, year } = req.query;

        if (!month || !year) {
            return res.status(400).send('Month and year are required');
        }

        // Lấy báo cáo của tất cả người dùng cho tháng và năm đã cho
        const reports = await Report.find({ month: month, year: year })
            .populate('userId', 'username')
            .populate('modifications.modifiedBy', 'username');

        // Tạo workbook và worksheet mới
        const workbook = new ExcelJS.Workbook();
        const worksheet = workbook.addWorksheet('Reports');

        // Đặt tiêu đề cột cho file Excel
        worksheet.columns = [
            { header: 'Report ID', key: 'reportId', width: 20 },
            { header: 'User', key: 'user', width: 30 },
            { header: 'Tổng lượt khám', key: 'totalVisits', width: 15 },
            { header: 'Trẻ em dưới 14 tuổi', key: 'childrenUnder14', width: 20 },
            { header: 'Khám có CCCD (Không bao gồm trẻ em)', key: 'visitsWithIDExcludingChildren', width: 30 },
            { header: 'Giất chứng sinh', key: 'birthCertificate', width: 30 },
            { header: 'Giất chứng tử', key: 'deathCertificate', width: 30 },
            { header: 'Reporting Unit', key: 'reportingUnit', width: 30 },
            { header: 'Month', key: 'month', width: 10 },
            { header: 'Year', key: 'year', width: 10 },
        ];

        // Thêm dữ liệu vào worksheet
        reports.forEach(report => {
            // Sắp xếp danh sách sửa đổi theo thời gian tăng dần
            const sortedModifications = [...report.modifications].sort((a, b) => new Date(a.modifiedAt) - new Date(b.modifiedAt));

            // Lấy giá trị cuối cùng của từng trường (sau khi sửa đổi)
            const finalData = {
                reportId: report._id,
                user: report.userId.username,
                totalVisits: sortedModifications.reduce((value, mod) => mod.totalVisits ?? value, report.totalVisits),
                childrenUnder14: sortedModifications.reduce((value, mod) => mod.childrenUnder14 ?? value, report.childrenUnder14),
                visitsWithIDExcludingChildren: sortedModifications.reduce((value, mod) => mod.visitsWithIDExcludingChildren ?? value, report.visitsWithIDExcludingChildren),
                birthCertificate: sortedModifications.reduce((value, mod) => mod.birthCertificate ?? value, report.birthCertificate),
                deathCertificate: sortedModifications.reduce((value, mod) => mod.deathCertificate ?? value, report.deathCertificate),
                reportingUnit: sortedModifications.reduce((value, mod) => mod.reportingUnit ?? value, report.reportingUnit),
                month: report.month,
                year: report.year,
            };

            // Thêm dòng dữ liệu vào worksheet
            worksheet.addRow(finalData);
        });

        // Đặt header cho file Excel
        worksheet.getRow(1).font = { bold: true };
        // Đặt tên file dựa trên tháng và năm
        const fileName = `reports-${month}-${year}.xlsx`;
        // Gửi file Excel cho người dùng
        res.setHeader('Content-Disposition', `attachment; filename=${fileName}`);
        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');

        // Gửi file Excel tới trình duyệt
        await workbook.xlsx.write(res);
        res.end();
    } catch (error) {
        console.error('Error exporting reports:', error);
        res.status(500).send('Error exporting reports');
    }
});



// Start the server
const PORT = 3000;
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
