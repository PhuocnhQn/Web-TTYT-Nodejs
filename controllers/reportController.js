const Report = require('../models/report');
const User = require('../models/user');
const reportService = require('../services/reportService');
const path = require('path');
const fs = require('fs');
const xlsx = require("xlsx");

const addOrEditReport = async (req, res) => {
    try {
        const { reportId, totalVisits, childrenUnder14, visitsWithIDExcludingChildren, reportingUnit, month, year, birthCertificate, deathCertificate } = req.body;

        // Kiểm tra xem tháng và năm đã tồn tại trong cơ sở dữ liệu chưa
        const existingReport = await Report.findOne({ month, year, userId: req.session.userId });
        if (existingReport && !reportId) {
            return res.status(400).json({ error: { message: `Đã có báo cáo cho tháng ${month} năm ${year}. Không thể thêm báo cáo mới.`, type: 'server' }, serverError: true });
        }
        // Kiểm tra xem báo cáo có tháng và năm nhỏ hơn tháng hiện tại không
        const currentDate = new Date();
        const currentMonth = currentDate.getMonth() + 1; // Lấy tháng hiện tại
        const currentYear = currentDate.getFullYear(); // Lấy năm hiện tại
        const currentDay = (currentDate.getDate());
        // So sánh tháng và năm báo cáo với tháng/năm hiện tại
        const isWithinEditPeriod = (reportYear, reportMonth) => {
            reportYear = Number(reportYear);
            reportMonth = Number(reportMonth);
            const currentDate = new Date();
            const currentYear = currentDate.getFullYear();
            const currentMonth = currentDate.getMonth() + 1;
            const currentDay = currentDate.getDate();

            if (currentYear < reportYear) {
                return { isAllowed: true, message: "Báo cáo thuộc năm tương lai, có thể chỉnh sửa." };
            }

            if (currentYear === reportYear) {
                if (currentMonth < reportMonth) {
                    return { isAllowed: true, message: "Báo cáo thuộc tháng tương lai, có thể chỉnh sửa." };
                }
                if (currentMonth === reportMonth && currentDay <= 5) {
                    return { isAllowed: true, message: "Báo cáo thuộc tháng hiện tại và trong thời gian chỉnh sửa (trước ngày 6)." };
                }
            }

            return { isAllowed: false, message: `Không thể thêm báo cáo cho tháng ${reportMonth}/${reportYear} vì đã quá hạn.` };
        };

        //kiểm tra xem có trong kỳ hạn chỉnh sửa không
        const editCheck = isWithinEditPeriod(year, month);
        if (req.session.role !== 'admin' && !editCheck.isAllowed) {
            return res.status(400).json({
                error: {
                    message: editCheck.message, // Chỉ trả về thông báo khi không được phép chỉnh sửa
                    type: 'server'
                },
                serverError: true
            });
        }


        // Tính tỷ lệ phần trăm
        const totalVisitsExcludingChildren = totalVisits - childrenUnder14;
        const percentage = totalVisitsExcludingChildren > 0 ?
            ((visitsWithIDExcludingChildren / totalVisitsExcludingChildren) * 100).toFixed(2) :
            0;

        // Thêm báo cáo mới
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
            percentage,  // Thêm tỷ lệ phần trăm cho báo cáo mới
        });
        await report.save();
        // }

        // res.redirect('/dashboard');
        return res.json({ message: 'Gửi báo cáo thành công!', success: true });
    } catch (error) {
        console.error("Error in addOrEditReport:", error);
        res.status(400).json({ error: { message: error.message, type: 'server' }, serverError: true });
    }
};


// Delete a report
const deleteReport = async (req, res) => {
    try {
        if (!req.session.userId) return res.status(401).json({ error: { message: 'Please log in', type: 'server' }, serverError: true });

        const reportId = req.params.id;

        const report = await Report.findById(reportId);

        if (!report) return res.status(404).json({ error: { message: 'Report not found', type: 'server' }, serverError: true });

        if (req.session.role === 'admin') {
            await Report.deleteOne({ _id: reportId });
            res.redirect('/dashboard');
        } else {
            return res.status(403).json({ error: { message: 'You do not have permission to delete this report', type: 'server' }, serverError: true });
        }
    } catch (error) {
        console.error("Error in deleteReport:", error);
        res.status(500).json({ error: { message: error.message, type: 'server' }, serverError: true });
    }
};

