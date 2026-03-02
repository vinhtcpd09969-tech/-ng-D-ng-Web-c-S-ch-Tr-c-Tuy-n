const { db } = require('../config/db');

class Review {
    // 1. User viết đánh giá
    static async create({ userId, bookId, rating, comment }) {
        // Có thể thêm cột status = 'active' mặc định nếu cần, 
        // nhưng nếu bạn đã set DEFAULT 'active' trong MySQL thì không cần sửa dòng này.
        const sql = `INSERT INTO reviews (user_id, book_id, rating, comment, created_at) VALUES (?, ?, ?, ?, NOW())`;
        await db.execute(sql, [userId, bookId, rating, comment]);
    }

    // 2. Lấy đánh giá theo Sách (Hiển thị trang chi tiết cho User)
    static async getByBookId(bookId) {
        const sql = `
            SELECT r.*, u.name as user_name 
            FROM reviews r
            JOIN users u ON r.user_id = u.id
            WHERE r.book_id = ? AND (r.status = 'active' OR r.status IS NULL) 
            ORDER BY r.is_pinned DESC, r.created_at DESC
        `;
        // Chú ý: Thêm điều kiện (r.status = 'active' OR r.status IS NULL) 
        // để chắc chắn bài bị ẩn ('hidden') sẽ KHÔNG hiện ra ngoài trang chủ.
        const [rows] = await db.execute(sql, [bookId]);
        return rows;
    }

    // 3. [ADMIN] Lấy tất cả đánh giá (Kèm tên sách và user)
    static async getAllForAdmin() {
        const sql = `
            SELECT r.*, u.name as user_name, b.title as book_title 
            FROM reviews r
            JOIN users u ON r.user_id = u.id
            JOIN books b ON r.book_id = b.id
            ORDER BY r.created_at DESC
        `;
        // Admin không có điều kiện WHERE status, để thấy được trọn vẹn cả bài ẩn lẫn hiện.
        const [rows] = await db.execute(sql);
        return rows;
    }

    // 4. [ADMIN] Ẩn đánh giá (Thay thế cho xóa thật)
    static async hide(id) {
        const sql = "UPDATE reviews SET status = 'hidden' WHERE id = ?";
        await db.execute(sql, [id]);
    }

    // 5. [ADMIN] Khôi phục đánh giá
    static async restore(id) {
        const sql = "UPDATE reviews SET status = 'active' WHERE id = ?";
        await db.execute(sql, [id]);
    }
    // 6. [ADMIN] Ghim / Bỏ ghim đánh giá
    static async togglePin(id) {
        // Lấy trạng thái ghim hiện tại
        const [rows] = await db.execute('SELECT is_pinned FROM reviews WHERE id = ?', [id]);
        if (rows.length === 0) throw new Error('Không tìm thấy đánh giá');
        
        const currentStatus = rows[0].is_pinned;
        const newStatus = currentStatus === 1 ? 0 : 1; // Đảo ngược trạng thái
        
        await db.execute('UPDATE reviews SET is_pinned = ? WHERE id = ?', [newStatus, id]);
        return newStatus;
    }
    static async getByUserId(userId) {
    const sql = `
        SELECT r.*, b.title as book_title 
        FROM reviews r
        JOIN books b ON r.book_id = b.id
        WHERE r.user_id = ?
        ORDER BY r.created_at DESC
    `;
    const [rows] = await db.execute(sql, [userId]);
    return rows;
}
    
    
    // Lưu ý: Ở hàm getByBookId (hiển thị cho user), bạn nhớ sửa lại câu lệnh ORDER BY 
    // để bài được ghim luôn xếp lên đầu tiên nhé:
    // ORDER BY r.is_pinned DESC, r.created_at DESC
}


module.exports = Review;