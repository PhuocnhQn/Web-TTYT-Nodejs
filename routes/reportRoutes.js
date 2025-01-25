const express = require('express');
const router = express.Router();
const reportController = require('../controllers/reportController');
const authMiddleware = require('../middlewares/authMiddleware');

router.post('/reports/add', authMiddleware.isAuthenticated, reportController.addOrEditReport);
router.post('/reports/delete/:id', authMiddleware.isAuthenticated, authMiddleware.isAdmin, reportController.deleteReport);
router.post('/reports/edit/:id', authMiddleware.isAuthenticated, reportController.editReport);
router.get('/reports/view-modification/:modificationId', authMiddleware.isAuthenticated, reportController.viewModificationDetail)
router.get('/reports/view/:id', authMiddleware.isAuthenticated, authMiddleware.isAdmin, reportController.viewReportDetail);
router.get('/reports/export', authMiddleware.isAuthenticated, reportController.exportReports);
router.get('/reports/view', authMiddleware.isAuthenticated, reportController.viewReports);

// New Route for Aggregated Reports
router.get('/reports/aggregated', authMiddleware.isAuthenticated, reportController.viewAggregatedReports);

module.exports = router;