// Edit a report

const editReport = async (req, res) => {
    try {
        if (!req.session.userId) {
            return res.status(401).json({ error: { message: 'Please log in', type: 'server' }, serverError: true });
        }

        const reportId = req.params.id;
        const { totalVisits, childrenUnder14, visitsWithIDExcludingChildren, reportingUnit, month, year, birthCertificate, deathCertificate } = req.body;

        // Tìm báo cáo theo ID
        const report = await Report.findById(reportId);
        if (!report) {
            return res.status(404).json({ error: { message: 'Report not found', type: 'server' }, serverError: true });
        }

        // Kiểm tra xem có báo cáo nào khác cùng tháng/năm không
        const existingReport = await Report.findOne({
            month,
            year,
            userId: req.session.userId,
            _id: { $ne: reportId } // Loại trừ chính báo cáo đang chỉnh sửa (nếu có)
        });
        if (existingReport) {
            return res.status(400).json({ error: { message: ' Không thể lưu. Đã có báo cáo cho tháng và năm này.', type: 'server' }, serverError: true });
        }

        // Kiểm tra xem báo cáo có tháng và năm nhỏ hơn tháng hiện tại không
        const currentDate = new Date();
        const currentMonth = currentDate.getMonth() + 1; // Lấy tháng hiện tại
        const currentYear = currentDate.getFullYear(); // Lấy năm hiện tại
        const currentDay = (currentDate.getDate());
        const isWithinEditPeriod = (reportYear, reportMonth) => {
            reportYear = Number(reportYear);
            reportMonth = Number(reportMonth);
            const currentDate = new Date();
            const currentYear = currentDate.getFullYear();
            const currentMonth = currentDate.getMonth() + 1;
            const currentDay = currentDate.getDate();

            if (currentYear < reportYear) {
                return { isAllowed: true, message: "Báo cáo thuộc năm tương lai, có thể chỉnh sửa." };
            }

            if (currentYear === reportYear) {
                if (currentMonth < reportMonth) {
                    return { isAllowed: true, message: "Báo cáo thuộc tháng tương lai, có thể chỉnh sửa." };
                }
                if (currentMonth === reportMonth && currentDay <= 5) {
                    return { isAllowed: true, message: "Báo cáo thuộc tháng hiện tại và trong thời gian chỉnh sửa (trước ngày 6)." };
                }
            }

            return { isAllowed: false, message: `Không thể lưu báo cáo cho tháng ${reportMonth}/${reportYear} vì đã quá hạn.` };
        };

        //kiểm tra xem có trong kỳ hạn chỉnh sửa không
        const editCheck = isWithinEditPeriod(year, month);
        if (req.session.role !== 'admin' && !editCheck.isAllowed) {
            return res.status(400).json({
                error: {
                    message: editCheck.message, // Chỉ trả về thông báo khi không được phép chỉnh sửa
                    type: 'server'
                },
                serverError: true
            });
        }
        // Admin có thể chỉnh sửa bất cứ lúc nào, User chỉ có thể sửa báo cáo của chính họ
        if (req.session.role === 'admin' || report.userId.toString() === req.session.userId.toString()) {
            let modificationsDetails = [];
            // Kiểm tra các trường thay đổi
            const fieldsToUpdate = { totalVisits, childrenUnder14, visitsWithIDExcludingChildren, reportingUnit, month, year, birthCertificate, deathCertificate };
            Object.keys(fieldsToUpdate).forEach(field => {
                if (fieldsToUpdate[field] !== undefined && fieldsToUpdate[field] !== report[field]) {
                    modificationsDetails.push({ field, oldValue: report[field], newValue: fieldsToUpdate[field] });
                    report[field] = fieldsToUpdate[field];
                }
            });

            // Nếu có thay đổi, tính lại tỷ lệ phần trăm
            if (totalVisits && childrenUnder14 && visitsWithIDExcludingChildren) {
                const totalVisitsExcludingChildren = totalVisits - childrenUnder14;
                report.percentage = totalVisitsExcludingChildren > 0 ? ((visitsWithIDExcludingChildren / totalVisitsExcludingChildren) * 100).toFixed(2) : 0;
            }

            // Nếu có chỉnh sửa, thêm vào lịch sử sửa đổi
            if (modificationsDetails.length > 0) {
                report.modifications.push({
                    modifiedBy: req.session.userId,
                    modifiedAt: new Date(),
                    modificationCount: report.modifications.length + 1,
                    modificationsDetails
                });
                await report.save();
            }

            // res.redirect('/dashboard');
            return res.json({ message: 'Báo cáo đã được cập nhật thành công!', success: true });
        } else {
            res.status(403).json({ error: { message: 'Bạn không có quyền chỉnh sửa báo cáo này', type: 'server' }, serverError: true });
        }
    } catch (error) {
        console.error("Error in editReport:", error);
        res.status(500).json({ error: { message: error.message, type: 'server' }, serverError: true });
    }
};



