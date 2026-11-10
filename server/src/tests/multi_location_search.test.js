import { config } from '../config/index.js';
import { connectDB, isMongoConnected } from '../config/database.js';
import { ListingsService } from '../services/listingsService.js';
import { Listing } from '../models/Listing.js';
import {
  EGYPTIAN_LOCATIONS,
  getAllGovernorateNames,
  isGovernorate,
  isMatchingLocation,
  matchesAnyLocation,
  normalizeListingLocation,
  normalizeArabicText,
} from '../data/locationsData.js';

console.log('🧪 Starting Multi-Select Location Picker & Search Integration Test Suite...\n');

let passedTests = 0;
let totalTests = 0;

const assert = (condition, description) => {
  totalTests++;
  if (condition) {
    console.log(`✅ [PASS ${totalTests}] ${description}`);
    passedTests++;
  } else {
    console.error(`❌ [FAIL ${totalTests}] ${description}`);
    process.exitCode = 1;
  }
};

const runSuite = async () => {
  const mongoConnected = await connectDB();
  assert(mongoConnected === true, 'MongoDB Atlas connection active for test suite');

  // -------------------------------------------------------------
  // Test 1: Locations Hierarchy Taxonomy Verification
  // -------------------------------------------------------------
  console.log('\n--- 1. Locations Hierarchy & Taxonomy ---');
  const govNames = getAllGovernorateNames();
  assert(govNames.includes('القاهرة'), 'Governorate "القاهرة" exists in taxonomy');
  assert(govNames.includes('الجيزة'), 'Governorate "الجيزة" exists in taxonomy');
  assert(govNames.includes('الإسكندرية'), 'Governorate "الإسكندرية" exists in taxonomy');
  assert(govNames.includes('القليوبية'), 'Governorate "القليوبية" exists in taxonomy');
  assert(govNames.includes('الشرقية'), 'Governorate "الشرقية" exists in taxonomy');
  assert(govNames.includes('الغربية'), 'Governorate "الغربية" exists in taxonomy');
  assert(govNames.includes('المنوفية'), 'Governorate "المنوفية" exists in taxonomy');

  const cairoGov = EGYPTIAN_LOCATIONS.find(g => g.name === 'القاهرة');
  const cairoDistrictNames = cairoGov.districts.map(d => d.name);
  assert(cairoDistrictNames.includes('مدينة نصر'), 'Cairo has "مدينة نصر"');
  assert(cairoDistrictNames.includes('المعادي'), 'Cairo has "المعادي"');
  assert(cairoDistrictNames.includes('التجمع الخامس'), 'Cairo has "التجمع الخامس"');
  assert(cairoDistrictNames.includes('مصر الجديدة'), 'Cairo has "مصر الجديدة"');

  const gizaGov = EGYPTIAN_LOCATIONS.find(g => g.name === 'الجيزة');
  const gizaDistrictNames = gizaGov.districts.map(d => d.name);
  assert(gizaDistrictNames.includes('الدقي'), 'Giza has "الدقي"');
  assert(gizaDistrictNames.includes('الشيخ زايد'), 'Giza has "الشيخ زايد"');
  assert(gizaDistrictNames.includes('6 أكتوبر'), 'Giza has "6 أكتوبر"');
  assert(gizaDistrictNames.includes('المهندسين'), 'Giza has "المهندسين"');

  // -------------------------------------------------------------
  // Test 2: Text Normalization (Alef, Taa Marbuta, Tashkeel)
  // -------------------------------------------------------------
  console.log('\n--- 2. Arabic Text Normalization ---');
  assert(normalizeArabicText('القاهرة') === 'القاهره', 'Normalizes Taa Marbuta');
  assert(normalizeArabicText('إسكندرية') === 'اسكندريه', 'Normalizes Alef with Hamza');
  assert(normalizeArabicText('مَدِينَة نَصْر') === 'مدينه نصر', 'Removes Tashkeel');

  // -------------------------------------------------------------
  // Test 3: Legacy Listing Location Normalization
  // -------------------------------------------------------------
  console.log('\n--- 3. Legacy Listing Location Normalization ---');
  const legacyListing1 = {
    title: 'شقة طلابية بالحي السابع',
    city: 'مدينة نصر',
    district: '',
    governorate: '', // empty governorate
  };
  const normalized1 = normalizeListingLocation(legacyListing1);
  assert(normalized1.governorate === 'القاهرة', 'Inferred Cairo governorate for Nasr City');

  const legacyListing2 = {
    title: 'استوديو بالقرب من ميدان مصدق',
    city: 'الدقي',
    district: 'مصدق',
    governorate: '',
  };
  const normalized2 = normalizeListingLocation(legacyListing2);
  assert(normalized2.governorate === 'الجيزة', 'Inferred Giza governorate for Dokki');

  // -------------------------------------------------------------
  // Test 4: Single Location Query (e.g. "مدينة نصر")
  // -------------------------------------------------------------
  console.log('\n--- 4. Single Location Filtering ---');
  const testNasrListing = {
    title: 'شقة راقية بجوار عباس العقاد',
    city: 'مدينة نصر',
    district: 'الحي السابع',
    governorate: 'القاهرة',
    status: 'active',
  };
  const testDokkiListing = {
    title: 'غرفة خاصة بشارع مصدق',
    city: 'الدقي',
    district: 'شارع مصدق',
    governorate: 'الجيزة',
    status: 'active',
  };

  assert(isMatchingLocation(testNasrListing, 'مدينة نصر') === true, 'Matches "مدينة نصر"');
  assert(isMatchingLocation(testDokkiListing, 'مدينة نصر') === false, 'Does not match "مدينة نصر" for Dokki');

  // -------------------------------------------------------------
  // Test 5: Multi-Location Query with OR Logic (e.g. "مدينة نصر" OR "الدقي")
  // -------------------------------------------------------------
  console.log('\n--- 5. Multi-Location Filtering with OR Logic ---');
  const selectedLocations = ['مدينة نصر', 'الدقي'];
  assert(matchesAnyLocation(testNasrListing, selectedLocations) === true, 'Matches first location in OR list');
  assert(matchesAnyLocation(testDokkiListing, selectedLocations) === true, 'Matches second location in OR list');

  const testAlexListing = {
    title: 'شقة أمام مجمع الكليات',
    city: 'سموحة',
    district: 'سموحة',
    governorate: 'الإسكندرية',
    status: 'active',
  };
  assert(matchesAnyLocation(testAlexListing, selectedLocations) === false, 'Excludes Alexandria property when Cairo/Giza selected');

  // -------------------------------------------------------------
  // Test 6: Whole Governorate Selection (e.g. "القاهرة")
  // -------------------------------------------------------------
  console.log('\n--- 6. Whole Governorate Selection Matching All Its Districts ---');
  const testMaadiListing = {
    title: 'شقة بشارع دجلة',
    city: 'المعادي',
    district: 'دجلة',
    governorate: 'القاهرة',
    status: 'active',
  };
  const testNewCairoListing = {
    title: 'فيلا قريبة من الجامعة الأمريكية',
    city: 'التجمع الخامس',
    district: 'الحي الأول',
    governorate: 'القاهرة',
    status: 'active',
  };

  assert(matchesAnyLocation(testNasrListing, ['القاهرة']) === true, 'Selecting "القاهرة" matches Nasr City');
  assert(matchesAnyLocation(testMaadiListing, ['القاهرة']) === true, 'Selecting "القاهرة" matches Maadi');
  assert(matchesAnyLocation(testNewCairoListing, ['القاهرة']) === true, 'Selecting "القاهرة" matches New Cairo / Tagamoa');
  assert(matchesAnyLocation(testDokkiListing, ['القاهرة']) === false, 'Selecting "القاهرة" excludes Dokki (Giza)');

  // -------------------------------------------------------------
  // Test 7: Alias Mapping Support (e.g. "6 أكتوبر", "التجمع الخامس")
  // -------------------------------------------------------------
  console.log('\n--- 7. Alias Mapping Support ---');
  const testOctoberProp = {
    title: 'سكن شبابي الحي الثاني',
    city: 'مدينة 6 أكتوبر',
    district: 'الحصري',
    governorate: 'الجيزة',
  };
  assert(isMatchingLocation(testOctoberProp, '6 أكتوبر') === true, 'Matches "مدينة 6 أكتوبر" when searching "6 أكتوبر"');

  const testZayedProp = {
    title: 'استوديو راقي بالحي الثامن',
    city: 'مدينة الشيخ زايد',
    district: 'الحي الثامن',
    governorate: 'الجيزة',
  };
  assert(isMatchingLocation(testZayedProp, 'الشيخ زايد') === true, 'Matches "مدينة الشيخ زايد" when searching "الشيخ زايد"');

  // -------------------------------------------------------------
  // Test 8: Empty / Cleared Location Filter Returns All
  // -------------------------------------------------------------
  console.log('\n--- 8. Empty / Cleared Location Returns All Properties ---');
  assert(matchesAnyLocation(testNasrListing, []) === true, 'Empty array returns true (shows all)');
  assert(matchesAnyLocation(testDokkiListing, null) === true, 'Null locations returns true (shows all)');

  // -------------------------------------------------------------
  // Test 9: ListingsService.getAll with Multi-Location Queries
  // -------------------------------------------------------------
  console.log('\n--- 9. ListingsService.getAll Real Filter Verification ---');
  const allActive = ListingsService.getAll({ status: 'active' });
  assert(allActive.length > 0, `ListingsService loaded ${allActive.length} active listings`);

  // Query by single location
  const nasrResults = ListingsService.getAll({ locations: 'مدينة نصر' });
  assert(nasrResults.length > 0, 'ListingsService returned results for "مدينة نصر"');
  assert(nasrResults.every(r => matchesAnyLocation(r, ['مدينة نصر'])), 'All returned items match "مدينة نصر"');

  // Query by multi locations array
  const multiResults = ListingsService.getAll({ locations: ['مدينة نصر', 'الدقي'] });
  assert(multiResults.length >= nasrResults.length, 'Multi-location returns equal or more results (OR union)');
  assert(multiResults.some(r => isMatchingLocation(r, 'مدينة نصر')), 'Multi-location includes Nasr City items');

  // Combined with other filters (accommodationType and maxPrice)
  const filteredWithBudget = ListingsService.getAll({
    locations: ['مدينة نصر', 'الدقي'],
    accommodationType: 'entire_apartment',
    maxPrice: 15000,
  });
  assert(
    filteredWithBudget.every(r => r.accommodationType === 'entire_apartment' && r.monthlyPrice <= 15000),
    'Location filter preserves accommodationType and maxPrice filters without breakage'
  );

  // -------------------------------------------------------------
  // Test 10: Real MongoDB Atlas Integration & Creation
  // -------------------------------------------------------------
  console.log('\n--- 10. Real MongoDB Atlas Creation with Normalized Location ---');
  const testPropId = `prop-location-test-${Date.now()}`;
  const createdTestProp = await ListingsService.createAsync({
    id: testPropId,
    title: 'شقة تجريبية لاختبار فلتر المواقع المتعددة',
    city: 'المعادي',
    district: 'دجلة',
    accommodationType: 'entire_apartment',
    monthlyPrice: 9500,
    deposit: 9500,
    bedrooms: 2,
    bathrooms: 1,
    totalBeds: 2,
    availableBeds: 2,
    status: 'active',
    owner: { id: 'usr-owner-001', name: 'أحمد محمود' },
  });

  assert(createdTestProp.governorate === 'القاهرة', 'MongoDB listing automatically normalized with governorate "القاهرة"');

  const verifyFound = ListingsService.getAll({ locations: ['المعادي'] }).find(p => p.id === testPropId);
  assert(Boolean(verifyFound), 'Newly created property is findable via multi-location search');

  // Cleanup test property from MongoDB
  try {
    await Listing.deleteOne({ id: testPropId });
    console.log('✅ Cleaned up temporary test listing from MongoDB Atlas');
  } catch (err) {
    console.log('Cleanup notice:', err.message);
  }

  console.log(`\n========================================`);
  console.log(`🎉 TEST RESULTS: ${passedTests}/${totalTests} Passed`);
  console.log(`========================================\n`);

  if (passedTests === totalTests) {
    process.exit(0);
  } else {
    process.exit(1);
  }
};

runSuite().catch(err => {
  console.error('Fatal test error:', err);
  process.exit(1);
});

