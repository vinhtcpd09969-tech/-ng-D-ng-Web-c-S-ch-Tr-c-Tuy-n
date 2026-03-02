const checkAdmin = () => {
    const token = localStorage.getItem('token');
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    if (!token || user.role !== 'admin') window.location.href = '../login.html';
};
checkAdmin();

const tableBody = document.getElementById('review-list');
let allReviewsData = []; // [MỚI]: Biến lưu toàn bộ dữ liệu để Lọc không cần tải lại trang

const fetchReviews = async () => {
    try {
        const res = await fetch(`${API_BASE_URL}/admin/reviews`, {
            headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
        });
        allReviewsData = await res.json();
        
        // [MỚI]: Sắp xếp tạm trên Admin: Bài nào được ghim (is_pinned = 1) cho lên đầu
        allReviewsData.sort((a, b) => (b.is_pinned || 0) - (a.is_pinned || 0));
        
        renderTable(allReviewsData);
    } catch (error) {
        console.error(error);
        tableBody.innerHTML = '<tr><td colspan="6" class="text-danger text-center">Lỗi tải danh sách đánh giá</td></tr>';
    }
};

// ==========================================
// TÍNH NĂNG 3: LỌC THEO SỐ SAO
// ==========================================
window.filterReviews = () => {
    const keyword = document.getElementById('search-input').value.toLowerCase().trim();
    const starVal = document.getElementById('star-filter').value;

    const filtered = allReviewsData.filter(r => {
        // 1. Kiểm tra từ khóa (Tìm trong Tên sách, Tên User, Nội dung đánh giá)
        const matchKeyword = 
            r.book_title.toLowerCase().includes(keyword) || 
            r.user_name.toLowerCase().includes(keyword) || 
            r.comment.toLowerCase().includes(keyword);

        // 2. Kiểm tra số sao
        const matchStar = (starVal === 'all') || (r.rating == parseInt(starVal));

        return matchKeyword && matchStar;
    });

    renderTable(filtered);
};

const renderTable = (reviews) => {
    tableBody.innerHTML = '';
    
    if(!reviews || reviews.length === 0) {
        tableBody.innerHTML = '<tr><td colspan="6" class="text-center py-4 text-muted">Chưa có đánh giá nào</td></tr>';
        return;
    }
    
    reviews.forEach(review => {
        // Kiểm tra trạng thái ẩn và ghim
        const isHidden = review.status === 'hidden';
        const isPinned = review.is_pinned === 1; // [MỚI]
        
        // Tạo hiệu ứng CSS cho dòng bị ẩn hoặc được ghim
        let rowClass = '';
        let textStyle = '';
        
        if (isHidden) {
            rowClass = 'bg-light text-muted';
            textStyle = 'text-decoration-line-through opacity-50';
        } else if (isPinned) {
            rowClass = 'table-warning'; // [MỚI]: Nền vàng rực rỡ cho bài ghim
        }

        // Tạo nút bấm tương ứng
        let actionButtons = '';
        if (isHidden) {
            actionButtons = `<button class="btn btn-sm btn-success fw-bold px-3" onclick="restoreReview(${review.id})" title="Khôi phục hiển thị"><i class="fas fa-eye me-1"></i> Hiện</button>`;
        } else {
            // [MỚI]: Nút Ghim (Đổi màu nếu đang được ghim)
            const pinBtnClass = isPinned ? 'btn-warning text-dark fw-bold' : 'btn-outline-secondary';
            const pinIcon = isPinned ? 'fas fa-thumbtack' : 'fas fa-map-pin';
            const pinText = isPinned ? 'Bỏ ghim' : 'Ghim Top';

            actionButtons = `
                <button class="btn btn-sm ${pinBtnClass} me-2" onclick="togglePinReview(${review.id})" title="Ghim lên đầu"><i class="${pinIcon} me-1"></i> ${pinText}</button>
                <button class="btn btn-sm btn-outline-danger" onclick="hideReview(${review.id})" title="Ẩn đánh giá này khỏi trang chủ"><i class="fas fa-eye-slash me-1"></i> Ẩn</button>
            `;
        }

        // Vẽ hàng dữ liệu
        tableBody.innerHTML += `
            <tr class="${rowClass}">
                <td class="align-middle fw-bold ${isPinned ? 'text-danger' : ''}">${isPinned ? '<i class="fas fa-thumbtack me-1"></i>' : ''}${review.id}</td>
                <td class="align-middle fw-bold text-primary ${textStyle}">${review.book_title}</td>
                <td class="align-middle ${textStyle}">${review.user_name}</td>
                <td class="align-middle text-warning fw-bold ${textStyle}">${review.rating} <i class="fas fa-star"></i></td>
                <td class="align-middle ${textStyle}">${review.comment}</td>
                <td class="align-middle text-center" style="min-width: 180px;">${actionButtons}</td>
            </tr>`;
    });
};