// Route để lấy thông tin sửa đổi chi tiết
const viewReportDetail = async (req, res) => {
    try {
        const reportId = req.params.id;
        const report = await Report.findById(reportId).populate('modifications.modifiedBy', 'username');

        if (!report) {
            return res.status(404).json({ error: { message: 'Report not found', type: 'server' }, serverError: true });
        }
        res.render('report-detail', { report });
    } catch (error) {
        console.error("Error in viewReportDetail:", error);
        res.status(500).json({ error: { message: "Error fetching report details!", type: 'server' }, serverError: true });
    }
};

const viewModificationDetail = async (req, res) => {
    try {
        const modificationId = req.params.modificationId;

        const report = await Report.findOne({ 'modifications._id': modificationId })
            .populate('modifications.modifiedBy', 'username email');
        if (!report) {
            return res.status(404).json({ error: { message: 'Modification not found', type: 'server' }, serverError: true });
        }

        const modification = report.modifications.id(modificationId);

        if (!modification) {
            return res.status(404).json({ error: { message: 'Modification detail not found', type: 'server' }, serverError: true });
        }

        const changes = modification.modificationsDetails.filter(detail =>
            detail.oldValue !== detail.newValue
        );
        res.json({
            modifiedBy: modification.modifiedBy.username,
            modifiedAt: modification.modifiedAt,
            modificationsDetails: changes.length > 0 ? changes : []
        });
    } catch (error) {
        console.error("Error in viewModificationDetail:", error);
        res.status(500).json({ error: { message: 'Internal server error', type: 'server' }, serverError: true });
    }
};
const renderExportPage = (req, res) => {
    const user = User.findById(req.session.userId);
    res.render('export', { user });
};
const viewReports = async (req, res) => {

    try {
        const { month, year } = req.query;

        if (!month || !year) {
            return res.render('viewReports', {
                reports: [],
                usersWithoutReports: [],
                month: null,
                year: null,
                totalTTYT: null,
                totalTYTXa: null,
            });
        }

        const reports = await Report.find({ month, year });
        const users = await User.find();

        const adminIds = users.filter(user => user.role === 'admin').map(admin => admin._id.toString());
        const filteredReports = reports.filter(report => !adminIds.includes(report.userId.toString()));

        const userIdsWithReports = filteredReports.map(report => report.userId.toString());
        const usersWithoutReports = users
            .filter(user => user.role !== 'admin')
            .filter(user => !userIdsWithReports.includes(user._id.toString()));
        let totalTTYT = {
            totalVisits: 0,
            childrenUnder14: 0,
            visitsWithIDExcludingChildren: 0,
            birthCertificate: 0,
            deathCertificate: 0,
            percentage: 0,
        };

        let totalTYTXa = {
            totalVisits: 0,
            childrenUnder14: 0,
            visitsWithIDExcludingChildren: 0,
            birthCertificate: 0,
            deathCertificate: 0,
            percentage: 0,
        };

        const csReports = filteredReports.filter(report => report.reportingUnit.includes('TTYT'));
        csReports.forEach(report => {
            totalTTYT.totalVisits += report.totalVisits || 0;
            totalTTYT.childrenUnder14 += report.childrenUnder14 || 0;
            totalTTYT.visitsWithIDExcludingChildren += report.visitsWithIDExcludingChildren || 0;
            totalTTYT.birthCertificate += report.birthCertificate || 0;
            totalTTYT.deathCertificate += report.deathCertificate || 0;
        });

        totalTTYT.percentage = reportService.calculatePercentage(totalTTYT.visitsWithIDExcludingChildren, totalTTYT.totalVisits, totalTTYT.childrenUnder14);


        const tytReports = filteredReports.filter(report => report.reportingUnit.includes('Trạm Y tế'));
        tytReports.forEach(report => {
            totalTYTXa.totalVisits += report.totalVisits || 0;
            totalTYTXa.childrenUnder14 += report.childrenUnder14 || 0;
            totalTYTXa.visitsWithIDExcludingChildren += report.visitsWithIDExcludingChildren || 0;
            totalTYTXa.birthCertificate += report.birthCertificate || 0;
            totalTYTXa.deathCertificate += report.deathCertificate || 0;
        });

        totalTYTXa.percentage = reportService.calculatePercentage(totalTYTXa.visitsWithIDExcludingChildren, totalTYTXa.totalVisits, totalTYTXa.childrenUnder14);
        res.render('viewReports', {
            reports: filteredReports,
            usersWithoutReports,
            month,
            year,
            totalTTYT,
            totalTYTXa,
        });
    } catch (error) {
        console.error("Error in viewReports:", error);
        res.status(500).json({ error: { message: "Error fetching reports!", type: 'server' }, serverError: true });
    }
};
const exportReports = async (req, res) => {
    try {
        const { month, year } = req.query;

        if (!month || !year) {
            return res.status(400).json({ error: { message: 'Month and year are required', type: 'server' }, serverError: true });
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
            // { header: 'User', key: 'user', width: 30 },
            { header: 'Tháng', key: 'month', width: 10 },
            { header: 'Năm', key: 'year', width: 10 },
            { header: 'Đơn Vị', key: 'reportingUnit', width: 30 },
            { header: 'Tổng lượt khám', key: 'totalVisits', width: 15 },
            { header: 'Trẻ em dưới 14 tuổi', key: 'childrenUnder14', width: 20 },
            { header: 'Khám có CCCD (Không bao gồm trẻ em)', key: 'visitsWithIDExcludingChildren', width: 30 },
            { header: 'Giất chứng sinh', key: 'birthCertificate', width: 30 },
            { header: 'Giất chứng tử', key: 'deathCertificate', width: 30 },
            { header: 'Tỉ lệ phần trăm', key: 'percentage', width: 15 }, // Add percentage column
        ];

        // Thêm dữ liệu vào worksheet
        reports.forEach(report => {
            const sortedModifications = [...report.modifications].sort((a, b) => new Date(a.modifiedAt) - new Date(b.modifiedAt));
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
            worksheet.addRow(finalData);
        });
        worksheet.getRow(1).font = { bold: true };
        const fileName = `reports-${month}-${year}.xlsx`;
        res.setHeader('Content-Disposition', `attachment; filename=${fileName}`);
        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');

        await workbook.xlsx.write(res);
        res.end();
    } catch (error) {
        console.error("Error in exportReports:", error);
        res.status(500).json({ error: { message: "Error exporting reports!", type: 'server' }, serverError: true });
    }
};

