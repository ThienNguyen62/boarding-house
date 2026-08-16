# Tóm tắt lệnh Git cần nhớ

Giả sử bạn đang đứng trong thư mục project:

```powershell
cd "C:\Users\...\boarding-house"
```

## 1. Kiểm tra trạng thái hiện tại

```powershell
git status
```

Kiểm tra remote đã nối chưa:

```powershell
git remote -v
```

Nếu thấy:

```text
origin  https://github.com/ThienNguyen62/boarding-house.git (fetch)
origin  https://github.com/ThienNguyen62/boarding-house.git (push)
```

→ **Đã nối repository GitHub.**

---

# A. CHƯA NỐI với GitHub

### Trường hợp project chưa có Git

```powershell
git init
```

Sau đó:

```powershell
git add .
git commit -m "Initial commit"
git branch -M main
git remote add origin https://github.com/USERNAME/REPOSITORY.git
git push -u origin main
```

Luồng đầy đủ:

```text
git init
   ↓
git add .
   ↓
git commit
   ↓
git branch -M main
   ↓
git remote add origin URL
   ↓
git push -u origin main
```

---

# B. ĐÃ NỐI với GitHub

**Không chạy lại:**

```powershell
git remote add origin ...
```

Vì sẽ gặp:

```text
error: remote origin already exists.
```

Chỉ cần:

```powershell
git add .
git commit -m "Update project"
git push
```

Đây là luồng bạn sẽ dùng **phần lớn thời gian**:

```text
Sửa code
  ↓
git add .
  ↓
git commit -m "..."
  ↓
git push
```

---

# C. ĐÃ NỐI nhưng muốn kiểm tra / sửa URL

Kiểm tra:

```powershell
git remote -v
```

Đổi URL GitHub:

```powershell
git remote set-url origin https://github.com/USERNAME/REPOSITORY.git
```

Sau đó:

```powershell
git push -u origin main
```

---

# D. ĐÃ NỐI nhưng `main` chưa tồn tại

Nếu gặp:

```text
error: src refspec main does not match any
```

Thường là chưa có commit hoặc branch chưa phải `main`.

Chạy:

```powershell
git add .
git commit -m "Initial commit"
git branch -M main
git push -u origin main
```

---

# E. GitHub đã có code, máy cũng có code

Nếu GitHub có lịch sử mà máy chưa có:

```powershell
git pull origin main
```

Nếu Git báo lịch sử khác nhau:

```powershell
git pull origin main --allow-unrelated-histories
```

Sau khi xử lý conflict:

```powershell
git add .
git commit -m "Merge changes"
git push
```

---

# F. Muốn lấy code GitHub về máy

Nếu project đã được nối:

```powershell
git pull
```

Hoặc rõ ràng hơn:

```powershell
git pull origin main
```

---

# G. Muốn đẩy code máy lên GitHub

Thông thường:

```powershell
git add .
git commit -m "Update project"
git push
```

Lần đầu tiên của branch:

```powershell
git push -u origin main
```

Sau khi đã `-u`, những lần sau chỉ cần:

```powershell
git push
```

---

# H. GitHub có thay đổi, muốn cập nhật trước khi push

Nên:

```powershell
git pull origin main
git add .
git commit -m "Update project"
git push
```

Hoặc thường dùng hơn:

```powershell
git pull
git add .
git commit -m "Update project"
git push
```

---

# I. GitHub báo `non-fast-forward`

Ví dụ:

```text
! [rejected] main -> main (non-fast-forward)
```

Trước tiên:

```powershell
git pull origin main
```

Sau đó:

```powershell
git push
```

Nếu có conflict → sửa conflict →:

```powershell
git add .
git commit -m "Resolve merge conflict"
git push
```

### Nếu chắc chắn muốn lấy code trên máy ghi đè GitHub

```powershell
git push origin main --force
```

**Cẩn thận:** lệnh này có thể ghi đè lịch sử trên GitHub.

---

# J. Một số lệnh kiểm tra rất hữu ích

Xem branch:

```powershell
git branch
```

Xem branch hiện tại:

```powershell
git branch --show-current
```

Đổi sang `main`:

```powershell
git branch -M main
```

Xem lịch sử commit:

```powershell
git log --oneline
```

Xem remote:

```powershell
git remote -v
```

Xem thay đổi:

```powershell
git diff
```

---

# Bộ lệnh bạn nên nhớ

### Project CHƯA nối GitHub

```powershell
git init
git add .
git commit -m "Initial commit"
git branch -M main
git remote add origin URL_GITHUB
git push -u origin main
```

### Project ĐÃ nối GitHub

```powershell
git add .
git commit -m "Update project"
git push
```

### Kiểm tra đã nối chưa

```powershell
git remote -v
```

### Đổi repository GitHub

```powershell
git remote set-url origin URL_GITHUB
```

### GitHub có code mới

```powershell
git pull
```

### Bị `non-fast-forward`

```powershell
git pull
git push
```

### Muốn máy ghi đè GitHub

```powershell
git push origin main --force
```

**Quan trọng nhất:** phân biệt được `git remote add origin` và `git remote set-url origin`.

* **Chưa có `origin`** → `git remote add origin URL`
* **Đã có `origin`** → không `add` lại; nếu URL sai → `git remote set-url origin URL`
* **Đã nối đúng** → chỉ `git add → commit → push`
