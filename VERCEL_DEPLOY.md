# Hướng dẫn Deploy lên Vercel bằng Web UI

## Bước 1: Đẩy code lên Git Repository

### Nếu chưa có Git repository:

1. Tạo repository mới trên GitHub/GitLab/Bitbucket
2. Chạy các lệnh sau trong terminal:

```bash
cd c:\Users\admin\Desktop\xoxo\xoxo
git init
git add .
git commit -m "Initial commit"
git branch -M main
git remote add origin <URL_CỦA_REPOSITORY>
git push -u origin main
```

### Nếu đã có Git repository:

```bash
cd c:\Users\admin\Desktop\xoxo\xoxo
git add .
git commit -m "Prepare for Vercel deployment"
git push
```

## Bước 2: Deploy trên Vercel Web UI

1. **Đăng nhập/Đăng ký Vercel:**
   - Truy cập: https://vercel.com
   - Đăng nhập bằng GitHub/GitLab/Bitbucket account

2. **Import Project:**
   - Click "Add New..." → "Project"
   - Chọn repository vừa push code
   - Click "Import"

3. **Cấu hình Project:**
   - **Framework Preset:** Next.js (tự động detect)
   - **Root Directory:** `./` (hoặc để mặc định)
   - **Build Command:** `npm run build` (mặc định)
   - **Output Directory:** `.next` (mặc định)
   - **Install Command:** `npm install` (mặc định)

4. **Cấu hình Environment Variables:**
   
   Click "Environment Variables" và thêm các biến sau:

   ### Server-side Variables:
   ```
   NEXT_ENV=production
   FIREBASE_PROJECT_ID=<your-firebase-project-id>
   FIREBASE_PRIVATE_KEY_ID=<your-private-key-id>
   FIREBASE_PRIVATE_KEY=<your-private-key>
   FIREBASE_CLIENT_EMAIL=<your-client-email>
   FIREBASE_CLIENT_ID=<your-client-id>
   FIREBASE_CLIENT_X509_CERT_URL=<your-cert-url>
   ```

   ### Client-side Variables (NEXT_PUBLIC_*):
   ```
   NEXT_PUBLIC_APP_URL=https://your-app.vercel.app
   NEXT_PUBLIC_FIREBASE_API_KEY=<your-api-key>
   NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=<your-auth-domain>
   NEXT_PUBLIC_FIREBASE_PROJECT_ID=<your-project-id>
   NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=<your-storage-bucket>
   NEXT_PUBLIC_FIREBASE_APP_ID=<your-app-id>
   NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=<your-sender-id>
   NEXT_PUBLIC_FIREBASE_DATABASE_URL=<your-database-url>
   ```

   **Lưu ý:** 
   - Copy các giá trị từ file `.env` local của bạn
   - Đảm bảo chọn đúng môi trường (Production, Preview, Development)
   - Với `NEXT_PUBLIC_APP_URL`, sau khi deploy xong, bạn sẽ có URL từ Vercel (ví dụ: `https://your-project.vercel.app`)

5. **Deploy:**
   - Click "Deploy"
   - Chờ quá trình build hoàn tất (thường mất 2-5 phút)
   - Sau khi deploy thành công, bạn sẽ nhận được URL: `https://your-project.vercel.app`

## Bước 3: Cập nhật Environment Variables sau khi có URL

Sau khi deploy lần đầu, bạn cần:

1. Vào Settings → Environment Variables
2. Cập nhật `NEXT_PUBLIC_APP_URL` với URL thực tế từ Vercel
3. Redeploy project để áp dụng thay đổi

## Bước 4: Tự động Deploy (Auto-deploy)

Vercel sẽ tự động deploy mỗi khi bạn push code lên branch chính:
- Push lên `main` → Deploy Production
- Push lên branch khác → Tạo Preview Deployment

## Troubleshooting

### Build Failed:
- Kiểm tra logs trong Vercel Dashboard
- Đảm bảo tất cả environment variables đã được cấu hình
- Kiểm tra `package.json` có đúng build script

### Environment Variables không hoạt động:
- Đảm bảo đã chọn đúng môi trường (Production/Preview/Development)
- Redeploy sau khi thêm/sửa environment variables
- Kiểm tra tên biến có đúng (phân biệt hoa thường)

### Firebase Connection Issues:
- Kiểm tra Firebase config trong `.env`
- Đảm bảo Firebase project cho phép domain của Vercel
- Kiểm tra Firebase Realtime Database rules


