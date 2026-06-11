const Transaction = require('../models/Transaction');
const User = require('../models/User');
const moment = require('moment');
const crypto = require('crypto');
const qs = require('qs');

exports.createPaymentUrl = async (req, res) => {
  try {
    const amount = Number(req.body.amount);
    const userId = req.user.id;

    if (!amount || amount <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Số tiền thanh toán không hợp lệ'
      });
    }

    // 1. Create a new transaction in DB
    const transaction = new Transaction({
      userId,
      amount,
      transactionType: 'Deposit',
      status: 'Pending'
    });
    const savedTransaction = await transaction.save();
    const orderId = savedTransaction._id.toString();

    // 2. Build VNPAY Parameters
    process.env.TZ = 'Asia/Ho_Chi_Minh';
    const date = new Date();
    const createDate = moment(date).format('YYYYMMDDHHmmss');

    let ipAddr = req.headers['x-forwarded-for'] ||
      req.ip ||
      req.connection?.remoteAddress ||
      req.socket?.remoteAddress ||
      req.connection?.socket?.remoteAddress ||
      '127.0.0.1';

    if (ipAddr.includes(':')) {
      if (ipAddr.startsWith('::ffff:')) {
        ipAddr = ipAddr.substring(7);
      } else {
        ipAddr = '127.0.0.1';
      }
    }
    if (ipAddr.includes(',')) {
      ipAddr = ipAddr.split(',')[0].trim();
    }

    const tmnCode = process.env.VNP_TMNCODE.trim();
    const secretKey = process.env.VNP_HASHSECRET.trim();
    let vnpUrl = process.env.VNP_URL;
    const returnUrl = process.env.VNP_RETURNURL;

    const locale = req.body.language || 'vn';
    const currCode = 'VND';

    let vnp_Params = {};
    vnp_Params['vnp_Version'] = '2.1.0';
    vnp_Params['vnp_Command'] = 'pay';
    vnp_Params['vnp_TmnCode'] = tmnCode;
    vnp_Params['vnp_Locale'] = locale;
    vnp_Params['vnp_CurrCode'] = currCode;
    vnp_Params['vnp_TxnRef'] = orderId;
    vnp_Params['vnp_OrderInfo'] = 'Thanh toan ma GD ' + orderId;
    vnp_Params['vnp_OrderType'] = 'other';
    vnp_Params['vnp_Amount'] = amount * 100;
    vnp_Params['vnp_ReturnUrl'] = returnUrl;
    vnp_Params['vnp_IpAddr'] = ipAddr;
    vnp_Params['vnp_CreateDate'] = createDate;

    const bankCode = req.body.bankCode;
    if (bankCode) {
      vnp_Params['vnp_BankCode'] = bankCode;
    }

    // Sort parameters
    vnp_Params = sortObject(vnp_Params);

    // Generate secure hash signature
    const signData = qs.stringify(vnp_Params, { encode: false });
    console.log('--- VNPAY raw signData string ---');
    console.log(signData);
    console.log('---------------------------------');
    const hmac = crypto.createHmac("sha512", secretKey);
    const signed = hmac.update(Buffer.from(signData, 'utf-8')).digest("hex");
    vnp_Params['vnp_SecureHash'] = signed;
    console.log('--- VNPAY Secure Hash ---');
    console.log(signed);
    console.log('-------------------------');
    const queryStr = qs.stringify(vnp_Params, { encode: false });
    vnpUrl += '?' + queryStr;

    return res.status(200).json({
      success: true,
      paymentUrl: vnpUrl
    });
  } catch (error) {
    console.error('Error creating VNPAY payment url:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Đã xảy ra lỗi khi tạo URL thanh toán'
    });
  }
};

