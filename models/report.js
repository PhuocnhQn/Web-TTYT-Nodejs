const mongoose = require('mongoose');

const ReportSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    totalVisits: { type: Number, required: true },
    childrenUnder14: { type: Number, required: true },
    visitsWithIDExcludingChildren: { type: Number, required: true },
    reportingUnit: { type: String, required: true },
    month: { type: Number, required: true },
    year: { type: Number, required: true },
    modifications: [{
        modifiedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
        modifiedAt: { type: Date, default: Date.now },
        modificationsDetails: [{
            field: { type: String, required: true },
            oldValue: { type: mongoose.Schema.Types.Mixed },
            newValue: { type: mongoose.Schema.Types.Mixed },
        }],
    }],
    createdAt: { type: Date, default: Date.now },
    birthCertificate: { type: Number, required: true },
    deathCertificate: { type: Number, required: true },
    percentage: { type: Number, required: true },
});

module.exports = mongoose.model('Report', ReportSchema);