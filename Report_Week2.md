# Weekly Task Report — Week 2

## 1. Completed Tasks

| #   | Feature / Task             | Description                                                                                |
| --- | -------------------------- | ------------------------------------------------------------------------------------------ |
| 1   | Đăng ký (Register)         | Xây dựng API `/auth/register` — lưu thông tin người dùng mới, mã hóa mật khẩu bằng bcrypt. |
| 2   | Đăng nhập (Login)          | API `/auth/login` với xác thực username/password và trả về accessToken, refreshToken.      |
| 3   | JWT Authentication         | Tích hợp xác thực bằng JWT, lưu token trong cookie/httpOnly để đảm bảo bảo mật.            |
| 4   | Auth Middleware            | Middleware `protectedRoute` kiểm tra và xác thực token trước khi truy cập API.             |
| 5   | Refresh Token Flow         | Hoàn thiện cơ chế tự động refresh token khi access token hết hạn.                          |
| 6   | User Profile API           | API `/users/me` cho phép lấy và cập nhật thông tin người dùng hiện tại.                    |
| 7   | Upload Avatar (Cloudinary) | Upload avatar với `multer.memoryStorage` và tích hợp Cloudinary.                           |

---

## 2. Issues & Improvements

| #   | Issue / Task                             | Description / Action Taken                                                                            |
| --- | ---------------------------------------- | ----------------------------------------------------------------------------------------------------- |
| 1   | Xử lý redirect login                     | Nếu người dùng đã đăng nhập, redirect tự động về Dashboard; ngăn truy cập lại trang `/login`.         |
| 2   | Tối ưu MongoDB (xóa findOne, đánh index) | Loại bỏ `findOne` không cần thiết; thêm index cho các trường quan trọng (username) để tăng hiệu năng. |
| 3   | Cải thiện truy xuất req.body             | Truy xuất trực tiếp từ `req.body.fieldName`.                                                          |
| 4   | Thêm helper xử lý lỗi MongoDB            | Xây dựng `mongoErrorHandler` giúp log rõ ràng, hiển thị thông báo khi gặp lỗi database.               |
| 5   | Áp dụng Zod validation ở backend         | Validate toàn bộ request backend bằng Zod schema để đảm bảo dữ liệu hợp lệ.                           |
| 6   | Chuẩn hóa format code (Prettier)         | Cấu hình Prettier để thống nhất style code toàn dự án.                                                |
| 7   | Cấu trúc Configs rõ ràng hơn             | Parse toàn bộ `process.env` vào object config để dễ sử dụng và quản lý.                               |
| 8   | Thêm .env cho frontend                   | Bổ sung file `.env` cho frontend chứa các biến như `VITE_API_URL`, `VITE_APP_NAME`, ...               |

---

## 3. Weekly Targets

| Tuần                  | Mục tiêu                                         | Chi tiết                                                                                                                                                                                                                                                                                    |
| --------------------- | ------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Tuần 2 (Hiện tại)** | Phát triển module **Board** (Backend + Frontend) | - Hoàn thiện **Board CRUD API** (`/boards`): Create, Read, Update, Delete.<br>- Xây dựng **Board Controller** chuẩn hóa luồng xử lý logic giữa các layer.<br>- Kết nối **MongoDB Atlas** với cấu trúc model (Board, User, Workspace).                                                       |
|                       | Tích hợp Board với Frontend                      | - Tích hợp **Board API** với frontend thông qua Axios và Zustand store.<br>- Hiển thị danh sách board theo workspace trên **Dashboard**.<br>- Cho phép **thêm/sửa/xóa board trực tiếp từ UI**.<br>- Xử lý **loading state** và hiển thị thông báo (toast) khi thao tác thành công/thất bại. |
|                       | Cải thiện giao diện & cấu trúc hệ thống          | - Thiết kế bố cục **Dashboard** dạng lưới (grid).<br>- Tối ưu cấu trúc thư mục frontend (`pages`, `components`, `stores`, `services`).<br>- Thiết lập **Prettier** để đồng bộ style code.<br>- Chuẩn hóa file **.env** cho frontend và backend.                                             |

---

## 4. Remarks

- Tuần trước đã hoàn thiện toàn bộ phần **xác thực (Auth, JWT, Refresh Token)**.
- Tuần này tập trung phát triển **module Board** đầy đủ ở cả **backend và frontend**.
- Sau khi hoàn thành, hệ thống sẵn sàng để mở rộng sang **List** và **Card**.
