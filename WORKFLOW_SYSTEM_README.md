# 🎯 Hệ thống Order Workflow Management - XOXO

## 📋 Tổng quan

Hệ thống quản lý quy trình sản xuất realtime sử dụng **Firebase Realtime
Database** theo đúng spec trong `ORDER_FLOW.md`.

### ✨ Tính năng chính

- ✅ **Multi-product per order**: Mỗi đơn hàng chứa nhiều sản phẩm
- ✅ **Multi-workflow steps per product**: Mỗi sản phẩm có nhiều công đoạn
- ✅ **Multi-employee assignment**: Nhiều nhân viên trên mỗi công đoạn
- ✅ **Realtime sync**: Tất cả thay đổi được đồng bộ tức thì
- ✅ **Progress tracking**: Theo dõi tiến độ (completedQuantity, status)
- ✅ **Kanban board**: Visualize workflow với 3 trạng thái (pending,
  in_progress, completed)

---

## 🏗️ Cấu trúc dự án

```
src/
├── types/
│   └── workflow.ts                    # TypeScript types cho toàn bộ schema
├── firebase/
│   └── hooks/
│       └── useRealtime.tsx           # Hooks cho Realtime Database
├── services/
│   └── workflowService.ts            # CRUD operations
├── components/
│   ├── WorkflowTemplateManager.tsx   # Quản lý workflow templates
│   ├── EmployeeManager.tsx           # Quản lý nhân viên
│   ├── CreateOrderModal.tsx          # Tạo đơn hàng mới
│   └── WorkflowKanban.tsx            # Kanban board tracking
└── app/(root)/
    └── workflow-management/
        └── page.tsx                   # Main page tích hợp tất cả
```

---

## 🚀 Cài đặt & Chạy

### 1. Cấu hình Firebase

Thêm vào file `.env.local`:

```bash
NEXT_PUBLIC_FIREBASE_API_KEY=your-api-key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your-auth-domain
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your-project-id
NEXT_PUBLIC_FIREBASE_APP_ID=your-app-id
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your-sender-id
NEXT_PUBLIC_FIREBASE_DATABASE_URL=https://your-project.firebaseio.com  # ⚠️ QUAN TRỌNG
```

### 2. Enable Firebase Realtime Database

