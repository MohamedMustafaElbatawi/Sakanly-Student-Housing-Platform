/**
 * Unified Hierarchical Locations Data for Client Multi-Select Location Picker
 */

export const EGYPTIAN_LOCATIONS = [
  {
    id: 'cairo',
    name: 'القاهرة',
    type: 'governorate',
    districts: [
      { id: 'nasr-city', name: 'مدينة نصر', aliases: ['مدينة نصر', 'الحي السابع', 'الحي الثامن', 'الحي العاشر', 'مكرم عبيد', 'عباس العقاد'] },
      { id: 'heliopolis', name: 'مصر الجديدة', aliases: ['مصر الجديدة', 'الكوربة', 'روكسي', 'الميرغني'] },
      { id: 'maadi', name: 'المعادي', aliases: ['المعادي', 'دجلة', 'المعادي القديمة', 'زهراء المعادي', 'ثكنات المعادي'] },
      { id: 'new-cairo', name: 'التجمع الخامس', aliases: ['التجمع الخامس', 'القاهرة الجديدة', 'التجمع', 'الجامعة الأمريكية'] },
      { id: 'rehab', name: 'الرحاب', aliases: ['الرحاب', 'مدينة الرحاب'] },
      { id: 'madinaty', name: 'مدينتي', aliases: ['مدينتي'] },
      { id: 'downtown', name: 'وسط البلد', aliases: ['وسط البلد', 'التحرير', 'باب اللوق', 'عابدين', 'الجمالية'] },
      { id: 'zamalek', name: 'الزمالك', aliases: ['الزمالك'] },
      { id: 'shoubra', name: 'شبرا', aliases: ['شبرا', 'شبرا مصر', 'الساحل'] },
      { id: 'mokattam', name: 'المقطم', aliases: ['المقطم', 'الهضبة الوسطى'] },
      { id: 'ain-shams', name: 'عين شمس', aliases: ['عين شمس', 'العباسية', 'حلمية الزيتون'] },
      { id: 'helwan', name: 'حلوان', aliases: ['حلوان', 'جامعة حلوان', 'المعصرة'] },
    ],
  },
  {
    id: 'giza',
    name: 'الجيزة',
    type: 'governorate',
    districts: [
      { id: 'sheikh-zayed', name: 'الشيخ زايد', aliases: ['الشيخ زايد', 'مدينة الشيخ زايد', 'زايد'] },
      { id: 'october', name: '6 أكتوبر', aliases: ['6 أكتوبر', 'مدينة 6 أكتوبر', 'أكتوبر', 'الحصري', 'جامعة 6 أكتوبر', 'جامعة مصر'] },
      { id: 'mohandessin', name: 'المهندسين', aliases: ['المهندسين', 'جامعة الدول', 'لبنان'] },
      { id: 'dokki', name: 'الدقي', aliases: ['الدقي', 'مصدق', 'محي الدين', 'التحرير (الدقي)', 'شارع مصدق'] },
      { id: 'faisal', name: 'فيصل', aliases: ['فيصل', 'شارع فيصل', 'العشرين'] },
      { id: 'haram', name: 'الهرم', aliases: ['الهرم', 'شارع الهرم', 'مشعل', 'الرماية'] },
      { id: 'agouza', name: 'العجوزة', aliases: ['العجوزة', 'الكورنيش (العجوزة)'] },
    ],
  },
  {
    id: 'alexandria',
    name: 'الإسكندرية',
    type: 'governorate',
    districts: [
      { id: 'smouha', name: 'سموحة', aliases: ['سموحة'] },
      { id: 'sidi-beshr', name: 'سيدي بشر', aliases: ['سيدي بشر', 'خالد بن الوليد'] },
      { id: 'ibrahimiya', name: 'الإبراهيمية', aliases: ['الإبراهيمية', 'كامب شيزار'] },
      { id: 'asafra', name: 'العصافرة', aliases: ['العصافرة'] },
      { id: 'miami', name: 'ميامي', aliases: ['ميامي'] },
      { id: 'lauran', name: 'لوران', aliases: ['لوران'] },
      { id: 'shatby', name: 'الشاطبي', aliases: ['الشاطبي', 'مجمع الكليات'] },
    ],
  },
  {
    id: 'qalyubia',
    name: 'القليوبية',
    type: 'governorate',
    districts: [
      { id: 'banha', name: 'بنها', aliases: ['بنها', 'جامعة بنها'] },
      { id: 'shubra-el-kheima', name: 'شبرا الخيمة', aliases: ['شبرا الخيمة'] },
      { id: 'obour', name: 'العبور', aliases: ['العبور', 'مدينة العبور', 'جامعة بنها بالعبور'] },
      { id: 'qalyub', name: 'قليوب', aliases: ['قليوب'] },
    ],
  },
  {
    id: 'sharqia',
    name: 'الشرقية',
    type: 'governorate',
    districts: [
      { id: 'zagazig', name: 'الزقازيق', aliases: ['الزقازيق', 'جامعة الزقازيق'] },
      { id: 'tenth-of-ramadan', name: 'العاشر من رمضان', aliases: ['العاشر من رمضان', 'العاشر'] },
      { id: 'belbeis', name: 'بلبيس', aliases: ['بلبيس'] },
    ],
  },
  {
    id: 'gharbia',
    name: 'الغربية',
    type: 'governorate',
    districts: [
      { id: 'tanta', name: 'طنطا', aliases: ['طنطا', 'جامعة طنطا', 'المحطة طنطا'] },
      { id: 'el-mahalla', name: 'المحلة الكبرى', aliases: ['المحلة الكبرى', 'المحلة'] },
    ],
  },
  {
    id: 'menofia',
    name: 'المنوفية',
    type: 'governorate',
    districts: [
      { id: 'shibin-el-kom', name: 'شبين الكوم', aliases: ['شبين الكوم', 'جامعة المنوفية'] },
      { id: 'menouf', name: 'منوف', aliases: ['منوف', 'هندسة منوف'] },
      { id: 'sadat-city', name: 'مدينة السادات', aliases: ['مدينة السادات', 'السادات', 'جامعة السادات'] },
      { id: 'quesna', name: 'قويسنا', aliases: ['قويسنا'] },
    ],
  },
];

