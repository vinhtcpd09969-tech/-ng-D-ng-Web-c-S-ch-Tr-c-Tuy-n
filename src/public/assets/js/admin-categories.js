const checkAdmin = () => {
    const token = localStorage.getItem('token');
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    if (!token || user.role !== 'admin') window.location.href = '../login.html';
};
checkAdmin();

const tableBody = document.getElementById('category-list');
let myModal = null;

const fetchCategories = async () => {
    try {
        const res = await fetch(`${API_BASE_URL}/admin/categories?_t=${new Date().getTime()}`, {
            headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
        });
        if(!res.ok) throw new Error("Lỗi server");
        const categories = await res.json();
        renderTable(categories);
    } catch (error) {
        console.error(error);
        tableBody.innerHTML = '<tr><td colspan="3" class="text-danger text-center">Không tải được danh mục</td></tr>';
    }
};

const renderTable = (categories) => {
    tableBody.innerHTML = '';
    
    if (!categories || categories.length === 0) {
        tableBody.innerHTML = '<tr><td colspan="3" class="text-center py-4 text-muted">Chưa có danh mục nào.</td></tr>';
        return;
    }

    categories.forEach((cat, index) => {
        const isBlocked = cat.status === 'blocked';
        const rowClass = isBlocked ? 'bg-light' : '';
        const nameStyle = isBlocked ? 'text-decoration-line-through text-muted' : 'text-primary';

        let actionButtons = '';
        if (isBlocked) {
            actionButtons = `<button class="btn btn-sm btn-success fw-bold px-3" onclick="restoreCategory(${cat.id})" title="Khôi phục"><i class="fas fa-undo me-1"></i> Khôi phục</button>`;
        } else {
            actionButtons = `
                <button class="btn btn-sm btn-outline-warning me-2" onclick="editCategory(${cat.id}, '${cat.name}')" title="Sửa"><i class="fas fa-edit"></i></button>
                <button class="btn btn-sm btn-outline-danger" onclick="deleteCategory(${cat.id})" title="Ẩn"><i class="fas fa-eye-slash me-1"></i> Ẩn</button>
            `;
        }

        tableBody.innerHTML += `
            <tr class="${rowClass}">
                <td class="align-middle ${isBlocked ? 'text-muted' : ''}">${index + 1}</td>
                <td class="align-middle fw-bold ${nameStyle}">${cat.name}</td>
                <td class="align-middle text-end">${actionButtons}</td>
            </tr>`;
    });
};

window.openModal = () => {
    document.getElementById('cat-form').reset();
    document.getElementById('cat-id').value = '';
    document.getElementById('modal-title').textContent = 'Thêm danh mục';
    if (!myModal) myModal = new bootstrap.Modal(document.getElementById('categoryModal'));
    myModal.show();
};

// [ĐÃ NÂNG CẤP]: THÔNG BÁO THÊM/SỬA
window.saveCategory = async () => {
    const id = document.getElementById('cat-id').value;
    const name = document.getElementById('cat-name').value.trim();
    
    if (!name) {
        // Thông báo lỗi đẹp mắt
        return Swal.fire('Cảnh báo!', 'Tên danh mục không được để trống.', 'warning');
    }

    try {
        const url = id ? `${API_BASE_URL}/admin/categories/${id}` : `${API_BASE_URL}/admin/categories`;
        const method = id ? 'PUT' : 'POST';

        const res = await fetch(url, {
            method,
            headers: { 
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('token')}` 
            },
            body: JSON.stringify({ name })
        });
        
        const data = await res.json();
        
        if (res.ok) {
            // Thông báo thành công tự động tắt sau 1.5 giây
            Swal.fire({
                icon: 'success',
                title: 'Thành công!',
                text: id ? 'Đã cập nhật danh mục.' : 'Đã thêm danh mục mới.',
                timer: 1500,
                showConfirmButton: false
            });
            
            const modalEl = document.getElementById('categoryModal');
            const modalInst = bootstrap.Modal.getInstance(modalEl);
            if (modalInst) modalInst.hide();
            else if (myModal) myModal.hide();
            
            fetchCategories();
        } else {
            Swal.fire('Thất bại!', data.message || 'Lỗi khi lưu dữ liệu.', 'error');
        }
    } catch (e) { 
        console.error(e); 
        Swal.fire('Lỗi Server!', 'Không thể kết nối đến máy chủ.', 'error');
    }
};

window.editCategory = (id, name) => {
    document.getElementById('cat-id').value = id;
    document.getElementById('cat-name').value = name;
    document.getElementById('modal-title').textContent = 'Cập nhật danh mục';
    if (!myModal) myModal = new bootstrap.Modal(document.getElementById('categoryModal'));
    myModal.show();
};

// [ĐÃ NÂNG CẤP]: HỘP THOẠI XÁC NHẬN ẨN DANH MỤC
window.deleteCategory = async (id) => {
    // Hỏi xác nhận cực ngầu
    const result = await Swal.fire({
        title: 'Bạn có chắc chắn?',
        text: "Bạn muốn ẩn danh mục này khỏi trang chủ?",
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#d33',
        cancelButtonColor: '#6c757d',
        confirmButtonText: 'Vâng, ẩn nó đi!',
        cancelButtonText: 'Hủy'
    });

    if (result.isConfirmed) {
        try {
            const res = await fetch(`${API_BASE_URL}/admin/categories/${id}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
            });
            
            const data = await res.json().catch(() => ({}));
            
            if (res.ok) {
                Swal.fire('Đã ẩn!', 'Danh mục này đã được ẩn.', 'success');
                fetchCategories();
            } else {
                Swal.fire('Thất bại!', data.message || 'Lỗi ẩn danh mục', 'error');
            }
        } catch (e) { 
            Swal.fire('Lỗi Server!', 'Không thể kết nối.', 'error');
        }
    }
};

// [ĐÃ NÂNG CẤP]: HỘP THOẠI XÁC NHẬN KHÔI PHỤC
window.restoreCategory = async (id) => {
    const result = await Swal.fire({
        title: 'Khôi phục danh mục?',
        text: "Danh mục này sẽ hiển thị lại trên trang chủ.",
        icon: 'info',
        showCancelButton: true,
        confirmButtonColor: '#198754',
        cancelButtonColor: '#6c757d',
        confirmButtonText: 'Khôi phục',
        cancelButtonText: 'Hủy'
    });

    if (result.isConfirmed) {
        try {
            const res = await fetch(`${API_BASE_URL}/admin/categories/${id}/restore`, {
                method: 'PUT',
                headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
            });
            
            if (res.ok) {
                Swal.fire('Thành công!', 'Đã khôi phục danh mục.', 'success');
                fetchCategories(); 
            } else {
                const data = await res.json().catch(() => ({}));
                Swal.fire('Thất bại!', data.message || 'Lỗi khôi phục danh mục', 'error');
            }
        } catch (e) { 
            Swal.fire('Lỗi Server!', 'Không thể kết nối.', 'error');
        }
    }
};

document.addEventListener('DOMContentLoaded', fetchCategories);