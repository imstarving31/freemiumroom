const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const ChatSessionSchema = new Schema(
  {
    userID: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: false,
      default: null
    },
    userMessage: {
      type: String,
      required: [true, 'Tin nhắn của người dùng là bắt buộc']
    },
    botReply: {
      type: String,
      required: [true, 'Câu trả lời của bot là bắt buộc']
    }
  },
  {
    timestamps: true
  }
);

module.exports = mongoose.model('ChatSession', ChatSessionSchema);
