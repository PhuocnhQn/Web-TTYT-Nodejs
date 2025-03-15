# Web-TTYT-Nodejs: Ứng Dụng Web Quản Lý Báo Cáo Y Tế

## Tổng Quan

Dự án này là một ứng dụng web được xây dựng bằng Node.js, Express.js và MongoDB, giúp quản lý báo cáo y tế. Ứng dụng cho phép người dùng được phân quyền để gửi, xem, chỉnh sửa và quản lý báo cáo liên quan đến lĩnh vực y tế. Hệ thống có kiểm soát truy cập dựa trên vai trò, tổng hợp dữ liệu, và xử lý lỗi bằng hộp thoại thông báo.

## Tính Năng

- **Xác thực Người Dùng:** Đăng nhập an toàn với các vai trò khác nhau (quản trị viên và người dùng thông thường).
- **Kiểm Soát Quyền Truy Cập:** Giao diện và chức năng thay đổi theo từng vai trò.
- **Quản Lý Báo Cáo:**
  - Người dùng có thể thêm báo cáo mới cho đơn vị được chỉ định.
  - Quản trị viên có thể thêm người dùng với các vai trò khác nhau.
  - Người dùng có thể chỉnh sửa báo cáo của họ.
  - Quản trị viên có thể xóa bất kỳ báo cáo nào.
  - Theo dõi lịch sử chỉnh sửa báo cáo (ai đã thay đổi dữ liệu và khi nào).
- **Xem và Tổng Hợp Báo Cáo:**
  - Người dùng có thể xem báo cáo đã gửi theo tháng và năm.
  - Người dùng có thể xem tổng hợp dữ liệu theo một khoảng thời gian cụ thể.
  - Quản trị viên có thể xem tất cả các báo cáo.
- **Xuất Dữ Liệu:** Quản trị viên có thể xuất báo cáo ra tệp Excel.
- **Quản Lý Mật Khẩu:** Người dùng có thể thay đổi mật khẩu của họ.
- **Xử Lý Lỗi:** Hiển thị lỗi dưới dạng hộp thoại để thông báo cho người dùng.
- **Giao Diện Thích Ứng:** Giao diện đơn giản, tự điều chỉnh với kích thước màn hình khác nhau.

## Công Nghệ Sử Dụng

- **Backend:**
  - Node.js
  - Express.js
  - MongoDB với Mongoose
  - bcrypt (mã hóa mật khẩu)
  - exceljs (xuất tệp Excel)
  - qrcode (tạo mã QR)
- **Frontend:**
  - HTML5
  - CSS3 (Tùy chỉnh giao diện)
  - JavaScript (DOM Manipulation)
  - EJS (Giao diện động)

## Hướng Dẫn Cài Đặt

1. **Clone kho mã nguồn:**

   ```bash
   git clone https://github.com/PhuocnhQn/Web-TTYT-Nodejs.git
   cd Web-TTYT-Nodejs
   ```

2. **Cài đặt các thư viện cần thiết:**

   ```bash
   npm install
   ```

3. **Thiết lập MongoDB:**

   - Đảm bảo bạn đã cài đặt và chạy MongoDB.
   - Tạo tệp `.env` trong thư mục gốc của dự án với nội dung sau:

   ```
   MONGODB_URI=chuoi_ket_noi_mongodb_cua_ban
   SESSION_SECRET=chuoi_bi_mat_cua_ban
   ```

   - Thay `chuoi_ket_noi_mongodb_cua_ban` bằng chuỗi kết nối MongoDB của bạn và `chuoi_bi_mat_cua_ban` bằng một chuỗi bí mật dùng cho quản lý phiên đăng nhập.
   **cầu trúc dữ liệu MongoDB với user là a và mật khẩu là a:**
 ```
    _id
    67d59c94429dae02b63b70c7
    name
    "a"
    username
    "a"
    password
    "$2b$10$QXfUWDm.RCtvyWu7da92p.vYr2/XGC8K5NNmT053AS82N2h26z1sy"
    role
    "admin"
    __v
    0
 ```
4. **Khởi chạy ứng dụng:**

   ```bash
   npm start
   ```

