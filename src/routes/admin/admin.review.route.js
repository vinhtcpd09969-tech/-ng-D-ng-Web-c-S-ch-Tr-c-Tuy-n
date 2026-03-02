const express = require('express');
const router = express.Router();
const controller = require('../../controllers/admin/admin.review.controller');

// 1. Lấy danh sách tất cả đánh giá (Bao gồm cả ẩn và hiện)
router.get('/', controller.getAll);

// 2. Ẩn đánh giá (Sử dụng method DELETE để khớp với code Frontend)
router.delete('/:id', controller.hide);

// 3. Khôi phục đánh giá (Sử dụng method PUT)
router.put('/:id/restore', controller.restore);

// 4. [MỚI]: Ghim / Bỏ ghim đánh giá lên Top (Sử dụng method PUT)
router.put('/:id/pin', controller.togglePin);

module.exports = router;