exports.vnpayReturn = async (req, res) => {
  try {
    let vnp_Params = { ...req.query };
    const secureHash = vnp_Params['vnp_SecureHash'];

    delete vnp_Params['vnp_SecureHash'];
    delete vnp_Params['vnp_SecureHashType'];

    vnp_Params = sortObject(vnp_Params);

    const secretKey = process.env.VNP_HASHSECRET;
    const signData = qs.stringify(vnp_Params, { encode: false });
    const hmac = crypto.createHmac("sha512", secretKey);
    const signed = hmac.update(Buffer.from(signData, 'utf-8')).digest("hex");

    if (secureHash === signed) {
      const orderId = vnp_Params['vnp_TxnRef'];
      const responseCode = vnp_Params['vnp_ResponseCode'];

      // Find transaction
      const transaction = await Transaction.findById(orderId);
      if (!transaction) {
        console.error(`Transaction not found for ID: ${orderId}`);
        return res.redirect('http://localhost:5173/wallet?status=invalid');
      }

      if (responseCode === '00') {
        // Cập nhật trạng thái nếu vẫn đang Pending (để hỗ trợ môi trường localhost/dev không nhận được IPN)
        if (transaction.status === 'Pending') {
          transaction.status = 'Success';
          await transaction.save();

          // Cộng tiền vào ví User
          await User.findByIdAndUpdate(
            transaction.userId,
            { $inc: { balance: transaction.amount } }
          );

          // Phát tín hiệu thông báo cho Admin qua Socket.io
          const io = req.app.get('socketio');
          if (io) {
            const user = await User.findById(transaction.userId);
            const userName = user ? user.fullName : 'Thành viên';
            const formattedAmount = transaction.amount.toLocaleString('vi-VN');
            io.emit('admin_notification', {
              type: 'PAYMENT',
              message: `User ${userName} vừa nạp thành công ${formattedAmount} đ.`,
              countType: 'newTransactions'
            });
          }
        }
        return res.redirect('http://localhost:5173/wallet?status=success');
      } else {
        if (transaction.status === 'Pending') {
          transaction.status = 'Failed';
          await transaction.save();
        }
        return res.redirect('http://localhost:5173/wallet?status=failed');
      }
    } else {
      console.error('Checksum verification failed');
      return res.redirect('http://localhost:5173/wallet?status=invalid');
    }
  } catch (error) {
    console.error('Error in VNPAY return handler:', error);
    return res.redirect('http://localhost:5173/wallet?status=failed');
  }
};

exports.vnpayIpn = async (req, res) => {
  try {
    let vnp_Params = { ...req.query };
    const secureHash = vnp_Params['vnp_SecureHash'];

    delete vnp_Params['vnp_SecureHash'];
    delete vnp_Params['vnp_SecureHashType'];

    vnp_Params = sortObject(vnp_Params);

    const secretKey = process.env.VNP_HASHSECRET;
    const signData = qs.stringify(vnp_Params, { encode: false });
    const hmac = crypto.createHmac("sha512", secretKey);
    const signed = hmac.update(Buffer.from(signData, 'utf-8')).digest("hex");

    if (secureHash === signed) {
      const orderId = vnp_Params['vnp_TxnRef'];
      const responseCode = vnp_Params['vnp_ResponseCode'];

      // Find transaction
      const transaction = await Transaction.findById(orderId);
      if (!transaction) {
        return res.status(200).json({ RspCode: '01', Message: 'Order not found' });
      }

      // Kiểm tra nếu giao dịch đã xử lý (status === 'Success')
      if (transaction.status === 'Success') {
        return res.status(200).json({ RspCode: '02', Message: 'Order already confirmed' });
      }

      if (responseCode === '00') {
        // Cập nhật status thành 'Success'
        transaction.status = 'Success';
        await transaction.save();

        // Cộng tiền vào ví User
        await User.findByIdAndUpdate(
          transaction.userId,
          { $inc: { balance: transaction.amount } }
        );

        // Phát tín hiệu thông báo cho Admin qua Socket.io
        const io = req.app.get('socketio');
        if (io) {
          const user = await User.findById(transaction.userId);
          const userName = user ? user.fullName : 'Thành viên';
          const formattedAmount = transaction.amount.toLocaleString('vi-VN');
          io.emit('admin_notification', {
            type: 'PAYMENT',
            message: `User ${userName} vừa nạp thành công ${formattedAmount} đ.`,
            countType: 'newTransactions'
          });
        }

        return res.status(200).json({ RspCode: '00', Message: 'Confirm Success' });
      } else {
        // Cập nhật status thành 'Failed'
        transaction.status = 'Failed';
        await transaction.save();

        return res.status(200).json({ RspCode: '00', Message: 'Confirm Success' });
      }
    } else {
      return res.status(200).json({ RspCode: '97', Message: 'Invalid signature' });
    }
  } catch (error) {
    console.error('Error in VNPAY IPN handler:', error);
    return res.status(200).json({ RspCode: '99', Message: 'Input data invalid' });
  }
};

