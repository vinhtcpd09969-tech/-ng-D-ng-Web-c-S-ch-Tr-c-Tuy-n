const express = require('express');
const router = express.Router();
const controller = require('../../controllers/client/client.review.controller');
const auth = require('../../middlewares/auth');

// Public: Xem đánh giá của sách
router.get('/books/:bookId/reviews', controller.getByBook);

// Private: Viết đánh giá (Cần login)
router.post('/books/:bookId/review', auth, controller.addReview);

// Private: Xem danh sách đánh giá của chính mình (Profile)
router.get('/user/reviews', auth, controller.getMyReviews);

module.exports = router;