5. **Truy cập ứng dụng:**

- Ứng dụng sẽ chạy tại `http://localhost:3000`.

## Thiết Lập Cơ Sở Dữ Liệu

- Đảm bảo bạn có cơ sở dữ liệu tên là `web-tyt`.
- Ứng dụng sử dụng Mongoose để làm việc với MongoDB. Các mô hình dữ liệu gồm:
  - **User Model:** Lưu trữ thông tin người dùng gồm `name`, `username`, `password` (được mã hóa) và `role`.
  - **Report Model:** Lưu trữ thông tin báo cáo, bao gồm `userId`, `totalVisits`, `childrenUnder14`, `visitsWithIDExcludingChildren`, `reportingUnit`, `month`, `year`, `birthCertificate`, `deathCertificate`, `percentage`, và danh sách chỉnh sửa.

## Cách Sử Dụng

1. **Truy cập ứng dụng:** Mở trình duyệt và vào địa chỉ `http://localhost:3000`.

2. **Đăng nhập:** Dùng tài khoản để đăng nhập với vai trò quản trị viên hoặc người dùng.

3. **Chức năng chính:**

   - **Trang chủ (Dashboard):** Hiển thị danh sách báo cáo, có thể thêm, sửa hoặc xóa (chỉ admin mới có quyền xóa).
   - **Thêm Người Dùng (Add User) (Chỉ Admin):** Thêm người dùng mới với vai trò tương ứng.
   - **Xem Báo Cáo (View Reports):** Chọn tháng và năm để xem báo cáo.
   - **Xem Báo Cáo Tổng Hợp (View Aggregated Reports):** Chọn khoảng thời gian để xem tổng hợp báo cáo.
   - **Đổi Mật Khẩu (Change Password):** Thay đổi mật khẩu tài khoản.
   - **Đăng Xuất (Logout):** Thoát khỏi hệ thống.

4. **Quản lý báo cáo:**

   - Người dùng có thể tạo mới, chỉnh sửa báo cáo.
   - Admin có thể xóa bất kỳ báo cáo nào.

5. **Xuất báo cáo:**

   - Trong mục `Xem Báo Cáo`, nhấn vào nút `Xuất` để tải báo cáo dưới dạng file Excel.

6. **Xử lý lỗi:**

   - Khi xảy ra lỗi, hệ thống sẽ hiển thị hộp thoại cảnh báo.

## Cấu Trúc Thư Mục

- `public/`: Chứa các tệp tĩnh như CSS, JavaScript.
- `routes/`: Định nghĩa các tuyến đường (routes) của ứng dụng.
- `controllers/`: Chứa các hàm xử lý yêu cầu.
- `models/`: Chứa các schema Mongoose.
- `services/`: Chứa các dịch vụ độc lập.
- `middlewares/`: Chứa các middleware xác thực, phân quyền.
- `views/`: Chứa các tệp giao diện EJS.
- `app.js` (hoặc `index.js`): Tệp chính chạy server Express.
- `package.json`: Danh sách thư viện cần thiết cho dự án.

## Lưu Ý Quan Trọng

- **Bảo mật:** Kiểm tra và lọc dữ liệu đầu vào để tránh các lỗ hổng như XSS, SQL Injection.
- **Kiểm thử:** Cần bổ sung thêm các kiểm thử cho nhiều trường hợp khác nhau.
- **Hiệu suất:** Nếu có nhiều người dùng, cần tối ưu hóa truy vấn cơ sở dữ liệu, sử dụng bộ nhớ đệm (cache) hoặc thiết lập proxy.
- **Xử lý lỗi:** Kiểm tra kỹ code để đảm bảo không có lỗi chưa xử lý và ghi lại log lỗi.

## Đóng Góp

Nếu bạn muốn đóng góp cho dự án, hãy clone repo, tạo pull request với các thay đổi của bạn. Hãy đảm bảo kiểm thử mã nguồn trước khi gửi.

## Giấy Phép

Dự án này được cấp phép theo **MIT License**.

## Liên Hệ

Email: [phuocnh.hiepz@gmail.com](mailto\:phuocnh.hiepz@gmail.com)

viết bằng README.md

