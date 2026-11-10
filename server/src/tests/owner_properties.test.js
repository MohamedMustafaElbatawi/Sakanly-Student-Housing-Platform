import { config } from '../config/index.js';
import { connectDB, isMongoConnected, disconnectDB } from '../config/database.js';
import { ListingsService } from '../services/listingsService.js';
import { Listing } from '../models/Listing.js';
import { runMigrations } from '../services/migrationService.js';

console.log('🧪 Starting Owner Properties ("عقاراتي") Suite...\n');

let passedTests = 0;
let totalTests = 0;

const assert = (condition, description) => {
  totalTests++;
  if (condition) {
    console.log(`✅ [PASS] ${description}`);
    passedTests++;
  } else {
    console.error(`❌ [FAIL] ${description}`);
    process.exitCode = 1;
  }
};

const run = async () => {
  await connectDB();
  await runMigrations();

  const demoOwnerId = 'usr-owner-001';

  console.log('\n--- 1. Testing Owner Property Retrieval & Data Isolation ---');
  const ownerListings = await ListingsService.getByOwner(demoOwnerId);
  assert(Array.isArray(ownerListings), 'ListingsService.getByOwner returns an array');
  assert(ownerListings.length >= 3, `Owner has at least 3 listings (found: ${ownerListings.length})`);

  let dataLeakage = false;
  for (const l of ownerListings) {
    if (l.owner?.id !== demoOwnerId) {
      dataLeakage = true;
    }
  }
  assert(!dataLeakage, 'Strict Data Isolation: All returned listings belong strictly to usr-owner-001');

  console.log('\n--- 2. Testing Cairo Student Housing Demo Properties ---');
  // Property 1: Nasr City
  const nasrProp = ownerListings.find(p => p.id === 'prop-demo-nasr-01');
  assert(Boolean(nasrProp), 'Property 1 (Nasr City) exists');
  assert(nasrProp?.city === 'مدينة نصر', 'Property 1 located in Nasr City');
  assert(nasrProp?.accommodationType === 'entire_apartment', 'Property 1 is entire_apartment');
  assert(nasrProp?.monthlyPrice === 9000, 'Property 1 monthly price is 9000 EGP');
  assert(nasrProp?.bedrooms === 3, 'Property 1 has 3 bedrooms');
  assert(nasrProp?.bathrooms === 2, 'Property 1 has 2 bathrooms');
  assert(nasrProp?.totalBeds === 6, 'Property 1 has 6 total beds');
  assert(nasrProp?.availableBeds === 6, 'Property 1 has 6 available beds');
  assert(Array.isArray(nasrProp?.images) && nasrProp.images.length >= 4, 'Property 1 has at least 4 photos');

  // Property 2: Ain Shams Shared Room
  const shamsProp = ownerListings.find(p => p.id === 'prop-demo-shams-02');
  assert(Boolean(shamsProp), 'Property 2 (Ain Shams Shared Room) exists');
  assert(shamsProp?.accommodationType === 'shared_room', 'Property 2 is shared_room');
  assert(shamsProp?.monthlyPrice === 2500, 'Property 2 monthly price is 2500 EGP/student');
  assert(shamsProp?.totalBeds === 2, 'Property 2 has 2 beds');
  assert(shamsProp?.availableBeds === 2, 'Property 2 has 2 available beds');
  assert(Array.isArray(shamsProp?.images) && shamsProp.images.length >= 3, 'Property 2 has valid photos');

  // Property 3: Dokki Apartment
  const dokkiProp = ownerListings.find(p => p.id === 'prop-demo-dokki-03');
  assert(Boolean(dokkiProp), 'Property 3 (Dokki Apartment) exists');
  assert(dokkiProp?.city === 'الدقي', 'Property 3 is located in Dokki');
  assert(dokkiProp?.monthlyPrice === 7000, 'Property 3 monthly price is 7000 EGP');
  assert(dokkiProp?.bedrooms === 2, 'Property 3 has 2 bedrooms');
  assert(dokkiProp?.bathrooms === 1, 'Property 3 has 1 bathroom');
  assert(dokkiProp?.totalBeds === 4, 'Property 3 has 4 beds');
  assert(dokkiProp?.availableBeds === 4, 'Property 3 has 4 available beds');

  console.log('\n--- 3. Testing Statistics Breakdown by Owner ---');
  const stats = await ListingsService.getStatsByOwner(demoOwnerId);
  assert(typeof stats.total === 'number' && stats.total >= 3, 'Stats total count >= 3');
  assert(typeof stats.active === 'number' && stats.active >= 3, 'Stats active count >= 3');
  assert(typeof stats.draft === 'number', 'Stats draft count is a valid number');

  console.log('\n--- 4. Testing Property CRUD Lifecycle for Owner ---');
  const tempId = `prop-test-crud-${Date.now()}`;
  const created = ListingsService.create({
    id: tempId,
    title: 'شقة تجريبية جديدة لإجراء الفحص',
    city: 'المعادي',
    district: 'دجلة',
    accommodationType: 'entire_apartment',
    monthlyPrice: 6500,
    deposit: 6500,
    bedrooms: 2,
    bathrooms: 1,
    totalBeds: 3,
    availableBeds: 3,
    status: 'draft',
    images: [
      'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1595526114035-0d45ed16cfbf?auto=format&fit=crop&w=1000&q=80',
    ],
    owner: {
      id: demoOwnerId,
      name: 'م. أحمد الشناوي',
    },
  });
  assert(created.id === tempId, 'Property created successfully');

  // Status updates
  ListingsService.updateStatus(tempId, 'active');
  let fetched = ListingsService.getById(tempId);
  assert(fetched.status === 'active', 'Property status updated to active');

  ListingsService.updateStatus(tempId, 'paused');
  fetched = ListingsService.getById(tempId);
  assert(fetched.status === 'paused', 'Property status updated to paused');

  // Editing preserving photos
  ListingsService.update(tempId, {
    monthlyPrice: 6800,
    title: 'شقة تجريبية معدلة',
  });
  fetched = ListingsService.getById(tempId);
  assert(fetched.monthlyPrice === 6800, 'Monthly price updated');
  assert(fetched.images.length === 2, 'Multi-image gallery preserved during update');

  // Deletion
  const deleted = ListingsService.delete(tempId);
  assert(deleted === true, 'Property deleted cleanly');
  assert(ListingsService.getById(tempId) === null, 'Deleted property no longer retrievable');

  await disconnectDB();

  console.log('\n===============================================');
  console.log(`📊 Owner Properties Suite: ${passedTests}/${totalTests} tests passed (${Math.round((passedTests/totalTests)*100)}%)`);
  console.log('===============================================');
  if (passedTests === totalTests) {
    console.log('🎉 All owner properties tests passed successfully!');
  } else {
    process.exitCode = 1;
  }
};

run().catch(err => {
  console.error('Fatal test error:', err);
  process.exitCode = 1;
});
