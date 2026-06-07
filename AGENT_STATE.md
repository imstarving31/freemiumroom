# Agent Handover State (FreemiumRoom)

*File này dùng để lưu trữ ngữ cảnh (context) và tiến độ công việc, giúp AI Agent mới có thể tiếp tục công việc ngay lập tức khi người dùng đổi phiên làm việc hoặc tài khoản.*

## 1. Mục tiêu dự án hiện tại
Xây dựng nền tảng đăng tin phòng trọ FreemiumRoom với giao diện hiện đại (Light Mode, Lucide icons) và Backend vững chắc (Express, MongoDB).

## 2. Các công việc vừa hoàn thành (Mới nhất)
- **Sửa lỗi nền đen & Tối ưu bố cục**:
  - Dọn dẹp các rule CSS mặc định của Vite trong [index.css](file:///c:/Users/admin/Desktop/FreemiumRoom/client/src/index.css) và [App.css](file:///c:/Users/admin/Desktop/FreemiumRoom/client/src/App.css).
  - Đặt màu nền sáng (`#f8fafc`) cho body, màu chữ tối `#1f2937`.
  - Cấu hình lại `#root` chiều rộng 100% để Header & Footer trải rộng hết màn hình, giữ khung nội dung ở giữa.
- **Nâng cấp giao diện Đăng tin (`PostRoom.jsx`, `PostRoom.css`)**:
  - Thêm ô nhập **Diện tích (m²)** với hậu tố đơn vị nằm bên phải ô nhập, đặt cạnh ô Giá thuê.
  - Tích hợp thêm Section **Thông tin liên hệ** gồm: Tên người liên hệ, Số điện thoại.
  - Xây dựng hệ thống **Địa chỉ động**: Tải danh sách Tỉnh/Thành, Quận/Huyện, Phường/Xã từ API mở Việt Nam (`https://provinces.open-api.vn/api/?depth=3`). Tự động tải huyện theo tỉnh, xã theo huyện. Thêm các input Đường/Phố, Số nhà.
  - Tích hợp bản đồ **Google Maps Iframe**: Bản đồ hiển thị động địa lý tự động thay đổi trực tiếp theo địa chỉ hoàn chỉnh được chọn/nhập ở trên.
- **Cập nhật Backend (`RoomPost` Schema & Controller)**:
  - Bổ sung thêm các trường dữ liệu `area: Number`, `contactName: String`, `contactPhone: String` vào Schema MongoDB.
  - Cập nhật hàm `createPost` trong controller để lưu trữ đồng bộ dữ liệu diện tích và liên hệ khi gửi từ client.

## 3. Trạng thái dở dang / Lỗi hiện tại (Nếu có)
- Không có lỗi nghiêm trọng (Đã kiểm tra `npm run build` trên client thành công).

## 4. Các bước tiếp theo (Next Steps)
- [ ] Xây dựng tính năng Xem chi tiết phòng trọ (Room Detail Page).
- [ ] Xây dựng tính năng Đăng nhập / Đăng ký (Authentication) với JWT để thay thế các `userID` đang được mock cứng.

---
**🤖 Hướng dẫn cho AI Agent mới:**
*Khi đọc được file này, hãy phân tích mục số 4 (Các bước tiếp theo) hoặc lắng nghe yêu cầu trực tiếp từ User để tiếp tục lập trình mà không cần phải hỏi lại những gì đã làm ở mục số 2.*