// ==========================================
// TÍNH NĂNG 4: GHIM ĐÁNH GIÁ (SWEETALERT2)
// ==========================================
window.togglePinReview = async (id) => {
    try {
        const res = await fetch(`${API_BASE_URL}/admin/reviews/${id}/pin`, {
            method: 'PUT',
            headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
        });
        
        const data = await res.json();
        
        if (res.ok) {
            Swal.fire({
                icon: 'success',
                title: 'Thành công!',
                text: data.message, // Thông báo "Đã ghim" hoặc "Bỏ ghim"
                timer: 1500,
                showConfirmButton: false
            });
            fetchReviews(); // Tải lại để cập nhật màu sắc và vị trí
        } else {
            Swal.fire('Thất bại!', data.message || 'Lỗi khi ghim đánh giá', 'error');
        }
    } catch (e) {
        Swal.fire('Lỗi Server!', 'Không thể kết nối đến máy chủ.', 'error');
    }
};

// ==========================================
// TÍNH NĂNG 1: ẨN ĐÁNH GIÁ (SWEETALERT2)
// ==========================================
window.hideReview = async (id) => {
    const result = await Swal.fire({
        title: 'Ẩn đánh giá này?',
        text: "Đánh giá này sẽ bị ẩn khỏi trang đọc sách của người dùng!",
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#d33',
        cancelButtonColor: '#6c757d',
        confirmButtonText: 'Vâng, ẩn nó đi!',
        cancelButtonText: 'Hủy'
    });

    if (result.isConfirmed) {
        try {
            const res = await fetch(`${API_BASE_URL}/admin/reviews/${id}`, {
                method: 'DELETE', 
                headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
            });
            
            if (res.ok) {
                Swal.fire('Đã ẩn!', 'Đánh giá đã bị ẩn thành công.', 'success');
                fetchReviews(); // Tải lại bảng
            } else {
                const data = await res.json().catch(() => ({}));
                Swal.fire('Thất bại!', data.message || 'Lỗi khi ẩn đánh giá', 'error');
            }
        } catch (e) { 
            console.error(e);
            Swal.fire('Lỗi Server!', 'Không thể kết nối đến máy chủ.', 'error');
        }
    }
};

// ==========================================
// TÍNH NĂNG 1: HIỆN LẠI ĐÁNH GIÁ (SWEETALERT2)
// ==========================================
window.restoreReview = async (id) => {
    const result = await Swal.fire({
        title: 'Khôi phục đánh giá?',
        text: "Đánh giá này sẽ xuất hiện trở lại trên trang chi tiết sách.",
        icon: 'info',
        showCancelButton: true,
        confirmButtonColor: '#198754',
        cancelButtonColor: '#6c757d',
        confirmButtonText: 'Khôi phục',
        cancelButtonText: 'Hủy'
    });

    if (result.isConfirmed) {
        try {
            const res = await fetch(`${API_BASE_URL}/admin/reviews/${id}/restore`, {
                method: 'PUT',
                headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
            });
            
            if (res.ok) {
                Swal.fire('Thành công!', 'Đã hiển thị lại đánh giá.', 'success');
                fetchReviews(); 
            } else {
                const data = await res.json().catch(() => ({}));
                Swal.fire('Thất bại!', data.message || 'Lỗi khôi phục đánh giá', 'error');
            }
        } catch (e) { 
            Swal.fire('Lỗi Server!', 'Không thể kết nối đến máy chủ.', 'error');
        }
    }
};

document.addEventListener('DOMContentLoaded', fetchReviews);