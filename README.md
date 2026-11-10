# سكنلي | Sakanly — منصة سكن الطلاب في مصر 🇪🇬

> **Sakanly** هي منصة عقارية Proptech متخصصة في سكن الطلاب والمغتربين في مصر، مبنية بتصميم عصري (Mobile-First)، تدعم اللغة العربية والاتجاه من اليمين إلى اليسار (RTL) بشكل أصيل وخط Cairo، مع لوحة ألوان معتمدة، وتجربة تصفح سريعة بدون سماسرة أو عمولات خفية.
>
> 🚀 **الواجهة الأمامية مبنية بالكامل باستخدام React + Vite + JavaScript + JSX.**

---

## 🎨 الهوية البصرية (Brand Identity)

تم استخدام لوحة الألوان المعتمدة رسمياً:
- **Primary (الرئيسي):** `#0F766E` (Deep Teal)
- **Dark (الداكن):** `#0B3D3A`
- **Background (الخلفية):** `#F8FAFC`
- **Accent (التمييز):** `#F59E0B` (Amber)
- **Main Text (النص الأساسي):** `#1E293B` (Slate 800)
- **Verified Green (شارة التوثيق):** `#10B981` (Emerald)
- **Surface (أسطح البطاقات):** `#FFFFFF`
- **Border (الحدود):** `#E2E8F0`
- **الخط الطباعي:** **Cairo** لجميع النصوص العربية مع أوزان 400، 500، 600، 700، 800.

---

## 🏗️ البنية التقنية (Technology Stack)

### Frontend (واجهة المستخدم):
- **React 19** + **Vite 8**
- **JavaScript + JSX** (بدون أي اعتماد على TypeScript أو ملفات `.ts`/`.tsx`)
- **Tailwind CSS** (مع تضمين توكنز ألوان سكنلي وخط Cairo)
- **React Router Dom** (للتنقل بين الصفحات)
- **Lucide React** (أيقونات تفاعلية)
- **Mobile-First Design:** تجربة مخصصة ومختبرة للشاشات المحمولة (360px، 390px، 430px)، وشاشات التابلت، وشاشات سطح المكتب.
- **شريط تنقل سفلي للهواتف المحمولة (Mobile Bottom Navigation):** الرئيسية، البحث، الأسِرّة الفردية، المفضلة، حسابي.

### Backend (الخادم وواجهة البرمجة REST API):
- **Node.js** + **Express.js** (JavaScript ES Modules)
- بادئة المسار الرسمي: `/api/v1`
- **CORS** مهيأ لمصدر التطوير في Vite (`http://localhost:5173`)
- **JSON Parsing & Error Handling:** معالجة مركزية للأخطاء وواجهات استجابة موحدة (`ApiResponse`)

---

## 📁 هيكل المشروع (Project Structure)

```text
Sakanly/
├── client/                      # تطبيق الواجهة الأمامية (React + Vite + JS + JSX)
│   ├── public/
│   ├── src/
│   │   ├── components/
│   │   │   ├── common/         # شارات التوثيق، مودال طلب المعاينة، درج الفلترة المحمول
│   │   │   │   ├── Badge.jsx
│   │   │   │   ├── FilterDrawer.jsx
│   │   │   │   └── ViewingRequestModal.jsx
│   │   │   ├── layout/         # النافبار، الشريط السفلي للموبايل، والفوتر
│   │   │   │   ├── Navbar.jsx
│   │   │   │   ├── MobileBottomNav.jsx
│   │   │   │   └── Footer.jsx
│   │   │   ├── property/       # بطاقات العقارات، بطاقات الأسِرّة، ومعرض الصور
│   │   │   │   ├── PropertyCard.jsx
│   │   │   │   ├── BedCard.jsx
│   │   │   │   └── PropertyGallery.jsx
│   │   │   └── search/         # شريط البحث الرئيسي وشريط الفلترة الجانبي
│   │   │       ├── HeroSearch.jsx
│   │   │       └── FilterSidebar.jsx
│   │   ├── context/            # إدارة المفضلة مع LocalStorage
│   │   │   └── FavoritesContext.jsx
│   │   ├── data/               # بيانات تجريبية واقعية لأحياء وجامعات مصر
│   │   │   └── mockProperties.js
│   │   ├── pages/              # صفحات التطبيق
│   │   │   ├── HomePage.jsx
│   │   │   ├── BrowsePage.jsx
│   │   │   ├── PropertyDetailsPage.jsx
│   │   │   ├── BedsPage.jsx
│   │   │   ├── LoginPage.jsx
│   │   │   ├── RegisterPage.jsx
│   │   │   ├── HowItWorksPage.jsx
│   │   │   ├── OwnerDashboardPage.jsx
│   │   │   └── NotFoundPage.jsx
│   │   ├── services/           # استدعاء الـ API مع دعم التشغيل دون اتصال
│   │   │   └── api.js
│   │   ├── App.jsx
│   │   ├── index.css
│   │   └── main.jsx
│   ├── index.html
│   ├── package.json
│   ├── tailwind.config.js
│   └── vite.config.js
│
├── server/                      # خادم Express REST API (JavaScript)
│   ├── src/
│   │   ├── config/             # متغيرات البيئة والإعدادات
│   │   ├── controllers/        # وحدات التحكم (Listings, Health)
│   │   ├── data/               # قاعدة البيانات التجريبية
│   │   ├── middleware/         # معالجة الأخطاء والـ 404
│   │   ├── routes/             # مسارات /api/v1 (health, listings)
│   │   ├── services/           # منطق التصفية والبحث
│   │   ├── utils/              # مساعد الاستجابات ApiResponse
│   │   ├── validators/         # التحقق من المدخلات
│   │   ├── app.js              # تهيئة Express
│   │   └── server.js           # تشغيل الخادم
│   └── package.json
│
├── scripts/
│   └── dev.js                  # مشغل بيئة التطوير المتزامن
├── .env.example
├── .gitignore
├── package.json
└── README.md
```

---

## 🚀 كيفية التثبيت والتشغيل (Getting Started)

### تشغيل بيئة التطوير (Frontend + Backend معاً)
```bash
npm run dev
```
- **الواجهة الأمامية (Vite):** `http://localhost:5173`
- **الخادم الخلفي (Express API):** `http://localhost:5000`

### أوامر التشغيل المنفصلة
- تشغيل الواجهة الأمامية فقط: `npm run dev:client`
- تشغيل الخادم الخلفي فقط: `npm run dev:server`
- بناء نسخة الإنتاج للواجهة: `npm run build`
- تشغيل خادم الإنتاج: `npm run start:server`
