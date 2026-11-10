export const mockListings = [
  {
    id: "prop-001",
    title: "شقة طلابية مودرن مجهزة بالكامل بالقرب من جامعة عين شمس",
    titleEn: "Modern Fully-Furnished Student Apartment Near Ain Shams University",
    governorate: "القاهرة",
    city: "مدينة نصر",
    district: "الحي السابع",
    address: "شارع مصطفى النحاس، بالقرب من محطة المترو والمكتبات الكبرى",
    accommodationType: "entire_apartment", // entire_apartment, private_room, shared_room, individual_bed
    monthlyPrice: 8500,
    deposit: 8500,
    utilitiesCost: 600,
    bedrooms: 3,
    bathrooms: 2,
    area: 135,
    genderPreference: "male", // male, female, any
    availableBeds: 4,
    totalBeds: 4,
    description: "شقة واسعة ومجهزة بالكامل للطلاب بالقرب من مترو الاستاد وجامعة عين شمس. تشمل مطبخاً متكاملاً بأجهزة حديثة، غسالة أوتوماتيك، إنترنت فائق السرعة، ومكتب دراسي مستقل لكل سرير. المبنى مؤمن بمصعد وكاميرات مراقبة.",
    images: [
      "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?auto=format&fit=crop&w=1000&q=80",
      "https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?auto=format&fit=crop&w=1000&q=80",
      "https://images.unsplash.com/photo-1484154218962-a197022b5858?auto=format&fit=crop&w=1000&q=80"
    ],
    amenities: [
      "واي فاي فائق السرعة (ألياف ضوئية)",
      "تكييف هواء سبليت",
      "مكتب دراسة وإضاءة LED",
      "غسالة ملابس أوتوماتيكية",
      "سخان غاز طبيعي",
      "حراسة وأمن 24/7",
      "مصعد حديث",
      "مطبخ مجهز بالكامل"
    ],
    nearbyUniversities: [
      { name: "جامعة عين شمس", distance: "12 دقيقة بالمواصلات" },
      { name: "جامعة الأزهر", distance: "8 دقائق مشياً" }
    ],
    isFurnished: true,
    isVerified: true,
    featured: true,
    createdAt: "2026-09-15T10:00:00Z",
    owner: {
      id: "usr-owner-001",
      name: "م. أحمد الشناوي",
      phone: "01198765432",
      avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=200&q=80",
      verificationStatus: "verified",
      memberSince: "2024",
      responseRate: "98%",
      responseTime: "خلال 15 دقيقة"
    }
  },
  {
    id: "prop-002",
    title: "سرير فردي في غرفة ثنائية راقية للبنات - الدقي",
    titleEn: "Single Bed in Deluxe Shared Room for Female Students - Dokki",
    governorate: "الجيزة",
    city: "الدقي",
    district: "ميدان المساحة",
    address: "شارع مصدق المتفرع من شارع التحرير",
    accommodationType: "individual_bed",
    monthlyPrice: 2800,
    deposit: 2800,
    utilitiesCost: 300,
    bedrooms: 2,
    bathrooms: 2,
    area: 25,
    genderPreference: "female",
    availableBeds: 1,
    totalBeds: 2,
    description: "سرير متاح داخل غرفة ثنائية واسعة ومريحة مخصصة للطالبات بالقرب من محطة مترو الدقي وجامعة القاهرة. تتضمن دولاباً كبيراً، مكتباً للمذاكرة، وبلكونة بإطلالة هادئة. السكن هادئ ونظيف ويتبع نظام أمن صارم.",
    images: [
      "https://images.unsplash.com/photo-1595526114035-0d45ed16cfbf?auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1586023492125-27b2c045efd7?auto=format&fit=crop&w=1000&q=80",
      "https://images.unsplash.com/photo-1513694203232-719a280e022f?auto=format&fit=crop&w=1000&q=80"
    ],
    amenities: [
      "واي فاي غير محدود",
      "تكييف هواء",
      "مكتب فردي ومقعد مريح",
      "دولاب ملابس خاص",
      "خدمة نظافة أسبوعية للمرافق المشتركة",
      "بواب وكاميرات مراقبة",
      "مطبخ مشترك كامل"
    ],
    nearbyUniversities: [
      { name: "جامعة القاهرة", distance: "10 دقائق بمترو الأنفاق" },
      { name: "جامعة 6 أكتوبر (فرع الدقي)", distance: "5 دقائق مشياً" }
    ],
    isFurnished: true,
    isVerified: true,
    featured: true,
    createdAt: "2026-09-20T12:30:00Z",
    owner: {
      id: "usr-owner-001",
      name: "م. أحمد الشناوي",
      phone: "01198765432",
      avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=200&q=80",
      verificationStatus: "verified",
      memberSince: "2024",
      responseRate: "100%",
      responseTime: "خلال 5 دقائق"
    }
  },
  {
    id: "prop-003",
    title: "غرفة خاصة مستقلة بحمام ماستر - التجمع الخامس (الجامعة الأمريكية)",
    titleEn: "Private Room with En-Suite Bathroom - New Cairo (Near AUC)",
    governorate: "القاهرة",
    city: "القاهرة الجديدة",
    district: "التجمع الخامس - حي النرجس",
    address: "كمبوند هادئ بالقرب من الجامعة الأمريكية (AUC) وشارع التسعين",
    accommodationType: "private_room",
    monthlyPrice: 6200,
    deposit: 6200,
    utilitiesCost: 450,
    bedrooms: 1,
    bathrooms: 1,
    area: 32,
    genderPreference: "any",
    availableBeds: 1,
    totalBeds: 1,
    description: "غرفة ماستر مستقلة وفاخرة داخل فيلا هادئة تناسب طلاب الجامعة الأمريكية والجامعة الألمانية. تشمل حماماً خاصاً، ميني بار، شاشة ذكية، وتكييف كاريير جديد. الفيلا تضم حديقة وموقف سيارات خاص.",
    images: [
      "https://images.unsplash.com/photo-1616594039964-ae9021a400a0?auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1507089947368-19c1da9775ae?auto=format&fit=crop&w=1000&q=80",
      "https://images.unsplash.com/photo-1584622650111-993a426fbf0a?auto=format&fit=crop&w=1000&q=80"
    ],
    amenities: [
      "حمام خاص ماستر",
      "واي فاي بسرعة 100 ميجا",
      "تكييف هواء انفرتر",
      "ميني ثلاجة داخل الغرفة",
      "حديقة ومنطقة دراسة خارجية",
      "أمن كومباوند على مدار الساعة",
      "موقف سيارات مجاني"
    ],
    nearbyUniversities: [
      { name: "الجامعة الأمريكية بالقاهرة (AUC)", distance: "5 دقائق بالسيارة / باص الجامعة" },
      { name: "الجامعة الألمانية بالقاهرة (GUC)", distance: "12 دقيقة" }
    ],
    isFurnished: true,
    isVerified: true,
    featured: true,
    createdAt: "2026-10-01T08:15:00Z",
    owner: {
      id: "usr-owner-002",
      name: "طارق عبد السلام",
      phone: "01211112222",
      avatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&w=200&q=80",
      verificationStatus: "not_started",
      memberSince: "2025",
      responseRate: "95%",
      responseTime: "خلال 30 دقيقة"
    }
  },
  {
    id: "prop-004",
    title: "سكن شبابي حديث بالقرب من جامعة مصر للعلوم والتكنولوجيا (MUST) - 6 أكتوبر",
    titleEn: "Modern Student Shared Apartment near MUST University - 6th of October",
    governorate: "الجيزة",
    city: "مدينة 6 أكتوبر",
    district: "الحي الأول",
    address: "بجوار المحور المركزي وميدان الحصري",
    accommodationType: "shared_room",
    monthlyPrice: 2200,
    deposit: 2200,
    utilitiesCost: 250,
    bedrooms: 3,
    bathrooms: 2,
    area: 120,
    genderPreference: "male",
    availableBeds: 2,
    totalBeds: 6,
    description: "شقة طلابية ممتازة في قلب مدينة 6 أكتوبر بجوار ميدان الحصري والمطاعم والخدمات، وعلى بُعد خطوات من جامعة MUST وجامعة MSA. بيئة مريحة للدراسة وشباب محترمون.",
    images: [
      "https://images.unsplash.com/photo-1598928506311-c55ded91a20c?auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1554995207-c18c203602cb?auto=format&fit=crop&w=1000&q=80",
      "https://images.unsplash.com/photo-1512918728675-ed5a9ecdebfd?auto=format&fit=crop&w=1000&q=80"
    ],
    amenities: [
      "إنترنت منزلي فائق السرعة",
      "غسالة ملابس وثلاجة حديثة",
      "صالة معيشة مع شاشة تلفزيون",
      "غاز طبيعي ومياه نقية",
      "قريب من جميع المواصلات ومحطة الباص"
    ],
    nearbyUniversities: [
      { name: "جامعة مصر للعلوم والتكنولوجيا (MUST)", distance: "6 دقائق مشياً" },
      { name: "جامعة أكتوبر للعلوم والآداب (MSA)", distance: "12 دقيقة" },
      { name: "جامعة النيل", distance: "10 دقائق" }
    ],
    isFurnished: true,
    isVerified: true,
    status: 'active',
    featured: false,
    createdAt: "2026-10-05T14:00:00Z",
    owner: {
      id: "usr-owner-002",
      name: "طارق عبد السلام",
      phone: "01211112222",
      avatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&w=200&q=80",
      verificationStatus: "not_started",
      memberSince: "2025",
      responseRate: "92%",
      responseTime: "خلال ساعة"
    }
  },
  {
    id: "prop-005",
    title: "استوديو طلابي أنيق ومفروش بإطلالة نيلية - المعادي",
    titleEn: "Chic Furnished Student Studio with Nile View - Maadi",
    governorate: "القاهرة",
    city: "المعادي",
    district: "المعادي السرايات",
    address: "شارع 9 بالقرب من محطة مترو المعادي",
    accommodationType: "entire_apartment",
    monthlyPrice: 9500,
    deposit: 9500,
    utilitiesCost: 700,
    bedrooms: 1,
    bathrooms: 1,
    area: 65,
    genderPreference: "any",
    availableBeds: 1,
    totalBeds: 1,
    description: "استوديو رائع بتشطيب ألترا سوبر لوكس وإضاءة طبيعية مبهجة. يتميز بالهدوء التام والخصوصية العالية، مناسب جداً لطلبة الماجستير والجامعات الدولية. خطوات من كافيهات ومطاعم شارع 9 الشهيرة.",
    images: [
      "https://images.unsplash.com/photo-1502005229762-ee1b2b8ab00f?auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1536376072261-38c75010e6c9?auto=format&fit=crop&w=1000&q=80",
      "https://images.unsplash.com/photo-1493809842364-78817add7ffb?auto=format&fit=crop&w=1000&q=80"
    ],
    amenities: [
      "إطلالة مفتوحة ومميزة",
      "أثاث إسكندنافي عصري",
      "تكييف هواء ساخن/بارد",
      "إنترنت فائق السرعة",
      "مطبخ أمريكي مفتوح بأجهزة كاملة",
      "مبنى مزود بأقفال إلكترونية ذكية"
    ],
    nearbyUniversities: [
      { name: "جامعة حلوان", distance: "20 دقيقة بالمترو المباشر" },
      { name: "جامعة القاهرة", distance: "25 دقيقة بالمترو" }
    ],
    isFurnished: true,
    isVerified: true,
    featured: true,
    createdAt: "2026-10-10T16:20:00Z",
    owner: {
      id: "own-105",
      name: "سارة النحاس",
      phone: "+201555443322",
      avatar: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=200&q=80",
      verificationStatus: "verified_owner",
      memberSince: "2024",
      responseRate: "99%",
      responseTime: "خلال 10 دقائق"
    }
  },
  {
    id: "prop-006",
    title: "سرير فردي في سكن طالبات مميز - مصر الجديدة (الكوربة)",
    titleEn: "Single Bed for Female Student - Heliopolis (Korba)",
    governorate: "القاهرة",
    city: "مصر الجديدة",
    district: "الكوربة",
    address: "شارع بغداد، بالقرب من كنيسة البازيليك ومحطة مترو الأهرام",
    accommodationType: "individual_bed",
    monthlyPrice: 3200,
    deposit: 3200,
    utilitiesCost: 350,
    bedrooms: 3,
    bathrooms: 2,
    area: 30,
    genderPreference: "female",
    availableBeds: 2,
    totalBeds: 4,
    description: "فرصة رائعة للإقامة في أرقى أحياء مصر الجديدة في عمارة تاريخية ذات طراز معماري فريد وسقوف عالية. بيئة سكنية نسائية آمنة 100% ومشرفة سكن متواجدة لتوفير الراحة والهدوء للطالبات.",
    images: [
      "https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1586023492125-27b2c045efd7?auto=format&fit=crop&w=1000&q=80",
      "https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&w=1000&q=80"
    ],
    amenities: [
      "مشرفة سكن مقيمة للمساعدة وحفظ النظام",
      "دخول بنظام البصمة والكارت الذكي",
      "تكييف هواء بكل غرفة",
      "إنترنت فائق السرعة مخصص للمذاكرة",
      "غسالة ومجفف ملابس",
      "منطقة استراحة ومذاكرة مشتركة"
    ],
    nearbyUniversities: [
      { name: "جامعة عين شمس (كلية البنات)", distance: "7 دقائق بالمترو" },
      { name: "الأكاديمية العربية للعلوم والتكنولوجيا (شيراتون)", distance: "15 دقيقة" }
    ],
    isFurnished: true,
    isVerified: true,
    status: 'active',
    featured: false,
    createdAt: "2026-10-12T11:45:00Z",
    owner: {
      id: "own-106",
      name: "أ. هدى زكي",
      phone: "+201011998844",
      avatar: "https://images.unsplash.com/photo-1580489944761-15a19d654956?auto=format&fit=crop&w=200&q=80",
      verificationStatus: "verified_owner",
      memberSince: "2023",
      responseRate: "97%",
      responseTime: "خلال 20 دقيقة"
    }
  },
  {
    id: "prop-007",
    title: "شقة استثمارية مجهزة للطلاب - الشيخ زايد (الحي الثامن)",
    titleEn: "Student Apartment in Sheikh Zayed (8th District)",
    governorate: "الجيزة",
    city: "الشيخ زايد",
    district: "الحي الثامن",
    address: "بجوار مول المعز ومستشفى زايد التخصصي",
    accommodationType: "entire_apartment",
    monthlyPrice: 11000,
    deposit: 11000,
    utilitiesCost: 800,
    bedrooms: 3,
    bathrooms: 2,
    area: 145,
    genderPreference: "any",
    availableBeds: 5,
    totalBeds: 5,
    description: "شقة حديثة وراقية جداً بالشيخ زايد في منطقة هادئة وراقية تناسب مجموعة من الزملاء أو الطالبات. قريبة من كندا وبوليتكنك وجامعة النيل وجامعة القاهرة فرع الشيخ زايد.",
    images: [
      "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1600565193348-f74bd3c7ccdf?auto=format&fit=crop&w=1000&q=80",
      "https://images.unsplash.com/photo-1600573472591-ee6b68d14c68?auto=format&fit=crop&w=1000&q=80"
    ],
    amenities: [
      "فرش أيكيا فاخر بالكامل",
      "تكييف مركزي",
      "مطبخ مجهز بغسالة أطباق وميكروويف",
      "إنترنت فايبر عالي السرعة",
      "أمن وحراسة مشددة للمجمع",
      "شرفة واسعة بإطلالة مساحات خضراء"
    ],
    nearbyUniversities: [
      { name: "جامعة النيل", distance: "7 دقائق بالسيارة" },
      { name: "جامعة القاهرة (فرع الشيخ زايد)", distance: "9 دقائق" }
    ],
    isFurnished: true,
    isVerified: true,
    status: 'active',
    featured: false,
    createdAt: "2026-10-14T09:30:00Z",
    owner: {
      id: "own-107",
      name: "م. إبراهيم رضوان",
      phone: "+201200998877",
      avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=200&q=80",
      verificationStatus: "verified_owner",
      memberSince: "2024",
      responseRate: "94%",
      responseTime: "خلال 45 دقيقة"
    }
  },
  {
    id: "prop-008",
    title: "سرير اقتصادي للشباب بالقرب من جامعة الأزهر - العباسية",
    titleEn: "Budget Single Bed for Male Students - Abbassia",
    governorate: "القاهرة",
    city: "العباسية",
    district: "ميدان عبده باشا",
    address: "شارع الجيش، على مسافة خطوات من محطة مترو عبده باشا",
    accommodationType: "individual_bed",
    monthlyPrice: 1700,
    deposit: 1500,
    utilitiesCost: 200,
    bedrooms: 2,
    bathrooms: 1,
    area: 20,
    genderPreference: "male",
    availableBeds: 2,
    totalBeds: 4,
    description: "سكن طلابي اقتصادي مريح ومناسب جداً لميزانية الطلاب المقيدين بجامعة الأزهر أو هندسة عين شمس. الشقة هادئة وتوفر بيئة جيدة للمذاكرة والمصروفات شاملة مياه وكهرباء وغاز.",
    images: [
      "https://images.unsplash.com/photo-1595526114035-0d45ed16cfbf?auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?auto=format&fit=crop&w=1000&q=80"
    ],
    amenities: [
      "إنترنت سريع مجاني",
      "شامل فواتير الخدمات (مياه وكهرباء)",
      "ثلاجة وغسالة ملابس",
      "دولاب وسرير فردي ومكتب للمذاكرة",
      "خطوات من محطة المترو والأسواق"
    ],
    nearbyUniversities: [
      { name: "جامعة الأزهر", distance: "10 دقائق مشياً" },
      { name: "كلية الهندسة جامعة عين شمس", distance: "5 دقائق مشياً" }
    ],
    isFurnished: true,
    isVerified: true,
    status: 'active',
    featured: false,
    createdAt: "2026-10-16T17:10:00Z",
    owner: {
      id: "own-108",
      name: "عماد فوزي",
      phone: "+201122339988",
      avatar: "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?auto=format&fit=crop&w=200&q=80",
      verificationStatus: "verified_owner",
      memberSince: "2025",
      responseRate: "90%",
      responseTime: "خلال ساعتين"
    }
  },
  {
    id: "prop-draft-001",
    title: "مسودة خاصة: شقة دوبلكس قيد التجهيز للطلاب - الشناوي",
    titleEn: "Draft Apartment - Owner A",
    governorate: "القاهرة",
    city: "مدينة نصر",
    district: "الحي العاشر",
    address: "شارع أحمد الزمر",
    accommodationType: "entire_apartment",
    monthlyPrice: 9000,
    deposit: 9000,
    utilitiesCost: 500,
    bedrooms: 4,
    bathrooms: 2,
    area: 160,
    genderPreference: "male",
    availableBeds: 4,
    totalBeds: 4,
    description: "إعلان مسودة خاص بـ م. أحمد الشناوي قيد المراجعة.",
    images: [
      "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?auto=format&fit=crop&w=1200&q=80"
    ],
    amenities: ["تكييف", "واي فاي"],
    nearbyUniversities: [{ name: "جامعة الأزهر", distance: "5 دقائق" }],
    isFurnished: true,
    isVerified: false,
    featured: false,
    status: "draft",
    createdAt: "2026-10-25T10:00:00Z",
    owner: {
      id: "usr-owner-001",
      name: "م. أحمد الشناوي",
      phone: "01198765432",
      avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=200&q=80",
      verificationStatus: "verified"
    }
  },
  {
    id: "prop-demo-nasr-01",
    title: "شقة طلابية مفروشة بالكامل 3 غرف نوم - مدينة نصر (الحي السابع)",
    titleEn: "Fully Furnished 3-Bedroom Student Apartment - Nasr City",
    governorate: "القاهرة",
    city: "مدينة نصر",
    district: "الحي السابع",
    address: "شارع الطيران تقاطع مصطفى النحاس، مدينة نصر",
    accommodationType: "entire_apartment",
    monthlyPrice: 9000,
    deposit: 9000,
    utilitiesCost: 500,
    bedrooms: 3,
    bathrooms: 2,
    area: 145,
    genderPreference: "male",
    availableBeds: 6,
    totalBeds: 6,
    description: "شقة طلابية واسعة ومفروشة بالكامل في موقع استراتيجي بمدينة نصر بجوار الخدمات والمواصلات. تتكون من 3 غرف نوم مجهزة بـ 6 أسِرّة ودواليب ومكاتب استذكار مستقلة، 2 حمام مجهزين، صالة معيشة مكيفة، ومطبخ حديث متكامل.",
    images: [
      "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1595526114035-0d45ed16cfbf?auto=format&fit=crop&w=1000&q=80",
      "https://images.unsplash.com/photo-1484154218962-a197022b5858?auto=format&fit=crop&w=1000&q=80",
      "https://images.unsplash.com/photo-1584622650111-993a426fbf0a?auto=format&fit=crop&w=1000&q=80"
    ],
    amenities: [
      "واي فاي ألياف ضوئية فائق السرعة",
      "تكييف هواء سبليت",
      "غسالة ملابس أوتوماتيكية",
      "مكاتب دراسية فردية",
      "سخان غاز طبيعي",
      "حراسة وأمن 24/7",
      "مصعد كهربائي"
    ],
    nearbyUniversities: [
      { name: "جامعة الأزهر", distance: "5 دقائق مشياً" },
      { name: "جامعة عين شمس", distance: "12 دقيقة بالمواصلات" }
    ],
    isFurnished: true,
    isVerified: true,
    featured: true,
    status: "active",
    createdAt: "2026-10-01T10:00:00Z",
    owner: {
      id: "usr-owner-001",
      name: "م. أحمد الشناوي",
      phone: "01198765432",
      avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=200&q=80",
      verificationStatus: "verified",
      memberSince: "2024",
      responseRate: "98%",
      responseTime: "خلال 15 دقيقة"
    }
  },
  {
    id: "prop-demo-shams-02",
    title: "غرفة نوم مشتركة مجهزة بالقرب من جامعة عين شمس - العباسية",
    titleEn: "Equipped Shared Room Near Ain Shams University - Abbasiya",
    governorate: "القاهرة",
    city: "العباسية",
    district: "محيط جامعة عين شمس",
    address: "شارع الخليفة المأمون، العباسية، القاهرة",
    accommodationType: "shared_room",
    monthlyPrice: 2500,
    deposit: 2500,
    utilitiesCost: 250,
    bedrooms: 1,
    bathrooms: 1,
    area: 35,
    genderPreference: "male",
    availableBeds: 2,
    totalBeds: 2,
    description: "غرفة نوم ثنائية واسعة ومريحة لطلاب جامعة عين شمس على بُعد خطوات من الحرم الجامعي ومحطة مترو منشية الصدر. تشمل سريرين مفردين، دولابين ملابس مستقلين، ومكتبين للمذاكرة، مع مطبخ وحمام مشترك نظيف جداً.",
    images: [
      "https://images.unsplash.com/photo-1595526114035-0d45ed16cfbf?auto=format&fit=crop&w=1000&q=80",
      "https://images.unsplash.com/photo-1586023492125-27b2c045efd7?auto=format&fit=crop&w=1000&q=80",
      "https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?auto=format&fit=crop&w=1000&q=80",
      "https://images.unsplash.com/photo-1584622650111-993a426fbf0a?auto=format&fit=crop&w=1000&q=80"
    ],
    amenities: [
      "إنترنت فائق السرعة",
      "مكاتب استذكار فردية",
      "تكييف هواء",
      "ثلاجة وغسالة ملابس",
      "نظافة دورية للمناطق المشتركة",
      "أمن وحراسة"
    ],
    nearbyUniversities: [
      { name: "جامعة عين شمس", distance: "3 دقائق سيراً على الأقدام" }
    ],
    isFurnished: true,
    isVerified: true,
    featured: true,
    status: "active",
    createdAt: "2026-10-05T12:00:00Z",
    owner: {
      id: "usr-owner-001",
      name: "م. أحمد الشناوي",
      phone: "01198765432",
      avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=200&q=80",
      verificationStatus: "verified",
      memberSince: "2024",
      responseRate: "98%",
      responseTime: "خلال 15 دقيقة"
    }
  },
  {
    id: "prop-demo-dokki-03",
    title: "شقة سكن طلابي هادئة 2 غرفة بالقرب من مترو الدقي وجامعة القاهرة",
    titleEn: "Quiet 2-Bedroom Student Apartment Near Dokki Metro & Cairo University",
    governorate: "الجيزة",
    city: "الدقي",
    district: "ميدان المساحة",
    address: "شارع مصدق متفرع من محيي الدين أبو العز، الدقي",
    accommodationType: "entire_apartment",
    monthlyPrice: 7000,
    deposit: 7000,
    utilitiesCost: 400,
    bedrooms: 2,
    bathrooms: 1,
    area: 105,
    genderPreference: "female",
    availableBeds: 4,
    totalBeds: 4,
    description: "شقة طلابية راقية ومفروشة بالكامل في موقع ممتاز وحيوي بحي الدقي، قريبة جداً من محطة مترو الدقي وسهولة الوصول لجامعة القاهرة. تحتوي على غرفتين بكل غرفة سريران، صالة استقبال مريحة، حمام نظيف ومطبخ مجهز بالكامل.",
    images: [
      "https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&w=1000&q=80",
      "https://images.unsplash.com/photo-1555854877-bab0e564b8d5?auto=format&fit=crop&w=1000&q=80",
      "https://images.unsplash.com/photo-1484154218962-a197022b5858?auto=format&fit=crop&w=1000&q=80",
      "https://images.unsplash.com/photo-1584622650111-993a426fbf0a?auto=format&fit=crop&w=1000&q=80"
    ],
    amenities: [
      "واي فاي سريع",
      "تكييف سبليت",
      "شرفة بإطلالة هادئة",
      "غسالة ملابس وثلاجة",
      "سخان مياه",
      "حراسة ومصعد"
    ],
    nearbyUniversities: [
      { name: "جامعة القاهرة", distance: "10 دقائق بالمترو والمواصلات" }
    ],
    isFurnished: true,
    isVerified: true,
    status: 'active',
    featured: false,
    status: "active",
    createdAt: "2026-10-10T14:30:00Z",
    owner: {
      id: "usr-owner-001",
      name: "م. أحمد الشناوي",
      phone: "01198765432",
      avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=200&q=80",
      verificationStatus: "verified",
      memberSince: "2024",
      responseRate: "98%",
      responseTime: "خلال 15 دقيقة"
    }
  },
  {
    id: "prop-draft-002",
    title: "مسودة خاصة: غرفة مستقلة قيد التشطيب - طارق عبد السلام",
    titleEn: "Draft Room - Owner B",
    governorate: "الجيزة",
    city: "الدقي",
    district: "ميدان المساحة",
    address: "شارع التحرير",
    accommodationType: "private_room",
    monthlyPrice: 3500,
    deposit: 3500,
    utilitiesCost: 300,
    bedrooms: 1,
    bathrooms: 1,
    area: 30,
    genderPreference: "male",
    availableBeds: 1,
    totalBeds: 1,
    description: "إعلان مسودة خاص بـ طارق عبد السلام غير متاح للعامة.",
    images: [
      "https://images.unsplash.com/photo-1616594039964-ae9021a400a0?auto=format&fit=crop&w=1200&q=80"
    ],
    amenities: ["واي فاي"],
    nearbyUniversities: [{ name: "جامعة القاهرة", distance: "10 دقائق" }],
    isFurnished: true,
    isVerified: false,
    featured: false,
    status: "draft",
    createdAt: "2026-10-26T10:00:00Z",
    owner: {
      id: "usr-owner-002",
      name: "طارق عبد السلام",
      phone: "01211112222",
      avatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&w=200&q=80",
      verificationStatus: "not_started"
    }
  }
];