exports.queryTransactionStatus = async (req, res) => {
  try {
    const { transactionId } = req.body;
    if (!transactionId) {
      return res.status(400).json({
        success: false,
        message: 'Vui lòng cung cấp mã giao dịch cần đối soát.'
      });
    }

    const transaction = await Transaction.findById(transactionId);
    if (!transaction) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy giao dịch này trên hệ thống.'
      });
    }

    const tmnCode = process.env.VNP_TMNCODE;
    const secretKey = process.env.VNP_HASHSECRET;
    const vnpApiUrl = 'https://sandbox.vnpayment.vn/merchant_webapi/api/transaction';

    const date = new Date();
    const vnp_CreateDate = moment(date).format('YYYYMMDDHHmmss');
    const vnp_RequestId = moment(date).format('HHmmss') + Math.floor(Math.random() * 1000).toString();

    // Format transaction date (createdAt in DB)
    const vnp_TransactionDate = moment(transaction.createdAt).format('YYYYMMDDHHmmss');

    let vnp_IpAddr = req.headers['x-forwarded-for'] ||
      req.ip ||
      req.connection?.remoteAddress ||
      '127.0.0.1';

    if (vnp_IpAddr.includes(':')) {
      if (vnp_IpAddr.startsWith('::ffff:')) {
        vnp_IpAddr = vnp_IpAddr.substring(7);
      } else {
        vnp_IpAddr = '127.0.0.1';
      }
    }
    if (vnp_IpAddr.includes(',')) {
      vnp_IpAddr = vnp_IpAddr.split(',')[0].trim();
    }

    const vnp_Params = {
      vnp_RequestId,
      vnp_Version: '2.1.0',
      vnp_Command: 'querydr',
      vnp_TmnCode: tmnCode,
      vnp_TxnRef: transaction._id.toString(),
      vnp_OrderInfo: 'Doi soat giao dich ' + transaction._id.toString(),
      vnp_TransactionDate,
      vnp_CreateDate,
      vnp_IpAddr
    };

    // Hash secure signature raw string:
    // vnp_RequestId|vnp_Version|vnp_Command|vnp_TmnCode|vnp_TxnRef|vnp_TransactionDate|vnp_CreateDate|vnp_IpAddr|vnp_OrderInfo
    const hashData = `${vnp_Params.vnp_RequestId}|${vnp_Params.vnp_Version}|${vnp_Params.vnp_Command}|${vnp_Params.vnp_TmnCode}|${vnp_Params.vnp_TxnRef}|${vnp_Params.vnp_TransactionDate}|${vnp_Params.vnp_CreateDate}|${vnp_Params.vnp_IpAddr}|${vnp_Params.vnp_OrderInfo}`;

    const hmac = crypto.createHmac("sha512", secretKey);
    const signed = hmac.update(Buffer.from(hashData, 'utf-8')).digest("hex");
    vnp_Params['vnp_SecureHash'] = signed;

    // Send request to VNPay API
    const response = await fetch(vnpApiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(vnp_Params)
    });

    const result = await response.json();

    return res.status(200).json({
      success: true,
      data: result
    });
  } catch (error) {
    console.error('Error in queryTransactionStatus controller:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Đã xảy ra lỗi khi truy vấn trạng thái giao dịch VNPay.'
    });
  }
};

exports.updateTransactionStatus = async (req, res) => {
  try {
    const { transactionId } = req.body;
    if (!transactionId) {
      return res.status(400).json({
        success: false,
        message: 'Vui lòng cung cấp mã giao dịch.'
      });
    }

    const transaction = await Transaction.findById(transactionId);
    if (!transaction) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy giao dịch này trên hệ thống.'
      });
    }

    // Nếu giao dịch đã thành công rồi thì không xử lý trùng
    if (transaction.status === 'Success') {
      return res.status(200).json({
        success: true,
        message: 'Giao dịch đã được cập nhật thành công trước đó.'
      });
    }

    // Cập nhật trạng thái thành Success
    transaction.status = 'Success';
    await transaction.save();

    // Cộng tiền vào ví User
    await User.findByIdAndUpdate(
      transaction.userId,
      { $inc: { balance: transaction.amount } }
    );

    // Phát tín hiệu thông báo cho Admin qua Socket.io
    const io = req.app.get('socketio');
    if (io) {
      const user = await User.findById(transaction.userId);
      const userName = user ? user.fullName : 'Thành viên';
      const formattedAmount = transaction.amount.toLocaleString('vi-VN');
      io.emit('admin_notification', {
        type: 'PAYMENT',
        message: `User ${userName} vừa nạp thành công ${formattedAmount} đ.`,
        countType: 'newTransactions'
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Cập nhật trạng thái giao dịch sang Success thành công và đã cộng tiền vào ví người dùng.'
    });
  } catch (error) {
    console.error('Error in updateTransactionStatus controller:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Đã xảy ra lỗi khi cập nhật trạng thái giao dịch.'
    });
  }
};

exports.getTransactionHistory = async (req, res) => {
  try {
    const userId = req.user.id;
    const transactions = await Transaction.find({ userId }).sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      data: transactions
    });
  } catch (error) {
    console.error('Error in getTransactionHistory:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Đã xảy ra lỗi khi lấy lịch sử giao dịch'
    });
  }
};

function sortObject(obj) {
  const sorted = {};
  const keys = Object.keys(obj).sort();
  for (const key of keys) {
    const value = obj[key];
    if (value !== undefined && value !== null) {
      sorted[encodeURIComponent(key)] = encodeURIComponent(value).replace(/%20/g, "+");
    }
  }
  return sorted;
}
