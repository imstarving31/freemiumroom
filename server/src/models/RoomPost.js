const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const RoomPostSchema = new Schema({
  userID: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  categoryID: {
    type: Schema.Types.ObjectId,
    ref: 'Category',
    default: null
  },
  categoryId: {
    type: Schema.Types.ObjectId,
    ref: 'Category',
    default: null
  },
  title: {
    type: String,
    required: [true, 'Tiêu đề là bắt buộc']
  },
  address: {
    type: String,
    required: [true, 'Địa chỉ là bắt buộc']
  },
  price: {
    type: Number,
    required: [true, 'Giá thuê là bắt buộc']
  },
  area: {
    type: Number,
    required: [true, 'Diện tích là bắt buộc']
  },
  contactName: {
    type: String,
    required: [true, 'Tên liên hệ là bắt buộc']
  },
  contactPhone: {
    type: String,
    required: [true, 'Số điện thoại liên hệ là bắt buộc']
  },
  description: {
    type: String,
    default: ''
  },
  images: {
    type: [String],
    default: []
  },
  utilities: {
    type: [String],
    default: []
  },
  postType: {
    type: String,
    default: 'Tin thường'
  },
  status: {
    type: String,
    default: 'Chờ duyệt'
  },
  isAvailable: {
    type: Boolean,
    default: true
  },
  isHostBlocked: {
    type: Boolean,
    default: false
  },
  rejectionReason: {
    type: String,
    default: ''
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('RoomPost', RoomPostSchema);
