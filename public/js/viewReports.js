document.addEventListener('DOMContentLoaded', function () {
    const dialog = document.getElementById('errDialog');
    const errorDisplay = document.getElementById('error');
    const closeDialogButton = document.getElementById('closeDialog');


    function showDialog(error) {
        if (!dialog || !errorDisplay) {
            console.error('Error dialog elements not found in the DOM.');
            return;
        }
        errorDisplay.textContent = error.message;
        errorDisplay.className = error.type === 'server' ? 'error-message' : 'warning-message';
        dialog.showModal();
    }

    function handleFetchError(error) {
        console.error('Fetch error:', error);
        showDialog({ message: 'An error occurred while fetching the page. Please try again.', type: 'client' });
    }


    function handleFormSubmit(action) {
        try {
            const reportForm = document.getElementById('reportForm');
            if (reportForm) {
                reportForm.action = action;
                reportForm.submit();
            }
        } catch (error) {
            console.error("Error submitting form:", error)
        }
    }

    if (closeDialogButton) {
        closeDialogButton.addEventListener('click', () => {
            if (dialog && dialog.close)
                dialog.close();
        });
    }


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

    window.addEventListener('load', () => {
        fetch(window.location.href)
            .then(response => {
                if (!response.ok) {
                    return response.json().then(errorData => {
                        throw new Error(errorData.error.message || errorData.error || `Lỗi HTTP: ${response.status} ${response.statusText}`)
                    })
                }
                return null;
            })
            .then(data => {
                if (data && data.error) {
                    showDialog(data.error);
                }
            })
            .catch(handleFetchError);

    });
});