1. Vào [Firebase Console](https://console.firebase.google.com)
2. Chọn project của bạn
3. Sidebar -> **Realtime Database** -> **Create Database**
4. Chọn region (US Central hoặc gần bạn nhất)
5. Chọn mode: **Start in test mode** (để test, sau đổi sang production)

### 3. Cấu hình Security Rules (Quan trọng!)

Vào **Rules** tab trong Realtime Database và paste:

```json
{
  "rules": {
    ".read": "auth != null",
    ".write": "auth != null",
    "workflows": {
      ".indexOn": ["createdAt", "order"]
    },
    "employees": {
      ".indexOn": ["role", "createdAt"]
    },
    "orders": {
      ".indexOn": ["createdAt", "status", "createdBy"]
    }
  }
}
```

### 4. Chạy ứng dụng

```bash
npm run dev
```

Truy cập: **http://localhost:3000/workflow-management**

---

## 📖 Hướng dẫn sử dụng

### Bước 1: Tạo công đoạn (Workflows)

1. Vào tab **"Công đoạn"**
2. Click **"Thêm công đoạn"**
3. Nhập thông tin:
   - Tên công đoạn (VD: Cắt vải, May, Đóng gói)
   - Thứ tự (0, 1, 2...)
   - Nhân viên mặc định (optional)
4. Click **"Tạo mới"**

⚠️ **Lưu ý**: Phải có ít nhất 1 công đoạn trước khi tạo đơn hàng.

### Bước 2: Thêm nhân viên

1. Vào tab **"Nhân viên"**
2. Click **"Thêm nhân viên"**
3. Nhập thông tin:
   - Tên nhân viên
   - Vai trò (worker, sale, manager, admin)
4. Click **"Tạo mới"**

### Bước 3: Tạo đơn hàng

1. Click nút **"Tạo đơn hàng mới"** (góc trên bên phải)
2. Điền thông tin khách hàng:
   - Tên khách hàng
   - Số điện thoại
   - Địa chỉ (optional)
   - Ghi chú (optional)
3. Thêm sản phẩm:
   - Click **"Thêm sản phẩm"**
   - Nhập tên, số lượng, đơn giá
   - Có thể thêm nhiều sản phẩm
4. Review workflow steps sẽ được clone tự động
5. Click **"Tạo đơn hàng"**

### Bước 4: Theo dõi tiến độ (Kanban)

1. Vào tab **"Bảng Kanban"**
2. Xem các workflow steps được chia thành 3 cột:
   - **Chờ xử lý** (pending)
   - **Đang thực hiện** (in_progress)
   - **Hoàn thành** (completed)
3. Click vào bất kỳ card nào để cập nhật:
   - Thay đổi trạng thái
   - Cập nhật số lượng đã hoàn thành
   - Thêm/xóa nhân viên
4. Mọi thay đổi được sync realtime!

---

## 🗄️ Database Schema

### Workflows (Templates)

```typescript
{
  "workflows": {
    "workflowId001": {
      "name": "Cắt vải",
      "defaultEmployees": ["empId001", "empId002"],
      "createdAt": 1733392100,
      "order": 0
    }
  }
}
```

### Employees

```typescript
{
  "employees": {
    "empId001": {
      "name": "Nguyễn Văn A",
      "role": "worker",
      "createdAt": 1733392100
    }
  }
}
```

### Orders

```typescript
{
  "orders": {
    "orderId001": {
      "code": "ORD001",
      "customerName": "Linh",
      "customerPhone": "0912345678",
      "createdBy": "empId003",
      "createdAt": 1733392300,
      "status": "active",
      "products": {
        "productId001": {
          "name": "Áo thun nữ",
          "quantity": 100,
          "price": 150000,
          "steps": {
            "step1": {
              "workflowId": "workflowId001",
              "name": "Cắt vải",
              "employees": { "empId001": true },
              "status": "in_progress",
              "completedQuantity": 50,
              "updatedAt": 1733392400
            }
          }
        }
      }
    }
  }
}
```

---

## 🛠️ API Functions

### Workflow Templates

```typescript
// Tạo workflow template
createWorkflowTemplate(firebaseApp, {
  name: "Cắt vải",
  defaultEmployees: ["empId001"],
  order: 0,
});

// Cập nhật workflow
updateWorkflowTemplate(firebaseApp, workflowId, { name: "Cắt vải mới" });

// Xóa workflow
deleteWorkflowTemplate(firebaseApp, workflowId);
```

### Employees

```typescript
// Tạo nhân viên
createEmployee(firebaseApp, {
  name: "Nguyễn Văn A",
  role: "worker",
});

// Cập nhật nhân viên
updateEmployee(firebaseApp, employeeId, { role: "manager" });

// Xóa nhân viên
deleteEmployee(firebaseApp, employeeId);
```

### Orders

```typescript
// Tạo đơn hàng
createOrder(
  firebaseApp,
  {
    customerName: "Linh",
    customerPhone: "0912345678",
    createdBy: "currentUserId",
    products: [{ name: "Áo thun", quantity: 100, price: 150000 }],
  },
  workflows // Workflow templates array
);

// Cập nhật tiến độ step
updateStepProgress(firebaseApp, {
  orderId: "orderId001",
  productId: "productId001",
  stepId: "step1",
  completedQuantity: 75,
  status: "in_progress",
});

// Thêm/xóa nhân viên khỏi step
updateStepEmployees(firebaseApp, {
  orderId: "orderId001",
  productId: "productId001",
  stepId: "step1",
  employeeId: "empId002",
  action: "add", // or 'remove'
});
```

---

## 🔥 React Hooks

### useRealtimeValue

Hook cơ bản để lắng nghe một path trong Realtime Database:

```typescript
const { data, isLoading, error } = useRealtimeValue<WorkflowTemplate>(
  "workflows/workflowId001"
);
```

### useRealtimeList

Hook để lắng nghe một collection và convert sang array:

```typescript
const {
  data: workflows,
  isLoading,
  error,
} = useRealtimeList<WorkflowTemplate>("workflows");
// data = [{id: 'workflowId001', name: 'Cắt vải', ...}, ...]
```

### useRealtimeDoc

Hook để lắng nghe một document cụ thể:

```typescript
const { data, isLoading, error } = useRealtimeDoc<Order>("orders/orderId001");
// data = {id: 'orderId001', code: 'ORD001', ...}
```

---

## 🎨 Components

### WorkflowTemplateManager

Quản lý workflow templates (CRUD operations).

```tsx
<WorkflowTemplateManager employees={employees} />
```

### EmployeeManager

Quản lý nhân viên (CRUD operations).

```tsx
<EmployeeManager />
```

### CreateOrderModal

Modal tạo đơn hàng mới với products và workflow clone.

```tsx
<CreateOrderModal
  open={isOpen}
  onClose={handleClose}
  workflows={workflows}
  employees={employees}
  currentUserId="userId"
/>
```

### WorkflowKanban

Kanban board để tracking workflow steps realtime.

```tsx
<WorkflowKanban orders={orders} employees={employees} />
```

---

## 🚨 Troubleshooting

### Lỗi "Permission denied"

- **Nguyên nhân**: Security Rules chưa đúng hoặc user chưa đăng nhập
- **Giải pháp**:
  1. Check Firebase Rules (xem phần 3 ở trên)
  2. Đảm bảo user đã đăng nhập (test mode: `.read: true, .write: true`)

### Không thấy dữ liệu realtime

- **Nguyên nhân**: `databaseURL` chưa được config
- **Giải pháp**: Thêm `NEXT_PUBLIC_FIREBASE_DATABASE_URL` vào `.env.local`

### Lỗi "Cannot create order: workflows empty"

- **Nguyên nhân**: Chưa tạo workflow templates
- **Giải pháp**: Vào tab "Công đoạn" và tạo ít nhất 1 workflow

---

## 📊 Performance & Scalability

### Optimizations

1. **Object maps thay vì arrays**: Tránh array index issues trong Firebase
2. **Shallow listeners**: Chỉ listen vào paths cần thiết
3. **Server timestamps**: Dùng `Date.now()` để tránh clock skew
4. **Indexed queries**: Đã config `.indexOn` cho các fields thường query

### Limits

- Firebase Realtime Database có thể handle **hàng nghìn concurrent connections**
- Mỗi write operation < 10KB để tối ưu
- Nên pagination nếu có > 1000 orders

---

## 🎓 Best Practices

1. ✅ **Luôn validate input** trước khi write vào database
2. ✅ **Use TypeScript types** để type-safe
3. ✅ **Handle errors gracefully** với try-catch và message.error()
4. ✅ **Realtime listeners cleanup** với return unsubscribe trong useEffect
5. ✅ **Memoize Firebase refs** nếu dùng với Firestore hooks

---

## 📞 Support

Nếu có vấn đề, check:

1. Firebase Console -> Realtime Database -> Data (xem có data không)
2. Browser Console (F12) -> Network tab (xem Firebase requests)
3. Firebase Console -> Rules (xem có permission denied không)

---

**Built with ❤️ using React, Next.js, Ant Design, and Firebase**