export const mockPopularAreas = [
  {
    id: "area-1",
    name: "مدينة نصر",
    governorate: "القاهرة",
    listingsCount: 48,
    image: "https://images.unsplash.com/photo-1572252009286-268acec5ca0a?auto=format&fit=crop&w=600&q=80",
    popularFor: "عين شمس، الأزهر، الجامعة العمالية",
    minPrice: 1800
  },
  {
    id: "area-2",
    name: "الدقي والمهندسين",
    governorate: "الجيزة",
    listingsCount: 35,
    image: "https://images.unsplash.com/photo-1568605117036-5fe5e7bab0b7?auto=format&fit=crop&w=600&q=80",
    popularFor: "جامعة القاهرة، كليات الطب والصيدلة",
    minPrice: 2400
  },
  {
    id: "area-3",
    name: "التجمع الخامس",
    governorate: "القاهرة",
    listingsCount: 29,
    image: "https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?auto=format&fit=crop&w=600&q=80",
    popularFor: "الجامعة الأمريكية AUC، الألمانية GUC، الكندية",
    minPrice: 4500
  },
  {
    id: "area-4",
    name: "مدينة 6 أكتوبر",
    governorate: "الجيزة",
    listingsCount: 52,
    image: "https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&w=600&q=80",
    popularFor: "جامعة مصر MUST، جامعة MSA، جامعة 6 أكتوبر",
    minPrice: 1600
  },
  {
    id: "area-5",
    name: "مصر الجديدة",
    governorate: "القاهرة",
    listingsCount: 22,
    image: "https://images.unsplash.com/photo-1582407947304-fd86f028f716?auto=format&fit=crop&w=600&q=80",
    popularFor: "الأكاديمية البحرية، كلية البنات عين شمس",
    minPrice: 2800
  },
  {
    id: "area-6",
    name: "الشيخ زايد",
    governorate: "الجيزة",
    listingsCount: 18,
    image: "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=600&q=80",
    popularFor: "جامعة النيل، فرع جامعة القاهرة بزايد",
    minPrice: 3800
  }
];
