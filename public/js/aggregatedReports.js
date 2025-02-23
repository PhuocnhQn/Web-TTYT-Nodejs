document.addEventListener('DOMContentLoaded', function () {

    const viewButton = document.getElementById('viewButton');
    if (viewButton) {
        viewButton.addEventListener('click', () => {
            handleFormSubmit('/reports/view');
        });
    }


    const exportButton = document.getElementById('exportButton');
    if (exportButton) {
        exportButton.addEventListener('click', () => {
            handleFormSubmit('/reports/export');
        });
    }

});