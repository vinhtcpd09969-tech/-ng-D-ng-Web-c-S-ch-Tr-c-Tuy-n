/**
 * src/public/assets/js/common.js
 * Chứa cấu hình chung và các hàm tiện ích dùng cho toàn trang
 */

// 1. Cấu hình đường dẫn
const API_BASE_URL = 'http://localhost:3000/api';
const UPLOAD_BASE_URL = 'http://localhost:3000/uploads/';

// 2. Hàm hiển thị thông báo (Sửa lỗi showAlert is not defined)
const showAlert = (containerId, message, type = 'info') => {
    const alertPlaceholder = document.getElementById(containerId);
    if (alertPlaceholder) {
        alertPlaceholder.innerHTML = `
            <div class="alert alert-${type} alert-dismissible fade show" role="alert">
                ${message}
                <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
            </div>
        `;
    }
};

// 3. Xử lý hiển thị Menu User sau khi đăng nhập
document.addEventListener('DOMContentLoaded', () => {
    const loginNavItem = document.getElementById('login-nav-item');
    if (!loginNavItem) return;

    const token = localStorage.getItem('token');
    const userStr = localStorage.getItem('user');

    if (!token || !userStr) return;

    try {
        const user = JSON.parse(userStr);
        const authTemplate = document.getElementById('auth-template');
        if (!authTemplate) return;

        const node = authTemplate.content.cloneNode(true);
        const nameSpan = node.querySelector('.user-name');
        if (nameSpan) nameSpan.textContent = user.name || user.email;

        if (user.role === 'admin') {
            const adminItem = node.querySelector('.admin-link-item');
            if (adminItem) adminItem.style.display = 'block';
        }

        // ĐÃ XÓA đoạn code logoutBtn.addEventListener cũ ở đây
        // Mọi thao tác click Đăng xuất giờ sẽ do bộ lắng nghe sự kiện toàn cục bên dưới quản lý!

        loginNavItem.innerHTML = ''; 
        loginNavItem.appendChild(node);
        loginNavItem.classList.remove('nav-item'); 
        loginNavItem.classList.add('d-flex', 'align-items-center');

    } catch (e) {
        console.error("Lỗi parse user:", e);
        localStorage.clear();
    }
});

// 4. Định dạng tiền tệ
const formatCurrency = (amount) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);
};

// ==========================================
// HIỆU ỨNG ĐĂNG XUẤT TOÀN CỤC (DÙNG CHUNG CHO MỌI TRANG)
// ==========================================
document.addEventListener('click', function(e) {
    // Tìm xem người dùng có bấm vào nút nào chứa class 'btn-logout' không
    const logoutBtn = e.target.closest('.btn-logout');
    
    if (logoutBtn) {
        e.preventDefault(); // Chặn việc thẻ <a> tự động chuyển trang

        // 1. Hiển thị hộp thoại hỏi xác nhận
        Swal.fire({
            title: 'Đăng xuất?',
            text: "Bạn có chắc chắn muốn đăng xuất khỏi hệ thống?",
            icon: 'question',
            showCancelButton: true,
            confirmButtonColor: '#d33', // Màu đỏ cảnh báo
            cancelButtonColor: '#6c757d',
            confirmButtonText: 'Đăng xuất',
            cancelButtonText: 'Hủy'
        }).then((result) => {
            if (result.isConfirmed) {
                
                // 2. Hiện hiệu ứng Loading chia tay ngọt ngào
                Swal.fire({
                    title: 'Đang đăng xuất...',
                    text: 'Hẹn gặp lại bạn nhé!',
                    allowOutsideClick: false,
                    timer: 1200, // Quay 1.2 giây cho mượt
                    didOpen: () => {
                        Swal.showLoading();
                    }
                }).then(() => {
                    // 3. Xóa dữ liệu phiên đăng nhập
                    localStorage.removeItem('token');
                    localStorage.removeItem('user');
                    
                    // 4. Chuyển hướng (Kiểm tra xem đang ở trang Admin hay trang ngoài để lùi thư mục cho đúng)
                    const currentPath = window.location.pathname;
                    if (currentPath.includes('/admin/')) {
                        window.location.href = '../login.html';
                    } else {
                        window.location.href = 'login.html';
                    }
                });
            }
        });
    }
});