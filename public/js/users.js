document.addEventListener("DOMContentLoaded", function () {
    // Ẩn tất cả form chỉnh sửa khi tải trang
    document.querySelectorAll(".edit-form").forEach(form => {
        form.style.display = "none";
    });

    // Hàm ẩn/hiện form chỉnh sửa theo ID
    window.toggleEditForm = function (userId) {
        const editForm = document.getElementById(`edit-form-${userId}`);
        if (editForm) {
            if (editForm.style.display === "none" || editForm.style.display === "") {
                editForm.style.display = "block";
            } else {
                editForm.style.display = "none";
            }
        }
    };

    // Xử lý hộp thoại thông báo lỗi
    const errDialog = document.getElementById("errDialog");
    const closeErrDialog = document.getElementById("closeDialog");
    if (errDialog) {
        closeErrDialog.addEventListener("click", function () {
            errDialog.close();
        });
    }

    // Xử lý hộp thoại thông báo thành công
    const successDialog = document.getElementById("successfullyDialog");
    const closeSuccessDialog = document.getElementById("closeDialogSS");
    if (successDialog) {
        closeSuccessDialog.addEventListener("click", function () {
            successDialog.close();
        });
    }

    // Xử lý hộp thoại xác nhận xóa
    const confirmDialog = document.getElementById("confirmDialog");
    const confirmYes = document.getElementById("confirmYes");
    const confirmNo = document.getElementById("confirmNo");

    if (confirmDialog) {
        confirmNo.addEventListener("click", function () {
            confirmDialog.close();
        });

        // Khi nhấn "Xóa", gửi form xóa người dùng
        confirmYes.addEventListener("click", function () {
            const formToDelete = document.querySelector("form[data-delete]");
            if (formToDelete) {
                formToDelete.submit();
            }
            confirmDialog.close();
        });
    }

    // Hiển thị hộp thoại xác nhận xóa khi nhấn nút "Xóa"
    window.showDeleteConfirmation = function (userId) {
        const form = document.querySelector(`form[action='/delete-user/${userId}']`);
        if (form) {
            // Lưu form xóa vào data-delete để gửi sau khi xác nhận
            const confirmDialog = document.getElementById("confirmDialog");
            const formToDelete = form; // Form xóa người dùng
            formToDelete.setAttribute("data-delete", true);
            confirmDialog.showModal();
        }
    };

    // Hàm hiển thị thông báo lỗi
    window.showErrorDialog = function (errorMessage) {
        const errorParagraph = document.getElementById("error");
        errorParagraph.textContent = errorMessage; // Cập nhật nội dung lỗi
        errDialog.showModal(); // Hiển thị hộp thoại lỗi
    };

    // Hàm hiển thị thông báo thành công
    window.showSuccessDialog = function (successMessage) {
        const notificationParagraph = document.getElementById("notificationSS");
        notificationParagraph.textContent = successMessage; // Cập nhật nội dung thành công
        successDialog.showModal(); // Hiển thị hộp thoại thành công
    };

    // Đóng hộp thoại thông báo lỗi
    if (closeErrDialog) {
        closeErrDialog.addEventListener("click", function () {
            errDialog.close();
        });
    }

    // Đóng hộp thoại thông báo thành công
    if (closeSuccessDialog) {
        closeSuccessDialog.addEventListener("click", function () {
            successDialog.close();
        });
    }
});
