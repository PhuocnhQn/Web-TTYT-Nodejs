const dialog = document.getElementById('errDialog');
const dialogSS = document.getElementById('successfullyDialog');
const errorDisplay = document.getElementById('error');
const closeButton = document.getElementById('closeDialog')
const closeButton1 = document.getElementById('closeDialog1');

const ssDisplay = document.getElementById('notificationSS');
const sscloseButton = document.getElementById('closeDialogSS')



function showDialogAdd(error) {
    return new Promise((resolve) => {
        ssDisplay.textContent = error.message;
        if (error.type === 'server') {
            ssDisplay.className = 'error-message';
        } else {
            ssDisplay.className = 'warning-message';
        }
        dialogSS.showModal();

        // Lắng nghe sự kiện khi người dùng nhấn OK
        sscloseButton.addEventListener('click', () => {
            dialogSS.close();  // Đóng dialog khi nhấn OK
            resolve();       // Giải quyết Promise khi OK được nhấn
        });
    });
}


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
        const dialog = document.getElementById('listReportDialog');
        dialog.close();
    });
}

function showDialogSS(error) {
    ssDisplay.textContent = error.message;
    if (error.type === 'server') {
        ssDisplay.className = 'error-message';
    } else {
        ssDisplay.className = 'warning-message';
    }
    dialogSS.showModal();
}

