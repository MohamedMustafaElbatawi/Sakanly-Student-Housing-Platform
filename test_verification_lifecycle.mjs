import assert from 'node:assert';

const API_BASE = 'http://localhost:5000/api/v1';

async function request(endpoint, options = {}) {
  const url = `${API_BASE}${endpoint}`;
  const res = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers || {})
    }
  });
  const data = await res.json().catch(() => null);
  return { status: res.status, ok: res.ok, data };
}

async function login(email, password = '123456') {
  const res = await request('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password })
  });
  if (!res.ok) {
    throw new Error(`Login failed for ${email}: ${JSON.stringify(res.data)}`);
  }
  return { token: res.data.data.token, user: res.data.data.user };
}

async function runTests() {
  console.log('====================================================');
  console.log('🧪 Starting Verification Tests for Sakanly Security');
  console.log('====================================================\n');

  // 1. Student credentials login
  console.log('--- Test 1: طالب يحاول إنشاء عقار أو نشره ---');
  const studentAuth = await login('student@sakanly.com');
  console.log('✓ Student logged in:', studentAuth.user.email, 'Role:', studentAuth.user.role);

  const studentCreateRes = await request('/listings', {
    method: 'POST',
    headers: { Authorization: `Bearer ${studentAuth.token}` },
    body: JSON.stringify({
      title: 'محاولة نشر غير مصرح بها من طالب',
      accommodationType: 'entire_apartment',
      monthlyPrice: 3000,
      city: 'القاهرة',
      status: 'active'
    })
  });
  console.log('Student create response status:', studentCreateRes.status, studentCreateRes.data?.message);
  assert.strictEqual(studentCreateRes.status, 403, 'Student must be rejected with 403');
  assert.strictEqual(studentCreateRes.data?.code, 'ROLE_FORBIDDEN');
  console.log('✅ Test 1 PASSED: الطالب ممنوع نهائياً من إنشاء العقارات (403 ROLE_FORBIDDEN).\n');

  // 2 & 3: Unverified owner trying to publish via API
  console.log('--- Test 2 & 3: مالك غير موثق يحاول النشر مباشرة عبر API ---');
  const freshUnverifiedEmail = `unverified.${Date.now()}@sakanly.com`;
  const regRes = await request('/auth/register', {
    method: 'POST',
    body: JSON.stringify({
      fullName: 'مالك غير موثق اختباري',
      email: freshUnverifiedEmail,
      password: '123456',
      role: 'owner'
    })
  });
  const unverifiedAuth = { token: regRes.data.data.token, user: regRes.data.data.user };
  console.log('✓ Unverified owner created & logged in:', unverifiedAuth.user.email, 'Status:', unverifiedAuth.user.verificationStatus);

  const unverifiedPublishRes = await request('/listings', {
    method: 'POST',
    headers: { Authorization: `Bearer ${unverifiedAuth.token}` },
    body: JSON.stringify({
      title: 'شقة معروضة من مالك غير موثق',
      accommodationType: 'entire_apartment',
      monthlyPrice: 4000,
      city: 'الجيزة',
      status: 'active'
    })
  });
  console.log('Unverified direct publish status:', unverifiedPublishRes.status, unverifiedPublishRes.data?.message);
  assert.strictEqual(unverifiedPublishRes.status, 403, 'Unverified owner must be blocked from active publishing');
  assert.strictEqual(unverifiedPublishRes.data?.code, 'OWNER_NOT_VERIFIED');
  console.log('✅ Test 2 & 3 PASSED: المالك غير الموثق ممنوع من النشر عبر API (403 OWNER_NOT_VERIFIED).\n');

  // 4: Owner pending review trying to publish
  console.log('--- Test 4: مالك قيد المراجعة يحاول النشر ---');
  const pendingAuth = await login('owner.pending@sakanly.com');
  console.log('✓ Pending owner logged in:', pendingAuth.user.email, 'Status:', pendingAuth.user.verificationStatus);

  const pendingPublishRes = await request('/listings', {
    method: 'POST',
    headers: { Authorization: `Bearer ${pendingAuth.token}` },
    body: JSON.stringify({
      title: 'شقة مالك قيد المراجعة',
      accommodationType: 'entire_apartment',
      monthlyPrice: 4500,
      city: 'القاهرة',
      status: 'active'
    })
  });
  console.log('Pending owner publish status:', pendingPublishRes.status, pendingPublishRes.data?.message);
  assert.strictEqual(pendingPublishRes.status, 403);
  assert.strictEqual(pendingPublishRes.data?.code, 'OWNER_NOT_VERIFIED');
  console.log('✅ Test 4 PASSED: المالك قيد المراجعة ممنوع من النشر حتى استكمال الاعتماد.\n');

  // 5: Rejected owner trying to publish
  console.log('--- Test 5: مالك مرفوض يحاول النشر ---');
  const rejectedAuth = await login('owner.rejected@sakanly.com');
  console.log('✓ Rejected owner logged in:', rejectedAuth.user.email, 'Status:', rejectedAuth.user.verificationStatus, 'Reason:', rejectedAuth.user.rejectionReason);

  const rejectedPublishRes = await request('/listings', {
    method: 'POST',
    headers: { Authorization: `Bearer ${rejectedAuth.token}` },
    body: JSON.stringify({
      title: 'شقة مالك مرفوض',
      accommodationType: 'entire_apartment',
      monthlyPrice: 5000,
      city: 'القاهرة',
      status: 'active'
    })
  });
  console.log('Rejected owner publish status:', rejectedPublishRes.status, rejectedPublishRes.data?.message);
  assert.strictEqual(rejectedPublishRes.status, 403);
  assert.strictEqual(rejectedPublishRes.data?.code, 'OWNER_NOT_VERIFIED');
  console.log('✅ Test 5 PASSED: المالك المرفوض ممنوع من النشر.\n');

  // 6: Verified owner publishing
  console.log('--- Test 6: مالك معتمد يحاول النشر ---');
  const verifiedAuth = await login('owner@sakanly.com');
  console.log('✓ Verified owner logged in:', verifiedAuth.user.email, 'Status:', verifiedAuth.user.verificationStatus, 'Verified:', verifiedAuth.user.isVerified);

  const verifiedPublishRes = await request('/listings', {
    method: 'POST',
    headers: { Authorization: `Bearer ${verifiedAuth.token}` },
    body: JSON.stringify({
      title: 'شقة طلابية معتمدة من مالك موثق',
      accommodationType: 'entire_apartment',
      monthlyPrice: 3500,
      city: 'مدينة نصر',
      district: 'الحي السابع',
      status: 'active'
    })
  });
  console.log('Verified owner publish status:', verifiedPublishRes.status, verifiedPublishRes.data?.message);
  assert.strictEqual(verifiedPublishRes.status, 201, 'Verified owner should publish successfully');
  const publishedListing = verifiedPublishRes.data.data.listing || verifiedPublishRes.data.data;
  console.log('✅ Test 6 PASSED: المالك المعتمد يتمكن من النشر بنجاح برقم إعلان:', publishedListing.id, '\n');

  // 7: User trying to forge role or verification status in request
  console.log('--- Test 7: مستخدم يحاول تزوير دوره أو حالة توثيقه ---');
  // Attempt 7a: Registration with role: 'admin' or spoofed verificationStatus
  const registerForgedRes = await request('/auth/register', {
    method: 'POST',
    body: JSON.stringify({
      fullName: 'هاكر متسلل',
      email: `forged-${Date.now()}@test.com`,
      password: 'password123',
      role: 'admin', // Trying to become admin
      isVerified: true, // Trying to self-verify
      verificationStatus: 'verified'
    })
  });
  console.log('Register spoofed role response:', registerForgedRes.status, 'Assigned role:', registerForgedRes.data?.data?.user?.role, 'Status:', registerForgedRes.data?.data?.user?.verificationStatus);
  assert.strictEqual(registerForgedRes.data?.data?.user?.role, 'student', 'Spoofed admin role must default safely to student');
  assert.strictEqual(registerForgedRes.data?.data?.user?.verificationStatus, 'not_applicable', 'Spoofed verification must be ignored');

  // Attempt 7b: Registering as owner -> must never be verified on start
  const registerOwnerRes = await request('/auth/register', {
    method: 'POST',
    body: JSON.stringify({
      fullName: 'مالك جديد',
      email: `newowner-${Date.now()}@test.com`,
      password: 'password123',
      role: 'owner',
      isVerified: true, // Spoofing verification
      verificationStatus: 'verified'
    })
  });
  console.log('Register owner response:', registerOwnerRes.status, 'Assigned role:', registerOwnerRes.data?.data?.user?.role, 'Status:', registerOwnerRes.data?.data?.user?.verificationStatus, 'isVerified:', registerOwnerRes.data?.data?.user?.isVerified);
  assert.strictEqual(registerOwnerRes.data?.data?.user?.role, 'owner');
  assert.strictEqual(registerOwnerRes.data?.data?.user?.verificationStatus, 'not_started');
  assert.strictEqual(registerOwnerRes.data?.data?.user?.isVerified, false);
  console.log('✅ Test 7 PASSED: منع تزوير الأدوار وحالات التوثيق من الـ Frontend.\n');

  // 8: Draft property before owner verification and attempt to publish later
  console.log('--- Test 8: عقار مسودة قبل اعتماد المالك ومحاولة نشره لاحقاً ---');
  // 8a: Unverified owner saves property as draft
  const draftCreateRes = await request('/listings', {
    method: 'POST',
    headers: { Authorization: `Bearer ${unverifiedAuth.token}` },
    body: JSON.stringify({
      title: 'شقة مسودة خاصة بالمالك غير الموثق',
      accommodationType: 'entire_apartment',
      monthlyPrice: 3200,
      city: 'القاهرة',
      status: 'draft' // Saving as draft
    })
  });
  console.log('Draft creation status:', draftCreateRes.status, draftCreateRes.data?.message);
  assert.strictEqual(draftCreateRes.status, 201, 'Unverified owner can save draft');
  const draftListing = draftCreateRes.data.data.listing || draftCreateRes.data.data;
  assert.strictEqual(draftListing.status, 'draft', 'Must have status draft');
  console.log('✓ Draft listing created successfully with ID:', draftListing.id);

  // 8b: Ensure draft is NOT visible in public search for students
  const publicListingsRes = await request('/listings');
  const isDraftVisibleInPublic = publicListingsRes.data.data.listings.some(l => l.id === draftListing.id);
  console.log('Is draft visible in public browse search?', isDraftVisibleInPublic);
  assert.strictEqual(isDraftVisibleInPublic, false, 'Draft must NOT be returned in public search');
  console.log('✓ Verified: المسودة مخفية تماماً عن تصفح الطلاب العام.');

  // 8c: Unverified owner attempts to publish the draft via PATCH status -> should be blocked with 403
  const patchDraftRes = await request(`/listings/${draftListing.id}/status`, {
    method: 'PATCH',
    headers: { Authorization: `Bearer ${unverifiedAuth.token}` },
    body: JSON.stringify({ status: 'active' })
  });
  console.log('Attempt to activate draft while unverified status:', patchDraftRes.status, patchDraftRes.data?.message);
  assert.strictEqual(patchDraftRes.status, 403);
  assert.strictEqual(patchDraftRes.data?.code, 'OWNER_NOT_VERIFIED');
  console.log('✓ Verified: محاولة تغيير حالة المسودة إلى active مرفوضة بـ 403 OWNER_NOT_VERIFIED.');

  // 8d: Owner submits verification documents
  const submitVerifRes = await request('/auth/verification/submit', {
    method: 'POST',
    headers: { Authorization: `Bearer ${unverifiedAuth.token}` },
    body: JSON.stringify({
      nationalIdNumber: '29901011234567',
      ownershipDocumentNumber: 'DOC-998877',
      documentType: 'عقد ملكية مسجل'
    })
  });
  console.log('Owner verification submitted:', submitVerifRes.data?.data?.user?.verificationStatus);
  assert.strictEqual(submitVerifRes.data?.data?.user?.verificationStatus, 'pending_review');

  // 8e: Reviewer approves verification
  const approveVerifRes = await request('/auth/verification/review', {
    method: 'POST',
    headers: { Authorization: `Bearer ${unverifiedAuth.token}` },
    body: JSON.stringify({
      userId: unverifiedAuth.user.id,
      status: 'verified'
    })
  });
  console.log('Reviewer approved verification:', approveVerifRes.data?.data?.user?.verificationStatus);
  assert.strictEqual(approveVerifRes.data?.data?.user?.verificationStatus, 'verified');
  assert.strictEqual(approveVerifRes.data?.data?.user?.isVerified, true);

  // 8f: Now that owner is verified, activate the draft!
  const activateDraftAfterApprovalRes = await request(`/listings/${draftListing.id}/status`, {
    method: 'PATCH',
    headers: { Authorization: `Bearer ${unverifiedAuth.token}` },
    body: JSON.stringify({ status: 'active' })
  });
  console.log('Activate draft after verification status:', activateDraftAfterApprovalRes.status, activateDraftAfterApprovalRes.data?.message);
  assert.strictEqual(activateDraftAfterApprovalRes.status, 200, 'Now draft can be activated');
  // 9: Cross-owner property manipulation protection
  console.log('--- Test 9: منع مالك من تعديل أو حذف عقار مسجل لمالك آخر (Cross-Owner Protection) ---');
  // Register another separate owner (Owner B)
  const ownerBEmail = `ownerB.${Date.now()}@sakanly.com`;
  const regOwnerBRes = await request('/auth/register', {
    method: 'POST',
    body: JSON.stringify({
      fullName: 'المالك ب (شخص آخر)',
      email: ownerBEmail,
      password: '123456',
      role: 'owner'
    })
  });
  const ownerBAuth = { token: regOwnerBRes.data.data.token, user: regOwnerBRes.data.data.user };
  console.log('✓ Owner B created & logged in:', ownerBAuth.user.email);

  // Owner B attempts to edit Owner A's listing (publishedListing from Test 6)
  const spoofEditRes = await request(`/listings/${publishedListing.id}`, {
    method: 'PUT',
    headers: { Authorization: `Bearer ${ownerBAuth.token}` },
    body: JSON.stringify({
      title: 'محاولة تعديل عقار غير مملوك',
      monthlyPrice: 1000
    })
  });
  console.log('Owner B edit Owner A property status:', spoofEditRes.status, spoofEditRes.data?.message);
  assert.strictEqual(spoofEditRes.status, 403, 'Must return 403 when editing other owner property');
  assert.strictEqual(spoofEditRes.data?.code, 'NOT_PROPERTY_OWNER');

  // Owner B attempts to change status of Owner A's listing
  const spoofStatusRes = await request(`/listings/${publishedListing.id}/status`, {
    method: 'PATCH',
    headers: { Authorization: `Bearer ${ownerBAuth.token}` },
    body: JSON.stringify({ status: 'archived' })
  });
  console.log('Owner B status change status:', spoofStatusRes.status, spoofStatusRes.data?.message);
  assert.strictEqual(spoofStatusRes.status, 403, 'Must return 403 when modifying other owner property status');
  assert.strictEqual(spoofStatusRes.data?.code, 'NOT_PROPERTY_OWNER');

  // Owner B attempts to delete Owner A's listing
  const spoofDeleteRes = await request(`/listings/${publishedListing.id}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${ownerBAuth.token}` }
  });
  console.log('Owner B delete Owner A property status:', spoofDeleteRes.status, spoofDeleteRes.data?.message);
  assert.strictEqual(spoofDeleteRes.status, 403, 'Must return 403 when deleting other owner property');
  assert.strictEqual(spoofDeleteRes.data?.code, 'NOT_PROPERTY_OWNER');
  console.log('✅ Test 9 PASSED: منع تعديل أو حذف أي عقار يخص مالكاً آخر نهائياً (403 NOT_PROPERTY_OWNER).\n');

  console.log('====================================================');
  console.log('🎉 ALL 9 SECURITY AND VERIFICATION TESTS PASSED 100%!');
  console.log('====================================================');
}

runTests().catch(err => {
  console.error('❌ Test failed with error:', err);
  process.exit(1);
});
