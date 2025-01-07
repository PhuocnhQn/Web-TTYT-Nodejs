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
        modificationsDetails: [{  // Lưu thông tin chi tiết sửa đổi
            field: { type: String, required: true },  // Tên trường bị sửa đổi
            oldValue: { type: mongoose.Schema.Types.Mixed },  // Giá trị cũ
            newValue: { type: mongoose.Schema.Types.Mixed },  // Giá trị mới
        }],
    }],
    createdAt: { type: Date, default: Date.now }, // Thêm trường createdAt
    birthCertificate: { type: Number, required: true },
    deathCertificate: { type: Number, required: true },
    percentage: { type: Number, required: true }, // Percentage field
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
// Function to fetch users from MongoDB using async/await
async function fetchUsersFromDatabase() {
    try {
        const users = await User.find({});
        return users;
    } catch (err) {
        throw err;  // You can handle the error here or throw it to be handled later
    }
}

// Route for displaying the add-user page
app.get('/add-user', async (req, res) => {
    if (req.session.role !== 'admin') {
        return res.status(403).send('Access Denied');
    }

    try {
        const users = await fetchUsersFromDatabase();
        res.render('addUser', { users });
    } catch (err) {
        res.status(500).send('Error fetching users');
    }
});
app.post('/add-user', (req, res) => {
    if (req.session.role !== 'admin') {
        return res.status(403).send('Access Denied');  // Deny access if not admin
    }

    const { name, username, password, role } = req.body;

    // Hash the password before storing it
    bcrypt.hash(password, 10, (err, hashedPassword) => {
        if (err) {
            console.error(err);
            return res.status(500).send('Error hashing password');
        }

        const newUser = new User({
            name,
            username,
            password: hashedPassword,
            role
        });

        newUser.save()
            .then(() => {
                // After user is added, fetch the updated user list
                User.find()
                    .then((users) => {
                        res.render('addUser', { users });  // Render the updated user list
                    })
                    .catch((err) => {
                        console.error(err);
                        res.status(500).send('Error fetching users');
                    });
            })
            .catch((err) => {
                console.error(err);
                res.status(500).send('Error adding user');
            });
    });
});
// Route để lấy danh sách người dùng và hiển thị trên trang
app.get('/admin/get-users', async (req, res) => {
    if (req.session.role !== 'admin') {
        return res.status(403).send('Access Denied');
    }

    try {
        const users = await User.find();  // Lấy tất cả người dùng từ cơ sở dữ liệu
        res.render('addUser', { users });  // Truyền 'users' vào render
    } catch (error) {
        console.error('Error fetching users:', error);
        res.status(500).json({ success: false, message: 'An error occurred while fetching users' });
    }
});




// Route để lấy thông tin người dùng theo ID
app.get('/admin/get-user/:id', async (req, res) => {
    const { id } = req.params;
    if (req.session.role !== 'admin') {
        return res.status(403).json({ success: false, message: 'Access denied' });
    }

    try {
        const user = await User.findById(id);
        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }
        res.status(200).json({ success: true, user });
    } catch (error) {
        console.error('Error fetching user:', error);
        res.status(500).json({ success: false, message: 'An error occurred while fetching the user' });
    }
});

