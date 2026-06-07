const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const CategorySchema = new Schema({
  categoryName: {
    type: String,
    required: [true, 'Tên danh mục là bắt buộc'],
    unique: true,
    trim: true
  },
  categoryType: {
    type: String,
    required: [true, 'Loại danh mục là bắt buộc'],
    enum: ['Loại phòng', 'Tiện ích'],
    default: 'Loại phòng'
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Category', CategorySchema);
