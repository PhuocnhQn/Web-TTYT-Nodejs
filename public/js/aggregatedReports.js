document.addEventListener('DOMContentLoaded', function () {
    const viewButton = document.getElementById('viewButton');
    const exportButton = document.getElementById('exportButton');
    const errDialog = document.getElementById('errDialog');
    const errorText = document.getElementById('error');
    const closeDialogButton = document.getElementById('closeDialog');

    if (viewButton) {
        viewButton.addEventListener('click', () => {
            handleFormSubmit('/reports/view');
        });
    }

    if (exportButton) {
        exportButton.addEventListener('click', () => {
            handleFormSubmit('/reports/export');
        });
    }

    if (closeDialogButton) {
        closeDialogButton.addEventListener('click', () => {
            errDialog.close();
        });
    }
});

function handleFormSubmit(url) {
    fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
    })
        .then(response => response.json()) // Luôn chuyển response thành JSON
        .then(data => {
            if (data.serverError && data.error && data.error.message) {
                throw new Error(data.error.message);
            }
            console.log('Thành công:', data);
        })
        .catch(error => {
            console.error('Lỗi:', error.message);
            showErrorDialog(error.message);
        });
}

function showErrorDialog(message) {
    const errDialog = document.getElementById('errDialog');
    const errorText = document.getElementById('error');

    if (errorText && errDialog) {
        errorText.textContent = message;
        errDialog.showModal();
    }
}

