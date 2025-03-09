document.getElementById('changePasswordForm').addEventListener('submit', function (event) {
    event.preventDefault();
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
    const currentPassword = document.getElementById('currentPassword').value;
    const newPassword = document.getElementById('newPassword').value;
    const confirmPassword = document.getElementById('confirmPassword').value;

    fetch('/user/change-password', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ currentPassword, newPassword, confirmPassword }),
    })
        .then(response => response.json())
        .then(data => {
            const messageDiv = document.getElementById('message');
            if (data.message) {
                messageDiv.innerHTML = `<p style="color: green;">${data.message}</p>`;
            } else if (data.error) {
                messageDiv.innerHTML = `<p style="color: red;">${data.error}</p>`;
            } else if (data.message) {
                messageDiv.innerHTML = `<p style="color: red;">${data.message}</p>`;
            }
        })
        .catch(error => {
            console.error(error);
            const messageDiv = document.getElementById('message');
            messageDiv.innerHTML = `<p style="color: red;">An error occurred while changing the password.</p>`;
        });
});