const checkAdmin = () => {
    const token = localStorage.getItem('token');
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    if (!token || user.role !== 'admin') window.location.href = '../login.html';
};
checkAdmin();

const tableBody = document.getElementById('user-list');

const fetchUsers = async () => {
    try {
        const res = await fetch(`${API_BASE_URL}/admin/users?_t=${new Date().getTime()}`, {
            headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
        });
        if(!res.ok) throw new Error("Lỗi server");
        const users = await res.json();
        renderTable(users);
    } catch (error) {
        console.error(error);
        tableBody.innerHTML = '<tr><td colspan="5" class="text-danger text-center">Không tải được người dùng</td></tr>';
    }
};

const renderTable = (users) => {
    tableBody.innerHTML = '';
    
    if (!users || users.length === 0) {
        tableBody.innerHTML = '<tr><td colspan="5" class="text-center py-4 text-muted">Chưa có người dùng nào.</td></tr>';
        return;
    }

    users.forEach(user => {
        const isBlocked = user.status === 'blocked';
        const rowClass = isBlocked ? 'bg-light text-muted' : '';
        const nameStyle = isBlocked ? 'text-decoration-line-through' : 'fw-bold';

        let actionButtons = '';
        
        if (user.role !== 'admin') {
            if (isBlocked) {
                actionButtons = `<button class="btn btn-sm btn-success fw-bold px-3" onclick="restoreUser(${user.id})" title="Mở khóa tài khoản"><i class="fas fa-undo me-1"></i> Mở khóa</button>`;
            } else {
                actionButtons = `<button class="btn btn-sm btn-outline-danger" onclick="deleteUser(${user.id})" title="Khóa tài khoản"><i class="fas fa-lock me-1"></i> Khóa</button>`;
            }
        } else {
            actionButtons = `<span class="badge bg-secondary opacity-50"><i class="fas fa-shield-alt"></i> Quản trị</span>`;
        }

        tableBody.innerHTML += `
            <tr class="${rowClass}">
                <td class="align-middle">${user.id}</td>
                <td class="align-middle ${nameStyle}">${user.name}</td>
                <td class="align-middle ${isBlocked ? 'text-muted' : ''}">${user.email}</td>
                <td class="align-middle"><span class="badge ${user.role === 'admin' ? 'bg-danger' : (isBlocked ? 'bg-secondary' : 'bg-success')}">${isBlocked ? 'Bị khóa' : user.role}</span></td>
                <td class="align-middle text-end">${actionButtons}</td>
            </tr>`;
    });
};

// ==========================================
// 1. NÂNG CẤP HÀM KHÓA TÀI KHOẢN
// ==========================================
window.deleteUser = async (id) => {
    // Hộp thoại xác nhận rủi ro màu đỏ
    const result = await Swal.fire({
        title: 'Bạn muốn khóa tài khoản này?',
        text: "Người dùng sẽ bị đăng xuất và không thể tiếp tục hoạt động!",
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#d33',
        cancelButtonColor: '#6c757d',
        confirmButtonText: 'Vâng, khóa ngay!',
        cancelButtonText: 'Hủy'
    });

    if (result.isConfirmed) {
        try {
            const res = await fetch(`${API_BASE_URL}/admin/users/${id}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
            });
            
            const data = await res.json().catch(() => ({}));

            if (res.ok) {
                Swal.fire({
                    icon: 'success',
                    title: 'Đã khóa!',
                    text: 'Tài khoản này đã bị khóa thành công.',
                    timer: 1500,
                    showConfirmButton: false
                });
                fetchUsers();
            } else {
                Swal.fire('Thất bại!', data.message || 'Lỗi khóa người dùng', 'error');
            }
        } catch (e) { 
            console.error(e); 
            Swal.fire('Lỗi Server!', 'Không thể kết nối đến máy chủ.', 'error');
        }
    }
};

// ==========================================
// 2. NÂNG CẤP HÀM MỞ KHÓA TÀI KHOẢN
// ==========================================
window.restoreUser = async (id) => {
    // Hộp thoại thông tin thân thiện màu xanh
    const result = await Swal.fire({
        title: 'Mở khóa tài khoản?',
        text: "Người dùng này sẽ có thể đăng nhập và bình luận trở lại.",
        icon: 'info',
        showCancelButton: true,
        confirmButtonColor: '#198754',
        cancelButtonColor: '#6c757d',
        confirmButtonText: 'Mở khóa',
        cancelButtonText: 'Hủy'
    });

    if (result.isConfirmed) {
        try {
            const res = await fetch(`${API_BASE_URL}/admin/users/${id}/restore`, {
                method: 'PUT',
                headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
            });
            
            if (res.ok) {
                Swal.fire({
                    icon: 'success',
                    title: 'Thành công!',
                    text: 'Đã mở khóa tài khoản thành công.',
                    timer: 1500,
                    showConfirmButton: false
                });
                fetchUsers();
            } else {
                const data = await res.json().catch(() => ({}));
                Swal.fire('Thất bại!', data.message || 'Lỗi mở khóa tài khoản', 'error');
            }
        } catch (e) { 
            console.error(e);
            Swal.fire('Lỗi Server!', 'Không thể kết nối đến máy chủ.', 'error');
        }
    }
};

document.addEventListener('DOMContentLoaded', fetchUsers);