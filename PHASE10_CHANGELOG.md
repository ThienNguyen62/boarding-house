# TrọSmart — Phase 10

## 1. Bộ lọc compact + AND
- Thay bộ lọc dài trên trang chủ và bản đồ bằng một hàng compact: `Lọc`, `Tin xác thực`, `Khu vực`, `Phường/khu vực`, `Khoảng giá`, `Đặt lại`.
- `Lọc` mở modal chi tiết gồm các điều kiện còn lại: loại phòng, diện tích, nội thất, đối tượng, tiện ích, WC riêng, ban công, chỗ để xe, khoảng giá chi tiết và sắp xếp.
- Các tiêu chí gửi lên API được áp dụng đồng thời (AND). Backend đã lọc tuần tự theo từng điều kiện; Phase 10 giữ nguyên và chuẩn hóa luồng UI.
- Cả trang chủ và bản đồ dùng cùng một trạng thái bộ lọc.

## 2. Thông báo
- Navbar hiển thị chữ `Thông báo` và icon chuông.
- Click mở menu thông báo tại chỗ, đánh dấu đã đọc và không chuyển sang Dashboard.

## 3. Tài khoản chủ trọ demo
- Đồng bộ tài khoản landlord theo toàn bộ 5 hồ sơ chủ trọ trong `landlords.json`.
- Email dạng `tenkhongdau@tro.vn`.
- Mật khẩu demo: `123456`.
- `landlords.json` được liên kết `user_id` nhất quán.

## 4. Docs
- Không sửa các file trong thư mục `Docs/`.
