# Simple Banking App - Frontend

Frontend cho ứng dụng ngân hàng đơn giản, được xây dựng bằng React, Vite, và Tailwind CSS.

## Mục lục

- [Tính năng](#tính-năng)
- [Công nghệ sử dụng](#công-nghệ-sử-dụng)
- [Yêu cầu cài đặt](#yêu-cầu-cài-đặt)
- [Hướng dẫn cài đặt](#hướng-dẫn-cài-đặt)
  - [1. Cài đặt thủ công (Local)](#1-cài-đặt-thủ-công-local)
  - [2. Cài đặt bằng Docker](#2-cài-đặt-bằng-docker)
- [Cấu hình môi trường (.env)](#cấu-hình-môi-trường-env)
- [Chạy ứng dụng](#chạy-ứng-dụng)

## Tính năng

- Giao diện đăng ký, đăng nhập, quên mật khẩu.
- Bảng điều khiển chính hiển thị thông tin tài khoản, số dư.
- Form chuyển tiền với chức năng tìm kiếm người nhận.
- Hiển thị lịch sử giao dịch.
- Nhận thông báo real-time về biến động số dư.
- Giao diện responsive cho cả desktop và mobile.

## Công nghệ sử dụng

- **Framework**: [React](https://react.dev/)
- **Build Tool**: [Vite](https://vitejs.dev/)
- **Ngôn ngữ**: TypeScript
- **Styling**: [Tailwind CSS](https://tailwindcss.com/)
- **State Management**: [Zustand](https://zustand-demo.pmnd.rs/) (hoặc Context API)
- **Data Fetching**: [Axios](https://axios-http.com/)
- **Real-time**: [Socket.IO Client](https://socket.io/docs/v4/client-api/)
- **Routing**: [React Router DOM](https://reactrouter.com/)

## Yêu cầu cài đặt

- Node.js (v18.x trở lên)
- Yarn hoặc npm
- Docker và Docker Compose (nếu chạy bằng Docker)

---

+## Hướng dẫn cài đặt

+### 1. Cài đặt thủ công (Local)

+**Bước 1: Clone repository**

+```bash
git clone <your-repository-url>
cd simple-banking-web

````

+**Bước 2: Cài đặt dependencies**

+```bash
npm install
````

+**Bước 3: Cấu hình biến môi trường**

+Tạo một file `.env` ở thư mục gốc của project từ file `.env.example` và cấu hình `VITE_API_URL` trỏ đến backend của bạn (ví dụ: `http://localhost:3000`).

+```bash
cp .env.example .env

````

+**Bước 4: Khởi chạy ứng dụng**

+```bash
npm run dev
````

+Ứng dụng sẽ chạy tại `http://localhost:3001` (hoặc một cổng khác nếu 3001 đã được sử dụng).

+### 2. Cài đặt bằng Docker

+Phương pháp này sẽ tự động dựng và chạy cả **frontend, backend và database** trong các container riêng biệt.

+**Lưu ý:** Lệnh này được chạy từ thư mục `simple-banking-app-backend`.

+**Bước 1: Clone repository** (Nếu chưa có)

+**Bước 2: Cấu hình biến môi trường**

- **Backend**: Đi đến thư mục `simple-banking-app-backend`, tạo file `.env` và cấu hình (đặc biệt `DB_HOST=db` và `VITE_API_URL=http://localhost:3000`).
- **Frontend**: Đi đến thư mục `simple-banking-web`, tạo file `.env` và cấu hình `VITE_API_URL=http://localhost:3000`.

+**Bước 3: Khởi chạy với Docker Compose**

+Từ thư mục `simple-banking-app-backend`, chạy lệnh:

+```bash
docker-compose up --build

````

+Lệnh này sẽ build Docker image cho cả frontend và backend, sau đó khởi chạy toàn bộ hệ thống.
- Frontend sẽ có thể truy cập tại `http://localhost:3001`.
- Backend sẽ có thể truy cập tại `http://localhost:3000`.

+Để dừng các container:

+```bash
docker-compose down
````

+---

+## Cấu hình môi trường (.env)

+Tạo file `.env` ở thư mục gốc của frontend và điền giá trị.

+```env

# URL của backend API.

# Khi chạy local, nó là http://localhost:3000.

# Khi chạy với Docker, nó cũng là http://localhost:3000 vì bạn truy cập từ trình duyệt của máy host.

VITE_API_URL=http://localhost:3000

````

+---

+## Chạy ứng dụng

+```bash
# Development mode (với hot-reload)
npm run dev

# Build for production
npm run build

# Preview the production build locally
npm run preview
````
