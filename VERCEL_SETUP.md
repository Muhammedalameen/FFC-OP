# إعداد المشروع على Vercel

## المشكلة الأصلية
المشروع كان يحتوي على بيانات اتصال قاعدة البيانات Turso مكتوبة مباشرة في الكود، مما يعني أن متغيرات البيئة التي تضيفها على Vercel لم تكن تُستخدم.

## الحل المطبق ✓
- تم تعديل `server/db.ts` لقراءة متغيرات البيئة بدلاً من استخدام قيم مهاردة
- تم تحديث `.env.example` لتوضيح المتغيرات الصحيحة

## خطوات الإعداد على Vercel

### 1️⃣ متغيرات البيئة المطلوبة
في لوحة تحكم Vercel، أضف المتغيرات التالية:

```
TURSO_DB_URL=libsql://your-db-name.turso.io
TURSO_AUTH_TOKEN=your-auth-token-here
GEMINI_API_KEY=your-gemini-key-here
APP_URL=https://your-vercel-url.vercel.app
```

**للحصول عليها:**
1. **TURSO_DB_URL و TURSO_AUTH_TOKEN**:
   - اذهب إلى https://app.turso.io
   - انسخ Connection URL (مثل: `libsql://your-db.turso.io`)
   - انسخ Auth Token

2. **GEMINI_API_KEY**:
   - اذهب إلى Google AI Studio: https://aistudio.google.com
   - أنشئ API Key جديد

3. **APP_URL**:
   - هو رابط تطبيقك على Vercel (مثل: `https://my-app.vercel.app`)

### 2️⃣ التحقق من الإعدادات
تأكد من أن:
- [ ] تم إضافة المتغيرات في Vercel Environment Variables
- [ ] النطاق البيئي صحيح (set to all environments if needed)
- [ ] تم إعادة النشر بعد إضافة المتغيرات

### 3️⃣ اختبار الاتصال
بعد النشر، قم بفتح:
```
https://your-app.vercel.app/api/health/ping
```

يجب أن تحصل على رد:
```json
{"status":"ok"}
```

### 4️⃣ حل المشاكل الشائعة

**❌ خطأ: "Database initialization failed"**
- [ ] تأكد من أن جميع متغيرات البيئة مضافة
- [ ] تأكد من أن TURSO_DB_URL و TURSO_AUTH_TOKEN صحيحة
- [ ] افحص سجلات Vercel للتفاصيل الكاملة

**❌ خطأ: "environment variable is not set"**
- إنتظر دقيقة بعد إضافة المتغيرات
- أعد نشر المشروع (`Redeploy`)

**❌ الصفحة تحمل لكن البيانات لا تظهر**
- افتح console في المتصفح (F12)
- تحقق من أن `/api/` requests تعيد بيانات صحيحة
- تأكد من أن صراحيات الدخول TURSO صحيحة

## البيئة المحلية

لتشغيل المشروع محلياً:

1. أنشئ ملف `.env.local`:
```
TURSO_DB_URL=libsql://your-db.turso.io
TURSO_AUTH_TOKEN=your-token
GEMINI_API_KEY=your-key
APP_URL=http://localhost:3000
```

2. شغل المشروع:
```bash
npm run dev
```

## Files المعدلة
- `server/db.ts` - الآن يقرأ متغيرات البيئة
- `.env.example` - تم تحديث الأمثلة

## معلومات إضافية
- المشروع يستخدم Express + Vite
- على Vercel: يتم استخدام `api/index.ts` كـ serverless function
- محلياً: يتم تشغيل server كامل مع Vite dev server
