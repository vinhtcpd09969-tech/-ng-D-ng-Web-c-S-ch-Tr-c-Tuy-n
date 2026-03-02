const loginForm = document.getElementById('login-form');    
const submitBtn = document.getElementById('btn-submit');

// Biến lưu trữ token tạm thời khi được yêu cầu đổi mật khẩu
let temporaryToken = ''; 

// ==========================================
// 1. CHỨC NĂNG ĐĂNG NHẬP
// ==========================================
const handleLogin = async (e) => {
    e.preventDefault();

    const email = document.getElementById('email').value.trim();
    const password = document.getElementById('password').value;

    const originalBtnText = submitBtn.textContent;
    submitBtn.textContent = 'Đang xử lý...';
    submitBtn.disabled = true;

    try {
        const response = await fetch(`${API_BASE_URL}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password })
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.message || 'Đăng nhập thất bại, vui lòng kiểm tra lại!');
        }

        // KIỂM TRA CỜ BẮT BUỘC ĐỔI MẬT KHẨU
        if (data.requireChange) {
            temporaryToken = data.tempToken; 
            
            // Hiện thông báo yêu cầu đổi mật khẩu
            Swal.fire({
                icon: 'warning',
                title: 'Yêu cầu bảo mật',
                text: 'Đây là lần đăng nhập đầu tiên hoặc mật khẩu của bạn đã bị reset. Vui lòng đổi mật khẩu mới!',
                confirmButtonText: 'Đổi mật khẩu ngay'
            }).then(() => {
                const changeModal = new bootstrap.Modal(document.getElementById('forceChangePasswordModal'));
                changeModal.show();
            });
            
            submitBtn.textContent = originalBtnText;
            submitBtn.disabled = false;
            return; 
        }

        // --- NẾU ĐĂNG NHẬP BÌNH THƯỜNG ---
        localStorage.setItem('token', data.token);
        localStorage.setItem('user', JSON.stringify(data.user));

        // Thông báo thành công cực mượt
        Swal.fire({
            icon: 'success',
            title: 'Đăng nhập thành công!',
            text: 'Đang chuyển hướng về trang chủ...',
            timer: 1500,
            showConfirmButton: false,
            allowOutsideClick: false,
            didOpen: () => {
                Swal.showLoading(); // Hiện vòng xoay loading
            }
        });

        setTimeout(() => {
            window.location.href = 'index.html';
        }, 1500);

    } catch (error) {
        console.error('Lỗi đăng nhập:', error);
        
        // Báo lỗi bằng SweetAlert2
        Swal.fire({
            icon: 'error',
            title: 'Đăng nhập thất bại',
            text: error.message,
            confirmButtonColor: '#d33'
        });
        
        submitBtn.textContent = originalBtnText;
        submitBtn.disabled = false;
    }
};

if (loginForm) {
    loginForm.addEventListener('submit', handleLogin);
}

// ==========================================
// 2. CHỨC NĂNG QUÊN MẬT KHẨU
// ==========================================
window.submitForgotPassword = async () => {
    const emailInput = document.getElementById('forgot-email');
    const email = emailInput.value.trim();
    const btnSubmitForgot = document.getElementById('btn-confirm-forgot');

    if (!email) {
        return Swal.fire('Cảnh báo', 'Vui lòng nhập địa chỉ email của bạn!', 'warning');
    }

    const originalText = btnSubmitForgot.innerHTML;
    btnSubmitForgot.disabled = true;
    btnSubmitForgot.innerHTML = '<span class="spinner-border spinner-border-sm me-2"></span>Đang gửi...';

    // Bật hiệu ứng Loading xoay xoay vì gửi mail thường mất vài giây
    Swal.fire({
        title: 'Đang gửi email...',
        text: 'Vui lòng chờ trong giây lát',
        allowOutsideClick: false,
        didOpen: () => Swal.showLoading()
    });

    try {
        const res = await fetch(`${API_BASE_URL}/auth/forgot-password`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email })
        });

        const data = await res.json();
        
        if (res.ok) {
            Swal.fire({
                icon: 'success',
                title: 'Đã gửi Email!',
                text: data.message,
                confirmButtonColor: '#0d6efd'
            });
            emailInput.value = ''; 
            
            const modalElement = document.getElementById('forgotPasswordModal');
            const modalInstance = bootstrap.Modal.getInstance(modalElement);
            if (modalInstance) modalInstance.hide();
            
        } else {
            Swal.fire('Lỗi!', data.message, 'error');
        }
    } catch (error) {
        Swal.fire('Lỗi kết nối!', 'Không thể kết nối đến máy chủ, vui lòng thử lại sau.', 'error');
    } finally {
        btnSubmitForgot.disabled = false;
        btnSubmitForgot.innerHTML = originalText;
    }
};

// ==========================================
// 3. CHỨC NĂNG ĐỔI MẬT KHẨU TẠM THỜI
// ==========================================
window.submitForceChangePassword = async () => {
    const newPassword = document.getElementById('new-password').value;
    const btnSubmitChange = document.getElementById('btn-confirm-change');

    if (newPassword.length < 6) {
        return Swal.fire('Cảnh báo', 'Mật khẩu mới phải có ít nhất 6 ký tự!', 'warning');
    }

    const originalText = btnSubmitChange.innerHTML;
    btnSubmitChange.disabled = true;
    btnSubmitChange.innerHTML = '<span class="spinner-border spinner-border-sm me-2"></span>Đang xử lý...';

    try {
        const res = await fetch(`${API_BASE_URL}/auth/change-temp-password`, {
            method: 'POST',
            headers: { 
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${temporaryToken}` 
            },
            body: JSON.stringify({ newPassword })
        });

        const data = await res.json();
        
        if (!res.ok) throw new Error(data.message);

        localStorage.setItem('token', data.token);
        localStorage.setItem('user', JSON.stringify(data.user));

        Swal.fire({
            icon: 'success',
            title: 'Thành công!',
            text: 'Đổi mật khẩu thành công. Đang vào trang chủ...',
            timer: 1500,
            showConfirmButton: false,
            allowOutsideClick: false,
            didOpen: () => Swal.showLoading()
        });

        setTimeout(() => {
            window.location.href = 'index.html';
        }, 1500);

    } catch (error) {
        Swal.fire('Thất bại!', error.message, 'error');
        btnSubmitChange.disabled = false;
        btnSubmitChange.innerHTML = originalText;
    }
};