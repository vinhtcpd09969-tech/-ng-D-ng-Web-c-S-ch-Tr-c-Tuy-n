const bookModel = require('../../models/book.model');
const fs = require('fs');
const path = require('path');

exports.getList = async (req, res) => {
    try {
        const { keyword, categoryId, limit, offset } = req.query;
        // Nếu getList đang báo lỗi do hàm findWithFilter chưa đúng cấu trúc, hãy giữ nguyên code của bạn
        const books = await bookModel.findWithFilter({ keyword, categoryId, limit, offset, isAdmin: true });
        res.json({ data: books });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.create = async (req, res) => {
    try {
        const { title, author, year, isbn, description, content, category_id } = req.body;
        const image = req.file ? req.file.filename : null;

        // Hàm dọn dẹp ảnh nếu thêm sách thất bại
        const cleanupImage = () => {
            if (image) {
                const imgPath = path.join(__dirname, '../../../public/uploads', image);
                if (fs.existsSync(imgPath)) fs.unlinkSync(imgPath);
            }
        };

        if (!title || !author) {
            cleanupImage();
            return res.status(400).json({ message: 'Thiếu tên sách hoặc tác giả' });
        }
        if (!category_id) {
            cleanupImage();
            return res.status(400).json({ message: 'Vui lòng chọn danh mục' });
        }

        // [MỚI]: KIỂM TRA TRÙNG TÊN SÁCH
        const isTitleDuplicate = await bookModel.checkTitleExists(title);
        if (isTitleDuplicate) {
            cleanupImage(); // Xóa ảnh vừa up lên máy chủ
            return res.status(400).json({ message: `Tên sách "${title}" đã tồn tại trong hệ thống!` });
        }

        if (isbn) {
            const isDuplicate = await bookModel.checkDuplicateIsbn(isbn);
            if (isDuplicate) {
                cleanupImage();
                return res.status(400).json({ message: `Mã ISBN ${isbn} đã tồn tại trong hệ thống!` });
            }
        }

        const newId = await bookModel.create({ title, author, year, isbn, description, content, image, category_id });
        res.status(201).json({ message: 'Thêm sách thành công', bookId: newId });
    } catch (error) {
        res.status(500).json({ message: 'Lỗi thêm sách: ' + error.message });
    }
};

exports.update = async (req, res) => {
    try {
        const id = req.params.id;
        const { title, author, year, isbn, description, content, category_id } = req.body;
        
        const oldBook = await bookModel.getById(id);
        
        // Hàm dọn dẹp ảnh mới nếu cập nhật thất bại
        const cleanupNewImage = () => {
            if (req.file) {
                const imgPath = path.join(__dirname, '../../../public/uploads', req.file.filename);
                if (fs.existsSync(imgPath)) fs.unlinkSync(imgPath);
            }
        };

        if (!oldBook) {
            cleanupNewImage();
            return res.status(404).json({ message: 'Sách không tồn tại' });
        }

        // [MỚI]: KIỂM TRA TRÙNG TÊN SÁCH (Bỏ qua ID của chính sách này)
        const isTitleDuplicate = await bookModel.checkTitleExists(title, id);
        if (isTitleDuplicate) {
            cleanupNewImage(); // Xóa ảnh mới vừa up
            return res.status(400).json({ message: `Tên sách "${title}" đã bị trùng với một cuốn sách khác!` });
        }

        if (isbn) {
            const isDuplicate = await bookModel.checkDuplicateIsbn(isbn, id);
            if (isDuplicate) {
                cleanupNewImage();
                return res.status(400).json({ message: `Mã ISBN ${isbn} đã được sử dụng cho cuốn sách khác!` });
            }
        }

        let image = oldBook.image;
        if (req.file) {
            image = req.file.filename;
            if (oldBook.image) {
                const oldPath = path.join(__dirname, '../../../public/uploads', oldBook.image);
                if (fs.existsSync(oldPath)) {
                    try { fs.unlinkSync(oldPath); } catch(e) {}
                }
            }
        }

        await bookModel.update(id, { title, author, year, isbn, description, content, image, category_id });
        res.json({ message: 'Cập nhật thành công' });
    } catch (error) {
        res.status(500).json({ message: 'Lỗi cập nhật: ' + error.message });
    }
};

exports.delete = async (req, res) => {
    try {
        const id = req.params.id;
        await bookModel.delete(id);
        res.json({ message: 'Đã ẩn sách thành công' }); // Đã đổi chữ "khóa" thành "ẩn" cho đồng bộ giao diện
    } catch (error) {
        res.status(500).json({ message: 'Lỗi ẩn sách: ' + error.message });
    }
};

exports.restore = async (req, res) => {
    try {
        await bookModel.restore(req.params.id);
        res.json({ message: 'Đã hiện sách thành công' }); // Đã đổi chữ "khôi phục" thành "hiện" cho đồng bộ giao diện
    } catch (error) {
        res.status(500).json({ message: 'Lỗi hiện sách: ' + error.message });
    }
};