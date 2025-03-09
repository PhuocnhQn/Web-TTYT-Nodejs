const urlInput = document.getElementById('url');
const qrCodeImage = document.getElementById('qr-code');
const qrCodeContainer = document.getElementById('qr-code-container');
const downloadLink = document.getElementById('download-qr-code');

const dialog = document.getElementById('errDialog');
const errorDisplay = document.getElementById('error');
const closeButton = document.getElementById('closeDialog');

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
});
function refreshPage() {
    location.reload(); // Tải lại trang
};
async function generateQRCode() {
    const url = urlInput.value;

    if (!url) {
        showDialog({ message: 'Please enter a URL.', type: 'warning' }); // Sửa ở đây
        return;
    }
    try {
        const response = await fetch('/generate', { // Đường dẫn API đã sửa
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ url: url })
        });

        if (response.ok) {
            const data = await response.json();
            qrCodeImage.src = data.qrCode;
            downloadLink.href = data.qrCode; // Cập nhật href của link download
            qrCodeContainer.style.display = 'block'; // Show the container

        } else {
            const errorData = await response.json();
            alert(`Error generating QR code: ${errorData.message}`);
        }
    } catch (error) {
        console.error('Error generating QR code:', error);
        alert('Error generating QR code.' + error);
    }
}