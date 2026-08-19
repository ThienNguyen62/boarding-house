# Phase 11 — Tìm kiếm quanh bạn / bán kính

## Thay đổi
- Bổ sung bộ lọc nhanh **Tìm kiếm quanh bạn** trên trang chủ, trang người dùng và bản đồ.
- Hộp thoại cho phép chọn 1 trong 3 địa điểm cố định:
  - Đại học Bách khoa Hà Nội
  - Đại học Kinh tế Quốc dân
  - Đại học Xây dựng Hà Nội
- Bán kính cố định: 500m, 1km, 2km, 3km, 5km.
- Bộ lọc bán kính kết hợp theo **AND** với toàn bộ điều kiện lọc hiện có.
- Backend tính khoảng cách bằng Haversine từ tọa độ địa điểm cố định tới tọa độ từng phòng.
- Bản đồ hiển thị 3 marker địa điểm cố định bằng icon khác biệt; khi chọn một địa điểm, hiển thị thêm vòng tròn bán kính và tập trung bản đồ vào tâm tìm kiếm.
- Danh sách phòng, marker và bộ lọc trang chủ/bản đồ dùng chung các tham số `searchPlace` và `radiusKm`.
- Có thêm `distance_km` trong API kết quả khi lọc theo bán kính để phục vụ UI về sau.

## Dữ liệu cố định
- Tọa độ 3 địa điểm nằm trong `backend/data/config/filter_options.json`.
- Đây là dữ liệu MVP cố định, không cần geocoding hay nhập địa chỉ tự do.

## Kiểm tra
- 70 phòng, 70 ID duy nhất.
- 5 chủ trọ giữ nguyên.
- 3 địa điểm cố định, 5 mức bán kính.
- Python/JavaScript kiểm tra cú pháp: OK.
- 13 file trong `Docs/` không thay đổi.
