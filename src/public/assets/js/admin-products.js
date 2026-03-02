const checkAdmin = () => {
    const token = localStorage.getItem('token');
    const userStr = localStorage.getItem('user');
    if (!token || !userStr) {
        alert('Phiên đăng nhập hết hạn. Vui lòng đăng nhập lại!');
        window.location.href = '/login.html'; 
        return;
    }
    try {
        const user = JSON.parse(userStr);
        if (user.role !== 'admin') {
            alert('Tài khoản này không có quyền Admin!');
            window.location.href = '/index.html'; 
        }
    } catch (e) {
        window.location.href = '/login.html';
    }
};
checkAdmin();

let myModal = null; 
const productTemplate = document.getElementById('product-row-template');

// --- [MỚI]: Biến lưu trữ dữ liệu gốc để phục vụ tìm kiếm ---
let allBooksData = []; 

const loadCategories = async () => {
    try {
        const res = await fetch(`${API_BASE_URL}/admin/categories`, {
            headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
        });
        if(!res.ok) return; 
        const categories = await res.json();
        
        const select = document.getElementById('category_id');
        if(select) {
            select.innerHTML = '<option value="">-- Chọn danh mục --</option>';
            categories.forEach(cat => {
                const opt = document.createElement('option');
                opt.value = cat.id;
                opt.textContent = cat.name;
                select.appendChild(opt);
            });
        }
    } catch (error) { console.error("Lỗi tải danh mục:", error); }
};

const fetchBooks = async () => {
    try {
        // Thêm ?_t=... để ép trình duyệt luôn lấy dữ liệu mới nhất (chống lưu Cache cũ)
        const res = await fetch(`${API_BASE_URL}/admin/books?_t=${new Date().getTime()}`, {
            headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
        });
        
        if (!res.ok) throw new Error("Lỗi tải dữ liệu");
        
        const result = await res.json();
        
        // --- [SỬA]: Gán dữ liệu vào biến allBooksData để tìm kiếm ---
        allBooksData = Array.isArray(result) ? result : (result.data || []);
        
        // In ra console để kiểm tra dữ liệu
        console.log("Danh sách sách tải về:", allBooksData);
        
        renderTable(allBooksData);
    } catch (error) {
        document.getElementById('product-list').innerHTML = `
            <tr><td colspan="6" class="text-center text-danger fw-bold py-5">
                <i class="fas fa-exclamation-triangle me-2"></i> KHÔNG TẢI ĐƯỢC DỮ LIỆU
            </td></tr>`;
    }
};

// --- [MỚI]: Hàm Tìm kiếm Live Search (gõ tới đâu tìm tới đó) ---
window.searchBooks = () => {
    const keyword = document.getElementById('book-search').value.toLowerCase().trim();
    
    // Lọc dữ liệu từ biến allBooksData đã lưu sẵn
    const filtered = allBooksData.filter(book => 
        book.title.toLowerCase().includes(keyword) || 
        book.author.toLowerCase().includes(keyword) ||
        (book.isbn && book.isbn.toLowerCase().includes(keyword))
    );
    
    // Vẽ lại bảng với dữ liệu đã lọc
    renderTable(filtered);
};

