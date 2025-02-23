const express = require('express');
const router = express.Router();
const reportController = require('../controllers/reportController');
const authMiddleware = require('../middlewares/authMiddleware');
const multer = require('multer');
const path = require('path');

// Configure multer for file uploads
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, path.join(__dirname, '../uploads'));
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname)); // Accessed correctly as a property
    }
});
const upload = multer({ storage: storage });

router.post('/reports/add', authMiddleware.isAuthenticated, reportController.addOrEditReport);
router.post('/reports/delete/:id', authMiddleware.isAuthenticated, authMiddleware.isAdmin, reportController.deleteReport);
router.post('/reports/edit/:id', authMiddleware.isAuthenticated, reportController.editReport);
router.get('/reports/view-modification/:modificationId', authMiddleware.isAuthenticated, reportController.viewModificationDetail)
router.get('/reports/view/:id', authMiddleware.isAuthenticated, authMiddleware.isAdmin, reportController.viewReportDetail);
router.get('/reports/export', authMiddleware.isAuthenticated, reportController.exportReports);
router.get('/reports/view', authMiddleware.isAuthenticated, reportController.viewReports);

// New Route for Aggregated Reports
router.get('/reports/aggregated', authMiddleware.isAuthenticated, reportController.viewAggregatedReports);

// Add route for upload Form
router.get('/reports/upload', authMiddleware.isAuthenticated, reportController.uploadForm);

// Handle Upload POST calls
router.post('/reports/upload', authMiddleware.isAuthenticated, upload.single('excelFile'), reportController.uploadFile);

module.exports = router;