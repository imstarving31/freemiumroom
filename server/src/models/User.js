const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const UserSchema = new Schema({
  fullName: {
    type: String,
    required: [true, 'Họ và tên là bắt buộc']
  },
  email: {
    type: String,
    required: [true, 'Email là bắt buộc'],
    unique: true,
    trim: true,
    lowercase: true
  },
  phoneNumber: {
    type: String,
    required: [true, 'Số điện thoại là bắt buộc']
  },
  password: {
    type: String,
    required: [true, 'Mật khẩu là bắt buộc']
  },
  avatar: {
    type: String,
    default: 'https://cdn-icons-png.flaticon.com/512/149/149071.png'
  },
  role: {
    type: String,
    default: 'User'
  },
  status: {
    type: String,
    default: 'Hoạt động'
  },
  isBlocked: {
    type: Boolean,
    default: false
  },
  balance: {
    type: Number,
    default: 0
  },
  favoritePosts: [{
    type: Schema.Types.ObjectId,
    ref: 'RoomPost',
    default: []
  }],
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('User', UserSchema);
