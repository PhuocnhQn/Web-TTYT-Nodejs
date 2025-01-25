const calculatePercentage = (visitsWithIDExcludingChildren, totalVisits, childrenUnder14) => {
    const totalVisitsExcludingChildren = totalVisits - childrenUnder14
    return totalVisitsExcludingChildren > 0 ? ((visitsWithIDExcludingChildren / totalVisitsExcludingChildren) * 100).toFixed(2) : 0
}

module.exports = { calculatePercentage }