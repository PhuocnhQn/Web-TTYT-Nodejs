const dialog = document.getElementById('errDialog');
const errorDisplay = document.getElementById('error');
const closeButton = document.getElementById('closeDialog')
const closeButton1 = document.getElementById('closeDialog1');


function showDialog(error) {
    errorDisplay.textContent = error.message;
    if (error.type === 'server') {
        errorDisplay.className = 'error-message';
    } else {
        errorDisplay.className = 'warning-message';
    }
    dialog.showModal();
}

closeButton.addEventListener('click', () => {
    dialog.close();
})
if (closeButton1) {
    closeButton1.addEventListener('click', function () {
        const dialog = document.getElementById('editDialog1');
        dialog.close();
    });
}



function filterReports() {
    const searchInput = document.getElementById("searchReports").value.toLowerCase();
    const reportList = document.getElementById("reportList");
    const reports = reportList.getElementsByTagName("li");

    for (let i = 0; i < reports.length; i++) {
        const reportText = reports[i].textContent.toLowerCase();
        if (reportText.includes(searchInput)) {
            reports[i].style.display = "";
        } else {
            reports[i].style.display = "none";
        }
    }
}

function openEditDialog(id, reportingUnit, month, year, totalVisits, childrenUnder14, visitsWithIDExcludingChildren, birthCertificate, deathCertificate) {
    const dialog = document.getElementById('editDialog');
    document.getElementById('editReportId').value = id;
    document.getElementById('editReportingUnit').value = reportingUnit;
    document.getElementById('editMonth').value = month;
    document.getElementById('editYear').value = year;
    document.getElementById('editTotalVisits').value = totalVisits;
    document.getElementById('editChildrenUnder14').value = childrenUnder14;
    document.getElementById('editVisitsWithIDExcludingChildren').value = visitsWithIDExcludingChildren;
    document.getElementById('editBirthCertificate').value = birthCertificate;
    document.getElementById('editDeathCertificate').value = deathCertificate;

    // Thay đổi action của form
    document.getElementById('editForm').action = '/reports/edit/' + id;

    // Mở hộp thoại
    dialog.showModal();
}

function closeDialog() {
    const dialog = document.getElementById('editDialog');
    dialog.close();
}

// Hàm để hiển thị chi tiết sửa đổi khi người dùng chọn một mục
function showModificationDetails(selectElement) {
    const modificationId = selectElement.value;

    if (!modificationId) {
        // Nếu không có lựa chọn, không thực hiện gì
        return;
    }

    // Gửi yêu cầu AJAX để lấy thông tin chi tiết về sửa đổi
    fetch(`/reports/view-modification/${modificationId}`)
        .then(response => {
            // Kiểm tra xem mã trạng thái HTTP có phải là 200 không
            if (!response.ok) {
                return response.json()
                    .then(errorData => {
                        throw new Error(errorData.error.message || errorData.error || `Lỗi: ${response.statusText}`)
                    })
            }

            // Kiểm tra xem Content-Type có phải là JSON không
            const contentType = response.headers.get("Content-Type");

            if (contentType && contentType.includes("application/json")) {
                // Nếu là JSON, chuyển đổi phản hồi thành JSON
                return response.json();
            } else {
                // Nếu không phải JSON, trả về lỗi
                throw new Error("Dữ liệu trả về không phải định dạng JSON");
            }
        })
        .then(data => {
            // Xử lý dữ liệu JSON nếu có
            // Cập nhật thông tin sửa đổi
            document.getElementById('modifiedBy').innerText = `Người sửa: ${data.modifiedBy || 'Không xác định'}`;
            document.getElementById('modifiedAt').innerText = `Thời gian sửa: ${data.modifiedAt ? new Date(data.modifiedAt).toLocaleString() : 'Không xác định'}`;

            const modificationFields = document.getElementById('modificationFields');
            modificationFields.innerHTML = '';  // Xóa danh sách cũ

            // Kiểm tra xem có dữ liệu sửa đổi không và xử lý
            if (data.modificationsDetails && data.modificationsDetails.length > 0) {
                data.modificationsDetails.forEach(detail => {
                    const li = document.createElement('li');
                    li.textContent = `${detail.field}: ${detail.oldValue} => ${detail.newValue}`;
                    modificationFields.appendChild(li);
                });
            } else {
                // Nếu không có sửa đổi thực sự, hiển thị thông báo
                modificationFields.innerHTML = '<li>Không có thay đổi thực sự.</li>';
            }

            // Mở hộp thoại
            const dialog = document.getElementById('editDialog1');
            dialog.showModal();
        })
        .catch(error => {
            console.error('Lỗi khi lấy thông tin sửa đổi:', error);
            showDialog({ message: `Không thể tải thông tin sửa đổi: ${error.message}`, type: 'client' });
        });
}
// JavaScript for handling delete actions
function deleteReport(reportId) {
    fetch(`/reports/delete/${reportId}`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        credentials: 'same-origin' // Ensure session cookies are sent
    })
        .then(response => {
            if (!response.ok) {
                return response.json()
                    .then(errorData => {
                        throw new Error(errorData.error.message || errorData.error || `Lỗi: ${response.statusText}`)
                    })
            }
            window.location.href = '/dashboard'; // Redirect to dashboard after successful deletion
        })
        .catch(error => {
            showDialog({ message: `Error: ${error.message}`, type: 'client' });
        });
}

// Populate form with report data for editing
function populateForm(id, reportingUnit, month, year, totalVisits, childrenUnder14, visitsWithIDExcludingChildren, birthCertificate, deathCertificate) {
    document.getElementById('reportId').value = id;
    document.getElementById('reportingUnit').value = reportingUnit;
    document.getElementById('monthin').value = month;
    document.getElementById('yearin').value = year;
    document.getElementById('totalVisits').value = totalVisits;
    document.getElementById('childrenUnder14').value = childrenUnder14;
    document.getElementById('visitsWithIDExcludingChildren').value = visitsWithIDExcludingChildren;
    document.getElementById('birthCertificate').value = birthCertificate;
    document.getElementById('deathCertificate').value = deathCertificate;

    // Change the form's action to edit with the specific report ID
    document.getElementById('reportForm').action = '/reports/edit/' + id;
}
window.addEventListener('load', () => {
    fetch(window.location.href)
        .then(response => {
            if (!response.ok) {
                return response.json();
            }
            return null
        })
        .then(data => {
            if (data) {
                if (data.error) {
                    showDialog(data.error)
                }
            }
        })
})