// Route để xóa người dùng theo ID
app.post('/delete-user/:id', (req, res) => {
    // Check if the user is an admin
    if (req.session.role !== 'admin') {
        return res.status(403).send('Access Denied');  // Deny access if not admin
    }

    const userId = req.params.id;

    User.findByIdAndDelete(userId)
        .then(() => {
            // After deletion, fetch the remaining users and render the page again
            User.find()
                .then((users) => {
                    res.render('addUser', { users });  // Pass the updated users list to the view
                })
                .catch((err) => {
                    console.error(err);
                    res.status(500).send('Error fetching users');
                });
        })
        .catch((err) => {
            console.error(err);
            res.status(500).send('Error deleting user');
        });
});
// Route to handle updating user details (with optional password update)
app.post('/edit-user/:id', async (req, res) => {
    // Check if the user is an admin
    if (req.session.role !== 'admin') {
        return res.status(403).send('Access Denied'); // Deny access if not admin
    }

    const userId = req.params.id;
    const { name, username, role, password } = req.body;

    try {
        const updateData = { name, username, role };

        // If a new password is provided, hash it
        if (password && password.trim() !== '') {
            const hashedPassword = await bcrypt.hash(password, 10);
            updateData.password = hashedPassword; // Add hashed password to update data
        }

        // Update user details in the database
        await User.findByIdAndUpdate(userId, updateData, { new: true });

        // Fetch all users and render the addUser page
        const users = await User.find();
        res.render('addUser', { users }); // Pass the users array to the view
    } catch (err) {
        console.error(err);
        res.status(500).send('Error updating user');
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

        // Calculate the percentage
        const totalVisitsExcludingChildren = totalVisits - childrenUnder14;
        const percentage = totalVisitsExcludingChildren > 0 ?
            ((visitsWithIDExcludingChildren / totalVisitsExcludingChildren) * 100).toFixed(2) :
            0;

        if (reportId) {
            // Update existing report
            const report = await Report.findOne({ _id: reportId, userId: req.session.userId });
            if (!report) return res.status(404).send('Report not found');

            // Update report fields
            report.totalVisits = totalVisits || report.totalVisits;
            report.childrenUnder14 = childrenUnder14 || report.childrenUnder14;
            report.visitsWithIDExcludingChildren = visitsWithIDExcludingChildren || report.visitsWithIDExcludingChildren;
            report.reportingUnit = reportingUnit || report.reportingUnit;
            report.month = month || report.month;
            report.year = year || report.year;
            report.birthCertificate = birthCertificate || report.birthCertificate;
            report.deathCertificate = deathCertificate || report.deathCertificate;
            report.percentage = percentage || report.percentage;  // Add the percentage to the report
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
                percentage,  // Add the percentage to the new report
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
            // Create an array to hold the modifications details
            let modificationsDetails = [];

            // Check and record the changes
            if (totalVisits && totalVisits !== report.totalVisits) {
                modificationsDetails.push({ field: 'Tổng lượt KCB', oldValue: report.totalVisits, newValue: totalVisits });
                report.totalVisits = totalVisits;
            }
            if (childrenUnder14 && childrenUnder14 !== report.childrenUnder14) {
                modificationsDetails.push({ field: 'Trẻ em dưới 14 tuổi', oldValue: report.childrenUnder14, newValue: childrenUnder14 });
                report.childrenUnder14 = childrenUnder14;
            }
            if (visitsWithIDExcludingChildren && visitsWithIDExcludingChildren !== report.visitsWithIDExcludingChildren) {
                modificationsDetails.push({ field: 'Khám có CCCD (Không bao gồm trẻ em)', oldValue: report.visitsWithIDExcludingChildren, newValue: visitsWithIDExcludingChildren });
                report.visitsWithIDExcludingChildren = visitsWithIDExcludingChildren;
            }
            if (reportingUnit && reportingUnit !== report.reportingUnit) {
                modificationsDetails.push({ field: 'Đơn vị', oldValue: report.reportingUnit, newValue: reportingUnit });
                report.reportingUnit = reportingUnit;
            }
            if (month && month !== report.month) {
                modificationsDetails.push({ field: 'Tháng', oldValue: report.month, newValue: month });
                report.month = month;
            }
            if (year && year !== report.year) {
                modificationsDetails.push({ field: 'Năm', oldValue: report.year, newValue: year });
                report.year = year;
            }
            if (birthCertificate && birthCertificate !== report.birthCertificate) {
                modificationsDetails.push({ field: 'Giấy chứng sinh', oldValue: report.birthCertificate, newValue: birthCertificate });
                report.birthCertificate = birthCertificate;
            }
            if (deathCertificate && deathCertificate !== report.deathCertificate) {
                modificationsDetails.push({ field: 'Giấy chứng tử', oldValue: report.deathCertificate, newValue: deathCertificate });
                report.deathCertificate = deathCertificate;
            }

            // Nếu có thay đổi, tính lại tỷ lệ phần trăm
            if (totalVisits && childrenUnder14 && visitsWithIDExcludingChildren) {
                const totalVisitsExcludingChildren = totalVisits - childrenUnder14;
                const percentage = totalVisitsExcludingChildren > 0 ? ((visitsWithIDExcludingChildren / totalVisitsExcludingChildren) * 100).toFixed(2) : 0;
                report.percentage = percentage || report.percentage; // Set the recalculated percentage only if needed
            }

            // Add the modification details with who modified it and when
            if (modificationsDetails.length > 0) {
                report.modifications.push({
                    modifiedBy: req.session.userId, // Lưu userId từ session
                    modifiedAt: new Date(), // Lưu thời gian sửa
                    modificationCount: report.modifications.length + 1,
                    modificationsDetails // Lưu thông tin sửa đổi chi tiết
                });

                // Save the updated report
                await report.save();

                console.log('Report updated successfully');
            }

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


// Route để lấy thông tin sửa đổi chi tiết
app.get('/reports/view/:id', async (req, res) => {  // Đổi tên route này cho rõ ràng hơn
    try {
        const reportId = req.params.id;
        const report = await Report.findById(reportId).populate('modifications.modifiedBy', 'username');  // Populate với tên người sửa

        if (!report) {
            return res.status(404).send('Report not found');
        }

        // Trả về dữ liệu báo cáo, bao gồm cả thông tin sửa đổi
        res.render('report-detail', { report });
    } catch (error) {
        console.error('Error fetching report details:', error);
        res.status(500).send('Internal server error');
    }
});
app.get('/reports/view-modification/:modificationId', async (req, res) => {
    try {
        const modificationId = req.params.modificationId;

        // Tìm sửa đổi theo ID trong mảng modifications
        const report = await Report.findOne({ 'modifications._id': modificationId })
            .populate('modifications.modifiedBy', 'username email'); // Lấy thêm email nếu cần

        if (!report) {
            return res.status(404).json({ error: 'Modification not found' });
        }

        // Tìm sửa đổi cụ thể trong mảng modifications
        const modification = report.modifications.id(modificationId);

        if (!modification) {
            return res.status(404).json({ error: 'Modification detail not found' });
        }

        // Lọc ra các thay đổi thực sự (các thay đổi giữa oldValue và newValue)
        const changes = modification.modificationsDetails.filter(detail =>
            detail.oldValue !== detail.newValue
        );

        // Trả về thông tin sửa đổi nếu có thay đổi thực sự
        res.json({
            modifiedBy: modification.modifiedBy.username,
            modifiedAt: modification.modifiedAt,
            modificationsDetails: changes.length > 0 ? changes : []  // Chỉ trả về thay đổi nếu có
        });
    } catch (error) {
        console.error('Error fetching modification details:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});



app.get('/export', (req, res) => {
    if (req.session.role !== 'admin') {
        return res.status(403).send('Access denied');
    }

    // Render the export form page (export.ejs)
    res.render('export');
});
app.get('/reports/view', async (req, res) => {
    try {
        const { month, year } = req.query; // Lấy tháng và năm từ query string

        if (!month || !year) {
            // Nếu chưa chọn tháng và năm, hiển thị trang với thông báo
            return res.render('viewReports', {
                reports: [],
                usersWithoutReports: [],
                month: null,
                year: null,
            });
        }

        // Lấy danh sách báo cáo trong tháng và năm được chỉ định
        const reports = await Report.find({ month, year });

        // Lấy danh sách tất cả người dùng
        const users = await User.find();

        // Lọc danh sách báo cáo để loại bỏ báo cáo của admin
        const adminIds = users.filter(user => user.role === 'admin').map(admin => admin._id.toString());
        const filteredReports = reports.filter(report => !adminIds.includes(report.userId.toString()));

        // Tìm user chưa báo cáo (không phải admin)
        const userIdsWithReports = filteredReports.map(report => report.userId.toString());
        const usersWithoutReports = users
            .filter(user => user.role !== 'admin') // Chỉ lọc người dùng không phải admin
            .filter(user => !userIdsWithReports.includes(user._id.toString()));

        res.render('viewReports', {
            reports: filteredReports, // Chỉ hiển thị báo cáo không phải của admin
            usersWithoutReports,
            month,
            year,
        });
    } catch (error) {
        console.error(error);
        res.status(500).send('Error fetching reports');
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
            { header: 'Percentage', key: 'percentage', width: 15 }, // Add percentage column
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
                percentage: sortedModifications.reduce((value, mod) => mod.percentage ?? value, report.percentage),
                month: report.month,
                year: report.year,
            };

            // // Calculate the percentage based on the formula
            // const totalVisitsExcludingChildren = finalData.totalVisits - finalData.childrenUnder14;
            // finalData.percentage = totalVisitsExcludingChildren > 0 ?
            //     ((finalData.visitsWithIDExcludingChildren / totalVisitsExcludingChildren) * 100).toFixed(2) :
            //     0;

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