sscloseButton.addEventListener('click', () => {
    dialogSS.close();
})
if (sscloseButton) {
    sscloseButton.addEventListener('click', function () {
        const dialogSS = document.getElementById('listReportDialog');
        dialogSS.close();
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
// add báo cáo
const form = document.getElementById('reportForm');
form.action = `/reports/add`; // Đảm bảo action được cập nhật

// Xử lý khi gửi form
form.addEventListener('submit', async function (event) {
    event.preventDefault(); // Ngừng hành động mặc định của form

    const formData = new FormData(form);
    const formObject = {};
    formData.forEach((value, key) => {
        formObject[key] = value;
    });

    // Gửi dữ liệu qua fetch
    try {
        const response = await fetch(form.action, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(formObject), // Dữ liệu form sẽ được gửi ở đây
            credentials: 'same-origin' // Ensure session cookies are sent
        });

        const data = await response.json(); // Parse phản hồi JSON
        if (data.message) {
            showDialogAdd({
                message: data.message, // Hiển thị thông điệp thành công
                type: 'success'
            }).then(() => {
                // Sau khi nhấn OK, chuyển hướng đến trang dashboard
                window.location.href = '/dashboard';
            });
        } else {
            // Xử lý lỗi
            showDialog({ message: data.error.message, type: 'error' });
        }
    } catch (error) {
        showDialog({ message: 'Something went wrong: ' + error.message, type: 'error' });
    }
});
async function openEditDialog(id, reportingUnit, month, year, totalVisits, childrenUnder14, visitsWithIDExcludingChildren, birthCertificate, deathCertificate, user, createdAt) {

    // Điền giá trị vào form và thay đổi action của form
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
    // Lấy thời gian từ server
    const response = await fetch('/server-time');
    const data = await response.json();
    const today = new Date(data.time);  // Thời gian server

    // Kiểm tra xem người dùng có phải là admin không
    const isAdmin = (user === "admin");

    // Ngày đầu tháng báo cáo
    const timeReport = new Date(createdAt);
    const createDay = timeReport.getDate();  // Lấy ngày trong tháng
    const createdMonth = timeReport.getMonth() + 1;
    const createdYear = timeReport.getFullYear();

    const isWithinEditPeriod = (reportYear, reportMonth) => {
        const currentYear = Number(today.getFullYear());
        const currentMonth = Number(today.getMonth() + 1);
        const currentDay = Number(today.getDate());
        // alert(currentMonth + " " + reportMonth)
        reportYear = Number(reportYear);
        reportMonth = Number(reportMonth);

        if (currentYear < reportYear) {
            return true;
        }

        if (currentYear === reportYear) {
            if (currentMonth < reportMonth) {
                return true;
            }
            if (currentMonth === reportMonth && currentDay <= 6) {
                return true;
            }
        }

        return false;
    };

    // Kiểm tra quyền chỉnh sửa
    if (!isAdmin && !isWithinEditPeriod(year, month)) {
        showDialog({
            message: `Bạn không thể sửa báo cáo sau ngày 6 tháng ${month} Năm ${year}`,
            type: 'client'
        });
        return; // Dừng thực hiện
    }

    // Thay đổi action của form
    const form = document.getElementById('editForm');
    form.action = `/reports/edit/${id}`; // Đảm bảo action được cập nhật

    // Mở hộp thoại
    dialog.showModal();

    // Xử lý khi gửi form
    form.addEventListener('submit', async function (event) {
        event.preventDefault(); // Ngừng hành động mặc định của form

        const formData = new FormData(form);
        const formObject = {};
        formData.forEach((value, key) => {
            formObject[key] = value;
        });

        // Gửi dữ liệu qua fetch
        try {
            const response = await fetch(form.action, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(formObject), // Dữ liệu form sẽ được gửi ở đây
                credentials: 'same-origin' // Ensure session cookies are sent
            });

            const data = await response.json(); // Parse phản hồi JSON
            if (data.message) {
                showDialogAdd({
                    message: data.message, // Hiển thị thông điệp thành công
                    type: 'success'
                }).then(() => {
                    // Sau khi nhấn OK, chuyển hướng đến trang dashboard
                    window.location.href = '/dashboard';
                });
            } else {
                // Xử lý lỗi
                showDialog({ message: data.error.message, type: 'error' });
            }
        } catch (error) {
            showDialog({ message: 'Something went wrong: ' + error.message, type: 'error' });
        }
    });
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
            const dialog = document.getElementById('listReportDialog');
            dialog.showModal();
        })
        .catch(error => {
            console.error('Lỗi khi lấy thông tin sửa đổi:', error);
            showDialog({ message: `Không thể tải thông tin sửa đổi: ${error.message}`, type: 'client' });
        });
}
// JavaScript for handling delete actions
function deleteReport(reportId) {
    const confirmDialog = document.getElementById('confirmDialog');
    const confirmYes = document.getElementById('confirmYes');
    const confirmNo = document.getElementById('confirmNo');

    // Hiển thị dialog xác nhận
    confirmDialog.showModal();

    // Khi người dùng nhấn "Yes"
    confirmYes.addEventListener('click', function () {

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
                showDialogSS({ message: `Error: ${error.message}`, type: 'client' });
            });

        // Đóng dialog sau khi xử lý
        confirmDialog.close();
    });

    // Khi người dùng nhấn "No"
    confirmNo.addEventListener('click', function () {
        // Đóng dialog mà không thực hiện hành động xóa
        confirmDialog.close();
    });
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
// phan tích xls
document.addEventListener('DOMContentLoaded', function () {
    const dialog = document.getElementById('errDialog');
    const errorDisplay = document.getElementById('error');
    const closeButton = document.getElementById('closeDialog')

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
        showDialog({ message: 'Đã xảy ra lỗi khi tải trang. Vui lòng thử lại.', type: 'client' });
    }

    async function handleFormSubmit(action) {
        try {
            const reportForm = document.getElementById('reportForm');
            if (reportForm) {
                const response = await fetch(action, {
                    method: 'GET', // or POST, based on your form's method
                });

                if (!response.ok) {
                    const responseJson = await response.json()
                    showDialog(responseJson.error);
                } else {
                    window.location.href = action

                }
            }
        } catch (error) {
            console.error("Error submitting form:", error)
            showDialog({ message: "Đã xảy ra lỗi khi gửi biểu mẫu. Vui lòng thử lại.", type: 'client' })
        }
    }


    if (closeButton) {
        closeButton.addEventListener('click', () => {
            if (dialog && dialog.close)
                dialog.close();
        })
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
    // Function to populate form fields with Excel data

    function populateForm(data) {
        document.getElementById('totalVisits').value = data.totalVisits || '';
        document.getElementById('visitsWithIDExcludingChildren').value = data.visitsWithIDExcludingChildren || '';
        document.getElementById('childrenUnder14').value = data.totalChildrenUnder14 || '';
        // You might need to pass this to the function since it depends on the logged in user
        // document.getElementById('reportingUnit').value = data.reportingUnit || '';
    }

    document.getElementById('uploadForm').addEventListener('submit', async (event) => {
        event.preventDefault();
        const formData = new FormData(event.target);


        try {
            const response = await fetch('/reports/upload', {
                method: 'POST',
                body: formData,
            });
            if (!response.ok) {
                const responseJson = await response.json();
                showDialog(responseJson.error);
            } else {
                const responseJson = await response.json();
                console.log('Excel Data:', responseJson.excelData);

                // Call the populate form function
                populateForm(responseJson.excelData);

                // alert('File uploaded and analyzed successfully!');
                showDialogSS({ message: "Đã tải tệp lên và phân tích thành công!", type: 'client' });
            }
        } catch (error) {
            console.error("Error submitting form:", error);
            showDialog({ message: "Đã xảy ra lỗi khi gửi biểu mẫu. Vui lòng thử lại.", type: 'client' });
        }
    });

    window.addEventListener('load', () => {
        // (Same code from before, but removed the fetch to check server side errors.  That's not useful on this page.)
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
    });
});