# Firebase Realtime Database Rules Fix

## Vấn đề: Permission denied

Firebase Realtime Database hiện tại có security rules chặn read/write.

## Giải pháp:

### Option 1: Temporary Development Rules (DỄ NHẤT)

1. Vào Firebase Console:
   https://console.firebase.google.com/project/morata-a9eba/database/rules
2. Thay đổi rules thành:

```json
{
  "rules": {
    ".read": true,
    ".write": true
  }
}
```

⚠️ **CHÚ Ý:** Rules này cho phép mọi người read/write. Chỉ dùng cho development!

### Option 2: Authentication Required Rules

```json
{
  "rules": {
    ".read": "auth != null",
    ".write": "auth != null"
  }
}
```

### Option 3: Specific Path Rules

```json
{
  "rules": {
    "xoxo": {
      ".read": true,
      ".write": true
    }
  }
}
```

## Hành động ngay:

1. Vào Firebase Console Database Rules
2. Áp dụng Option 1 để test nhanh
3. Save & Deploy rules
4. Refresh trang workflow-management để test

## Sau khi fix:

- Console sẽ hiện data thay vì "Permission denied"
- UI sẽ hiển thị workflows, employees, orders
