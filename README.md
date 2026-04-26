📚 Ứng Dụng Web Đọc Sách Trực Tuyến

Dự án là một ứng dụng web đọc sách và truyện được phát triển trên nền tảng Node.js. Hệ thống được xây dựng theo mô hình kiến trúc MVC, cung cấp đầy đủ giao diện đọc sách cho người dùng cuối và trang quản lý dữ liệu dành riêng cho ban quản trị.

✨ Tính năng chính
Người dùng: Đăng nhập, đăng ký, tìm kiếm sách, xem chi tiết nội dung từng chương, để lại bình luận đánh giá và quản lý hồ sơ cá nhân.

Quản trị viên: Thêm sửa xóa người dùng, danh mục sách, đầu sách, chương truyện và quản lý các lượt đánh giá.

Hệ thống chung: Tải và lưu trữ hình ảnh, xác thực bảo mật tài khoản và phân quyền truy cập chuyên sâu.

🛠 Công nghệ sử dụng
Backend: Node.js và Express.js

Cơ sở dữ liệu: MongoDB

Frontend: HTML, CSS và JavaScript thuần

📁 Cấu trúc thư mục
src/config: Chứa các tệp cấu hình kết nối cơ sở dữ liệu.

src/controllers: Xử lý logic nghiệp vụ hệ thống phân chia rõ ràng giữa client và admin.

src/middlewares: Xử lý trung gian hỗ trợ xác thực tài khoản, kiểm tra quyền quản trị và nhận file tải lên.

src/models: Định nghĩa các bảng cấu trúc dữ liệu cho người dùng, sách, danh mục, chương và đánh giá.

src/public: Chứa toàn bộ giao diện website tĩnh và thư mục lưu trữ ảnh tải lên.

src/routes: Phân luồng điều hướng đường dẫn API kết nối đến controller tương ứng.

src/app.js: Tệp tin gốc dùng để khởi chạy máy chủ.

🚀 Hướng dẫn cài đặt
Clone mã nguồn dự án về máy tính cá nhân.

Mở terminal tại thư mục gốc và chạy lệnh npm install để tải thư viện.

Thiết lập biến môi trường và chuỗi kết nối cơ sở dữ liệu tương ứng.

Khởi chạy dự án bằng lệnh node src/app.js.

Mở trình duyệt và truy cập hệ thống tại địa chỉ http://localhost:3000.
