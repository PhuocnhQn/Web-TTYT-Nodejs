document.addEventListener('DOMContentLoaded', function () {
    const dialog = document.getElementById('errDialog');
    const errorDisplay = document.getElementById('error');
    const closeDialogButton = document.getElementById('closeDialog');

    // Hàm hiển thị hộp thoại lỗi
    function showDialog(error) {
        if (!dialog || !errorDisplay) {
            console.error('Error dialog elements not found in the DOM.');
            return;
        }
        // Cập nhật thông báo lỗi
        errorDisplay.textContent = error.message;
        errorDisplay.className = error.type === 'server' ? 'error-message' : 'warning-message';
        dialog.showModal();  // Hiển thị hộp thoại
    }

    // Hàm xử lý lỗi khi fetch gặp vấn đề
    function handleFetchError(error) {
        console.error('Fetch error:', error);
        showDialog({ message: 'An error occurred while fetching the page. Please try again.', type: 'client' });
    }

    // Hàm gửi form
    function handleFormSubmit(action) {
        try {
            const reportForm = document.getElementById('reportForm');
            if (reportForm) {
                reportForm.action = action;
                reportForm.submit();
            }
        } catch (error) {
            console.error("Error submitting form:", error);
            showDialog({ message: 'An error occurred while submitting the form. Please try again.', type: 'client' });
        }
    }

    // Đóng hộp thoại khi nhấn nút "Đóng"
    if (closeDialogButton) {
        closeDialogButton.addEventListener('click', () => {
            if (dialog && dialog.close) {
                dialog.close();
            }
        });
    }

    // Xử lý khi nhấn nút "View"
    const viewButton = document.getElementById('viewButton');
    if (viewButton) {
        viewButton.addEventListener('click', () => {
            handleFormSubmit('/reports/view');
        });
    }

    // Xử lý khi nhấn nút "Export"
    const exportButton = document.getElementById('exportButton');
    if (exportButton) {
        exportButton.addEventListener('click', () => {
            handleFormSubmit('/reports/export');
        });
    }

    // Xử lý lỗi khi trang tải
    window.addEventListener('load', () => {
        fetch(window.location.href)
            .then(response => {
                if (!response.ok) {
                    return response.json().then(errorData => {
                        throw new Error(errorData.error.message || errorData.error || `Lỗi HTTP: ${response.status} ${response.statusText}`);
                    });
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
