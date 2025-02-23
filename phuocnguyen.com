server {
    listen 80;
    listen [::]:80;

    # Đặt thư mục root cho các file tĩnh
    root /var/www/phuocnguyen.com/html;
    index index.html index.htm index.nginx-debian.html;

    # Định nghĩa server_name
    server_name phuocnguyen.online www.phuocnguyen.online;

    # Cấu hình cho /filezip
    location /filezip {
        autoindex on;  # Cho phép liệt kê file trong thư mục
        autoindex_exact_size off;  # Hiển thị kích thước file ở dạng thân thiện
        autoindex_localtime on;  # Hiển thị thời gian file theo localtime
    }

    # Cấu hình reverse proxy cho ứng dụng Node.js
    location / {
        proxy_pass http://localhost:3000;  # Trỏ về ứng dụng Node.js chạy trên cổng 3000
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