const renderTable = (books) => {
    const tbody = document.getElementById('product-list');
    tbody.innerHTML = '';

    if (!books || books.length === 0) {
        tbody.innerHTML = '<tr><td colspan="6" class="text-center py-4 text-muted">Chưa có cuốn sách nào.</td></tr>';
        return;
    }

    // Vẽ trực tiếp từng hàng dữ liệu, không dùng Template nữa để tránh lỗi ngầm
    books.forEach((book, index) => {
        const isBlocked = book.status === 'blocked';
        
        // Cấu hình giao diện tùy theo trạng thái
        const rowClass = isBlocked ? 'bg-light' : '';
        const titleClass = isBlocked ? 'text-decoration-line-through text-muted' : 'fw-bold text-primary';
        const imgUrl = book.image ? `${UPLOAD_BASE_URL}${book.image}` : 'https://placehold.co/50';

        // Xử lý nút bấm
        let actionHTML = '';
        if (isBlocked) {
            // Nếu bị khóa -> CHỈ HIỆN NÚT KHÔI PHỤC
            actionHTML = `<button class="btn btn-sm btn-success fw-bold px-3" onclick="restoreBook(${book.id})"><i class="fas fa-undo me-1"></i> Khôi phục</button>`;
        } else {
            // Nếu bình thường -> HIỆN NÚT CHƯƠNG, SỬA, KHÓA
            actionHTML = `
                <a href="chapters.html?bookId=${book.id}" class="btn btn-sm btn-info text-white me-2 fw-bold"><i class="fas fa-list me-1"></i> Chương</a>
                <button class="btn btn-sm btn-outline-warning me-2" onclick="editBook(${book.id})" title="Sửa"><i class="fas fa-edit"></i></button>
                <button class="btn btn-sm btn-outline-danger" onclick="deleteBook(${book.id})" title="Khóa sách"><i class="fas fa-lock me-1"></i> Ẩn</button>
            `;
        }

        // Chèn vào bảng
        tbody.innerHTML += `
            <tr class="${rowClass}">
                <td class="align-middle text-center ${isBlocked ? 'text-muted' : ''}">${index + 1}</td>
                <td class="align-middle">
                    <img src="${imgUrl}" alt="book" style="width: 50px; height: 75px; object-fit: cover;" class="rounded shadow-sm ${isBlocked ? 'opacity-50' : ''}" onerror="this.src='https://placehold.co/50'">
                </td>
                <td class="align-middle ${titleClass}">${book.title}</td>
                <td class="align-middle ${isBlocked ? 'text-muted' : ''}">${book.author}</td>
                <td class="align-middle">
                    <span class="badge ${isBlocked ? 'bg-secondary' : 'bg-primary'}">${book.category_name || '---'}</span>
                </td>
                <td class="align-middle text-end pe-4">${actionHTML}</td>
            </tr>
        `;
    });
};

window.openModal = (isEdit = false) => {
    const modalTitle = document.getElementById('modal-title');
    const form = document.getElementById('product-form');
    
    loadCategories().then(() => {
        if (!isEdit) {
            form.reset();
            document.getElementById('book-id').value = '';
            modalTitle.textContent = 'Thêm sách mới';
        } else modalTitle.textContent = 'Cập nhật sách';
    
        if (!myModal) myModal = new bootstrap.Modal(document.getElementById('productModal'));
        myModal.show();
    });
};

window.saveBook = async () => {
    const token = localStorage.getItem('token');
    const id = document.getElementById('book-id').value;
    
    const title = document.getElementById('title').value.trim();
    const author = document.getElementById('author').value.trim();
    const categoryId = document.getElementById('category_id').value;
    const isbn = document.getElementById('isbn').value.trim();
    const year = document.getElementById('year').value.trim();
    const desc = document.getElementById('description').value.trim();
    const content = document.getElementById('content').value.trim();
    const imageFile = document.getElementById('image').files[0];

    // --- Bắt lỗi bằng SweetAlert2 ---
    if (!title) return Swal.fire('Cảnh báo!', 'Vui lòng nhập Tên sách!', 'warning');
    if (!author) return Swal.fire('Cảnh báo!', 'Vui lòng nhập Tác giả!', 'warning');
    if (!categoryId) return Swal.fire('Cảnh báo!', 'Vui lòng chọn Danh mục!', 'warning');
    if (!isbn) return Swal.fire('Cảnh báo!', 'Vui lòng nhập Mã ISBN!', 'warning');
    
    if (!year || isNaN(year) || Number(year) <= 0) {
        return Swal.fire('Cảnh báo!', 'Vui lòng nhập Năm xuất bản hợp lệ (phải là số)!', 'warning');
    }
    if (!id && !imageFile) {
        return Swal.fire('Cảnh báo!', 'Vui lòng chọn Ảnh bìa cho sách mới!', 'warning');
    }

    const formData = new FormData();
    formData.append('title', title);
    formData.append('author', author);
    formData.append('category_id', categoryId);
    formData.append('isbn', isbn);
    formData.append('year', year);
    formData.append('description', desc);
    formData.append('content', content);
    if (imageFile) formData.append('image', imageFile);

    try {
        const url = id ? `${API_BASE_URL}/admin/books/${id}` : `${API_BASE_URL}/admin/books`;
        const method = id ? 'PUT' : 'POST';

        // --- Hiệu ứng Loading xịn sò ---
        Swal.fire({
            title: 'Đang xử lý...',
            text: 'Vui lòng chờ trong giây lát',
            allowOutsideClick: false,
            didOpen: () => {
                Swal.showLoading();
            }
        });

        const res = await fetch(url, {
            method,
            headers: { 'Authorization': `Bearer ${token}` },
            body: formData
        });

        const data = await res.json();
        if (!res.ok) throw new Error(data.message || 'Lỗi lưu dữ liệu');
        
        // --- Thông báo thành công tự tắt ---
        Swal.fire({
            icon: 'success',
            title: 'Thành công!',
            text: id ? 'Cập nhật sách thành công!' : 'Thêm sách mới thành công!',
            timer: 1500,
            showConfirmButton: false
        });
        
        // Đóng hộp thoại Modal
        if (typeof myModal !== 'undefined' && myModal) {
            myModal.hide();
        } else {
            const modalEl = document.getElementById('productModal');
            const modalInst = bootstrap.Modal.getInstance(modalEl);
            if (modalInst) modalInst.hide();
        }
        
        fetchBooks(); // Tải lại bảng sách
    } catch (error) { 
        Swal.fire('Thất bại!', error.message, 'error');
    }
};