export const getAllGovernorateNames = () => EGYPTIAN_LOCATIONS.map(g => g.name);

export const isGovernorate = (name) => {
  if (!name || typeof name !== 'string') return false;
  return EGYPTIAN_LOCATIONS.some(g => g.name === name.trim());
};

export const normalizeArabicText = (text) => {
  if (!text || typeof text !== 'string') return '';
  return text
    .trim()
    .toLowerCase()
    .replace(/[أإآ]/g, 'ا')
    .replace(/ة/g, 'ه')
    .replace(/ى/g, 'ي')
    .replace(/[\u064B-\u065F]/g, '');
};

export const getGovernorateByName = (name) => {
  if (!name || typeof name !== 'string') return null;
  const clean = name.trim();
  return EGYPTIAN_LOCATIONS.find(g => g.name === clean) || null;
};

export const isMatchingLocation = (listing, locationQuery) => {
  if (!listing || !locationQuery) return false;
  const queryClean = locationQuery.trim();
  const normalizedQuery = normalizeArabicText(queryClean);

  const gov = getGovernorateByName(queryClean);
  if (gov) {
    if (listing.governorate && normalizeArabicText(listing.governorate) === normalizedQuery) {
      return true;
    }
    const districtMatches = gov.districts.some(d => {
      const allTokens = [d.name, ...(d.aliases || [])].map(normalizeArabicText);
      const listingTokens = [listing.city, listing.district, listing.address, listing.title]
        .filter(Boolean)
        .map(normalizeArabicText);
      return allTokens.some(token => listingTokens.some(lt => lt.includes(token)));
    });
    if (districtMatches) return true;
  }

  let aliases = [queryClean];
  for (const g of EGYPTIAN_LOCATIONS) {
    const foundDistrict = g.districts.find(d => normalizeArabicText(d.name) === normalizedQuery);
    if (foundDistrict && foundDistrict.aliases) {
      aliases = [...aliases, ...foundDistrict.aliases];
    }
  }

  const normalizedAliases = aliases.map(normalizeArabicText);
  const targetFields = [
    listing.city,
    listing.district,
    listing.address,
    listing.title,
    listing.governorate,
  ].filter(Boolean).map(normalizeArabicText);

  return normalizedAliases.some(alias =>
    targetFields.some(field => field.includes(alias))
  );
};

export const matchesAnyLocation = (listing, locationsList) => {
  if (!locationsList || !Array.isArray(locationsList) || locationsList.length === 0) {
    return true;
  }
  const validLocations = locationsList.filter(l => typeof l === 'string' && l.trim().length > 0);
  if (validLocations.length === 0) return true;

  return validLocations.some(loc => isMatchingLocation(listing, loc));
};