const viewAggregatedReports = async (req, res) => {
    try {
        const { startMonth, startYear, endMonth, endYear } = req.query;

        if (!startMonth || !startYear || !endMonth || !endYear)
            return res.render('aggregatedReports', {
                reports: [],
                usersWithoutReports: [],
                totalTTYT: null,
                totalTYTXa: null,
                startMonth: null,
                startYear: null,
                endMonth: null,
                endYear: null
            });

        const startDate = new Date(startYear, startMonth - 1, 1);
        const endDate = new Date(endYear, endMonth, 0);

        if (startDate > endDate) {
            return res.status(400).json({ error: { message: 'Start date must be before end date', type: 'server' }, serverError: true });
        }

        const reports = await Report.find({
            $and: [
                {
                    $or: [
                        { year: { $gt: startDate.getFullYear() } },
                        { year: startDate.getFullYear(), month: { $gte: startDate.getMonth() + 1 } }
                    ]
                },
                {
                    $or: [
                        { year: { $lt: endDate.getFullYear() } },
                        { year: endDate.getFullYear(), month: { $lte: endDate.getMonth() + 1 } }
                    ]
                }
            ]
        }).populate('userId', 'username role');


        const users = await User.find();
        const adminIds = users.filter(user => user.role === 'admin').map(admin => admin._id.toString());
        const filteredReports = reports.filter(report => !adminIds.includes(report.userId.toString()));



        const userIdsWithReports = filteredReports.map(report => report.userId.toString());
        const usersWithoutReports = users
            .filter(user => user.role !== 'admin')
            .filter(user => !userIdsWithReports.includes(user._id.toString()));


        // Aggregate data by reportingUnit
        const aggregatedReports = filteredReports.reduce((acc, report) => {
            if (!acc[report.reportingUnit]) {
                acc[report.reportingUnit] = {
                    reportingUnit: report.reportingUnit,
                    totalVisits: 0,
                    childrenUnder14: 0,
                    visitsWithIDExcludingChildren: 0,
                    birthCertificate: 0,
                    deathCertificate: 0,
                    percentage: 0,
                };
            }
            acc[report.reportingUnit].totalVisits += report.totalVisits || 0;
            acc[report.reportingUnit].childrenUnder14 += report.childrenUnder14 || 0;
            acc[report.reportingUnit].visitsWithIDExcludingChildren += report.visitsWithIDExcludingChildren || 0;
            acc[report.reportingUnit].birthCertificate += report.birthCertificate || 0;
            acc[report.reportingUnit].deathCertificate += report.deathCertificate || 0;
            return acc;
        }, {});

        const aggregatedReportsArray = Object.values(aggregatedReports);


        // Calculate percentage for each aggregated report
        const reportsWithPercentage = aggregatedReportsArray.map(report => {
            const totalVisitsExcludingChildren = report.totalVisits - report.childrenUnder14;
            const percentage = totalVisitsExcludingChildren > 0 ? ((report.visitsWithIDExcludingChildren / totalVisitsExcludingChildren) * 100).toFixed(2) : 0;
            return {
                ...report,
                percentage,
            };
        });

        // Calculate totals for TTYT
        let totalTTYT = {
            totalVisits: 0,
            childrenUnder14: 0,
            visitsWithIDExcludingChildren: 0,
            birthCertificate: 0,
            deathCertificate: 0,
            percentage: 0,
        };

        // Calculate totals for TYT xã
        let totalTYTXa = {
            totalVisits: 0,
            childrenUnder14: 0,
            visitsWithIDExcludingChildren: 0,
            birthCertificate: 0,
            deathCertificate: 0,
            percentage: 0,
        };

        const csReports = reportsWithPercentage.filter(report => report.reportingUnit.includes('TTYT'));
        csReports.forEach(report => {
            totalTTYT.totalVisits += report.totalVisits || 0;
            totalTTYT.childrenUnder14 += report.childrenUnder14 || 0;
            totalTTYT.visitsWithIDExcludingChildren += report.visitsWithIDExcludingChildren || 0;
            totalTTYT.birthCertificate += report.birthCertificate || 0;
            totalTTYT.deathCertificate += report.deathCertificate || 0;
        });

        totalTTYT.percentage = reportService.calculatePercentage(totalTTYT.visitsWithIDExcludingChildren, totalTTYT.totalVisits, totalTTYT.childrenUnder14);



        const tytReports = reportsWithPercentage.filter(report => report.reportingUnit.includes('Trạm Y tế'));
        tytReports.forEach(report => {
            totalTYTXa.totalVisits += report.totalVisits || 0;
            totalTYTXa.childrenUnder14 += report.childrenUnder14 || 0;
            totalTYTXa.visitsWithIDExcludingChildren += report.visitsWithIDExcludingChildren || 0;
            totalTYTXa.birthCertificate += report.birthCertificate || 0;
            totalTYTXa.deathCertificate += report.deathCertificate || 0;
        });

        totalTYTXa.percentage = reportService.calculatePercentage(totalTYTXa.visitsWithIDExcludingChildren, totalTYTXa.totalVisits, totalTYTXa.childrenUnder14);


        res.render('aggregatedReports', {
            reports: reportsWithPercentage,
            usersWithoutReports,
            totalTTYT,
            totalTYTXa,
            startMonth,
            startYear,
            endMonth,
            endYear
        });
    } catch (error) {
        console.error('Error fetching aggregated reports:', error);
        res.status(500).json({ error: { message: "Error fetching reports!", type: 'server' }, serverError: true });
    }
};
const uploadForm = async (req, res) => {
    res.render('dashboard', { excelData: null })
}
// Here is the uploadFile method.
const uploadFile = async (req, res) => {
    try {
        if (!req.file) return res.status(400).json({ error: { message: "Please select an Excel file to upload.", type: 'server' }, serverError: true });
        const excelData = await module.exports.analyzeExcelFile(req.file.path);
        fs.unlinkSync(req.file.path)
        res.json({ excelData });
    } catch (error) {
        console.error('Error handling Excel upload:', error);
        res.status(500).json({ error: { message: "Error uploading and processing Excel file", type: 'server' }, serverError: true });
    }
};
function analyzeExcelFile(filePath) {
    try {
        if (!fs.existsSync(filePath)) {
            throw new Error("File không tồn tại!");
        }

        // Đọc file Excel (.xls hoặc .xlsx)
        const workbook = xlsx.readFile(filePath);
        const sheetName = workbook.SheetNames[0]; // Lấy sheet đầu tiên
        const worksheet = workbook.Sheets[sheetName];

        // Chuyển đổi dữ liệu thành JSON
        const data = xlsx.utils.sheet_to_json(worksheet, { header: 1 });

        if (data.length < 2) {
            throw new Error("Dữ liệu không hợp lệ hoặc không có hàng nào!");
        }

        // Xác định vị trí các cột dựa vào tiêu đề hàng đầu tiên
        const headerRow = data[0];
        const cmtIndex_ageNam = headerRow.indexOf("NAM");
        const cmtIndex_ageNu = headerRow.indexOf("NU");
        const cmtIndex_ma_benh_nhan = headerRow.indexOf("MA_BENH_NHAN");
        const cmtIndex_CCCD = headerRow.indexOf("CMT_BENHNHAN");

        if (
            cmtIndex_ageNam === -1 ||
            cmtIndex_ageNu === -1 ||
            cmtIndex_ma_benh_nhan === -1 ||
            cmtIndex_CCCD === -1
        ) {
            throw new Error("Không tìm thấy các cột cần thiết trong file Excel!");
        }

        let totalVisits = 0;
        let visitsWithIDExcludingChildren = 0;
        let totalChildrenUnder14 = 0;

        // Duyệt qua từng dòng dữ liệu (bỏ qua hàng tiêu đề)
        data.slice(1).forEach((row) => {
            const ageNam =
                row[cmtIndex_ageNam] &&
                    row[cmtIndex_ageNam].toString().includes("tháng")
                    ? 1
                    : parseInt(row[cmtIndex_ageNam]) || null;

            const ageNu =
                row[cmtIndex_ageNu] &&
                    row[cmtIndex_ageNu].toString().includes("tháng")
                    ? 1
                    : parseInt(row[cmtIndex_ageNu]) || null;

            const ma_benh_nhan = row[cmtIndex_ma_benh_nhan] ? true : false;
            const cccd_benhnhan = row[cmtIndex_CCCD] ? true : false;

            totalVisits++;

            if (ma_benh_nhan) {
                const isChild =
                    (ageNam !== null && ageNam <= 14) ||
                    (ageNu !== null && ageNu <= 14);
                const isAdult =
                    (ageNam !== null && ageNam > 14 && cccd_benhnhan) ||
                    (ageNu !== null && ageNu > 14 && cccd_benhnhan);

                if (isChild) {
                    totalChildrenUnder14++;
                }
                if (isAdult) {
                    visitsWithIDExcludingChildren++;
                }
            }
        });

        return {
            totalVisits,
            visitsWithIDExcludingChildren,
            totalChildrenUnder14,
        };
    } catch (error) {
        console.error("Lỗi khi phân tích file Excel:", error.message);
        // fs.unlinkSync(filePath);
        return null;
    }
}

module.exports = {
    addOrEditReport,
    deleteReport,
    editReport,
    viewReportDetail,
    viewModificationDetail,
    renderExportPage,
    viewReports,
    exportReports,
    viewAggregatedReports,
    uploadForm,
    uploadFile,
    analyzeExcelFile
};