window.editBook = async (id) => {
    try {
        await loadCategories();
        const res = await fetch(`${API_BASE_URL}/books/${id}`); 
        if (!res.ok) throw new Error("Không tìm thấy sách");
        const book = await res.json();

        document.getElementById('book-id').value = book.id;
        document.getElementById('title').value = book.title;
        document.getElementById('author').value = book.author;
        document.getElementById('category_id').value = book.category_id || ""; 
        document.getElementById('isbn').value = book.isbn || '';
        document.getElementById('year').value = book.year || '';
        document.getElementById('description').value = book.description || '';
        document.getElementById('content').value = book.content || '';
        
        document.getElementById('modal-title').textContent = 'Cập nhật sách';
        if (!myModal) myModal = new bootstrap.Modal(document.getElementById('productModal'));
        myModal.show();
    } catch (error) { alert(error.message); }
};

// ĐÃ SỬA: Hàm Khóa Sách
window.deleteBook = async (id) => {
    // Hộp thoại hỏi xác nhận rủi ro
    const result = await Swal.fire({
        title: 'Bạn có chắc chắn?',
        text: "Cuốn sách này sẽ bị ẩn khỏi trang chủ!",
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#d33',
        cancelButtonColor: '#6c757d',
        confirmButtonText: 'Vâng, ẩn nó đi!',
        cancelButtonText: 'Hủy'
    });

    if (result.isConfirmed) {
        try {
            const token = localStorage.getItem('token');
            const res = await fetch(`${API_BASE_URL}/admin/books/${id}`, {
                method: 'DELETE', // Gọi API ẩn sách
                headers: { 'Authorization': `Bearer ${token}` }
            });
            
            const data = await res.json().catch(() => ({}));
            
            if (res.ok) {
                Swal.fire('Đã ẩn!', 'Sách đã được ẩn thành công.', 'success');
                fetchBooks();
            } else {
                Swal.fire('Thất bại!', data.message || 'Lỗi khi ẩn sách', 'error');
            }
        } catch (e) { 
            Swal.fire('Lỗi Server!', 'Không thể kết nối đến máy chủ.', 'error');
        }
    }
};
// --- HÀM KHÔI PHỤC SÁCH ---
window.restoreBook = async (id) => {
    const result = await Swal.fire({
        title: 'Hiển thị lại sách?',
        text: "Sách sẽ được hiển thị lại cho mọi người cùng đọc.",
        icon: 'info',
        showCancelButton: true,
        confirmButtonColor: '#198754',
        cancelButtonColor: '#6c757d',
        confirmButtonText: 'Khôi phục',
        cancelButtonText: 'Hủy'
    });

    if (result.isConfirmed) {
        try {
            const token = localStorage.getItem('token');
            const res = await fetch(`${API_BASE_URL}/admin/books/${id}/restore`, {
                method: 'PUT',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            
            if (res.ok) {
                Swal.fire('Thành công!', 'Đã khôi phục sách.', 'success');
                fetchBooks(); 
            } else {
                const data = await res.json().catch(() => ({}));
                Swal.fire('Thất bại!', data.message || 'Lỗi khôi phục sách', 'error');
            }
        } catch (e) { 
            Swal.fire('Lỗi Server!', 'Không thể kết nối đến máy chủ.', 'error');
        }
    }
};

document.addEventListener('DOMContentLoaded', fetchBooks);