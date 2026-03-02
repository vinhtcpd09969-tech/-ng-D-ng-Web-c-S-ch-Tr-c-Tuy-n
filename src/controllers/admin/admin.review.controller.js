const Review = require('../../models/review.model');

// [ADMIN] Xem tất cả review
exports.getAll = async (req, res) => {
    try {
        const reviews = await Review.getAllForAdmin();
        res.json(reviews);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// [ADMIN] Ẩn review (Thay thế cho xóa thật)
exports.hide = async (req, res) => {
    try {
        await Review.hide(req.params.id); // Gọi hàm hide bên Model
        res.json({ message: 'Đã ẩn đánh giá thành công' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// [ADMIN] Khôi phục review
exports.restore = async (req, res) => {
    try {
        await Review.restore(req.params.id); // Gọi hàm restore bên Model
        res.json({ message: 'Đã khôi phục đánh giá thành công' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
// [ADMIN] Ghim / Bỏ ghim đánh giá
exports.togglePin = async (req, res) => {
    try {
        const newStatus = await Review.togglePin(req.params.id);
        res.json({ message: newStatus === 1 ? 'Đã ghim đánh giá' : 'Đã bỏ ghim' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
