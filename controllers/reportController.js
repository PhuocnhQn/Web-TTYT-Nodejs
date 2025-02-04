const Report = require('../models/report');
const User = require('../models/user');
const ExcelJS = require('exceljs');
const reportService = require('../services/reportService');

const addOrEditReport = async (req, res) => {
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
            if (!report) return res.status(404).json({ error: { message: 'Report not found', type: 'server' }, serverError: true });

            // Initialize modifications details array
            let modificationsDetails = [];

            // Check for changes and add modifications details
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

            // Recalculate the percentage if necessary
            if (modificationsDetails.length > 0 || percentage !== report.percentage) {
                report.percentage = percentage;
            }

            // Add the modification details with who modified it and when
            if (modificationsDetails.length > 0) {
                report.modifications.push({
                    modifiedBy: req.session.userId,
                    modifiedAt: new Date(),
                    modificationsDetails
                });
            }

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
        if (!req.session.userId) return res.status(401).json({ error: { message: 'Please log in', type: 'server' }, serverError: true });

        const reportId = req.params.id;
        const { totalVisits, childrenUnder14, visitsWithIDExcludingChildren, reportingUnit, month, year, birthCertificate, deathCertificate } = req.body;

        // Find the report by ID
        const report = await Report.findById(reportId);

        // Check if report exists
        if (!report) return res.status(404).json({ error: { message: 'Report not found', type: 'server' }, serverError: true });

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
                    modifiedBy: req.session.userId,
                    modifiedAt: new Date(),
                    modificationCount: report.modifications.length + 1,
                    modificationsDetails
                });
                await report.save();
            }
            res.redirect('/dashboard');
        } else {
            res.status(403).json({ error: { message: 'You do not have permission to edit this report', type: 'server' }, serverError: true })
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
};