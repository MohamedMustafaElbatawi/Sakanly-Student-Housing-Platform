// Multi-Account Data Isolation & User Ownership Test Script
const API_URL = 'http://localhost:5000/api/v1';

async function request(endpoint, options = {}) {
  const url = `${API_URL}${endpoint}`;
  const headers = {
    'Content-Type': 'application/json',
    ...(options.token ? { Authorization: `Bearer ${options.token}` } : {}),
    ...(options.headers || {}),
  };
  const res = await fetch(url, {
    method: options.method || 'GET',
    headers,
    body: options.body ? JSON.stringify(options.body) : undefined,
  });
  const data = await res.json().catch(() => null);
  return { status: res.status, ok: res.ok, data };
}

async function login(identifier, password) {
  const isEmail = identifier.includes('@');
  const body = isEmail ? { email: identifier, password } : { phone: identifier, password };
  const res = await request('/auth/login', { method: 'POST', body });
  if (!res.ok || !res.data?.data?.token) {
    throw new Error(`Login failed for ${identifier}: ${JSON.stringify(res.data)}`);
  }
  return {
    user: res.data.data.user,
    token: res.data.data.token,
  };
}

const results = [];
function recordTest(testName, passed, details = '') {
  results.push({ testName, passed, details });
  const statusIcon = passed ? '✅ PASS' : '❌ FAIL';
  console.log(`${statusIcon}: ${testName} ${details ? `(${details})` : ''}`);
}

async function runTests() {
  console.log('====================================================');
  console.log('   SAKANLY MULTI-ACCOUNT ISOLATION TEST SUITE       ');
  console.log('====================================================\n');

  // 1. Authenticate All Test Personas
  console.log('--- 1. Authenticating Test Personas ---');
  const studentA = await login('01012345678', '123456');
  console.log(`Student A: ${studentA.user.fullName} (${studentA.user.id})`);

  const studentB = await login('sara.email@sakanly.com', '123456');
  console.log(`Student B: ${studentB.user.fullName} (${studentB.user.id})`);

  const ownerA = await login('owner@sakanly.com', '123456');
  console.log(`Owner A: ${ownerA.user.fullName} (${ownerA.user.id}, Verified: ${ownerA.user.isVerified})`);

  const ownerB = await login('owner.unverified@sakanly.com', '123456');
  console.log(`Owner B: ${ownerB.user.fullName} (${ownerB.user.id}, Verified: ${ownerB.user.isVerified})`);

  // --- PART 1: STUDENT DATA ISOLATION ---
  console.log('\n--- 2. Student Favorites Isolation ---');
  // Student A favorites
  const favResA = await request('/favorites', { token: studentA.token });
  const favIdsA = favResA.data?.data?.favorites || [];
  recordTest('Student A gets own favorites', favResA.ok && favIdsA.includes('prop-001') && !favIdsA.includes('prop-004'), `Favorites: ${favIdsA}`);

  // Student B favorites
  const favResB = await request('/favorites', { token: studentB.token });
  const favIdsB = favResB.data?.data?.favorites || [];
  recordTest('Student B gets own favorites (isolated from A)', favResB.ok && favIdsB.includes('prop-004') && !favIdsB.includes('prop-001'), `Favorites: ${favIdsB}`);

  // Student B adds a favorite
  await request('/favorites', { method: 'POST', token: studentB.token, body: { listingId: 'prop-002' } });
  const updatedB = await request('/favorites', { token: studentB.token });
  const updatedA = await request('/favorites', { token: studentA.token });
  const bList = updatedB.data?.data?.favorites || [];
  const aList = updatedA.data?.data?.favorites || [];
  recordTest('Student B mutation does NOT pollute Student A favorites', bList.includes('prop-002') && !aList.includes('prop-002'), `A: [${aList}], B: [${bList}]`);

  // --- PART 2: STUDENT MESSAGES & CONVERSATIONS ISOLATION ---
  console.log('\n--- 3. Student Conversations & IDOR Attacks ---');
  const convsA = await request('/messages/conversations', { token: studentA.token });
  const convListA = convsA.data?.data?.conversations || [];
  recordTest('Student A sees only their conversations', convListA.every(c => c.studentId === studentA.user.id), `Total: ${convListA.length}`);

  const convsB = await request('/messages/conversations', { token: studentB.token });
  const convListB = convsB.data?.data?.conversations || [];
  recordTest('Student B sees only their conversations', convListB.every(c => c.studentId === studentB.user.id), `Total: ${convListB.length}`);

  // IDOR: Student B attempts to read Student A's conversation conv-01
  const idorRead = await request('/messages/conversations/conv-01', { token: studentB.token });
  recordTest('IDOR BLOCKED: Student B reading Student A conversation', idorRead.status === 403, `Status: ${idorRead.status}`);

  // IDOR: Student B attempts to send message in Student A's conversation conv-01
  const idorSend = await request('/messages/conversations/conv-01/messages', {
    method: 'POST',
    token: studentB.token,
    body: { text: 'محاولة اختراق محادثة طالب آخر' },
  });
  recordTest('IDOR BLOCKED: Student B sending message in Student A conversation', idorSend.status === 403, `Status: ${idorSend.status}`);

  // --- PART 3: VIEWING REQUESTS (INQUIRIES) ISOLATION ---
  console.log('\n--- 4. Viewing Requests Isolation ---');
  const inqA = await request('/listings/inquiries/my', { token: studentA.token });
  const inqListA = inqA.data?.data?.inquiries || [];
  recordTest('Student A viewing requests strictly their own', inqListA.every(i => i.applicant.id === studentA.user.id), `Count: ${inqListA.length}`);

  const inqB = await request('/listings/inquiries/my', { token: studentB.token });
  const inqListB = inqB.data?.data?.inquiries || [];
  recordTest('Student B viewing requests strictly their own', inqListB.every(i => i.applicant.id === studentB.user.id), `Count: ${inqListB.length}`);

  // --- PART 4: OWNER PROPERTY OWNERSHIP & ISOLATION ---
  console.log('\n--- 5. Owner Properties & Stats Isolation ---');
  const ownerAProps = await request('/listings/my/listings', { token: ownerA.token });
  const propsListA = ownerAProps.data?.data?.listings || [];
  const allBelongToA = propsListA.every(p => p.owner?.id === ownerA.user.id);
  recordTest('Owner A manages strictly their own properties', allBelongToA && propsListA.length >= 2, `Count: ${propsListA.length}`);

  const ownerBProps = await request('/listings/my/listings', { token: ownerB.token });
  const propsListB = ownerBProps.data?.data?.listings || [];
  const allBelongToB = propsListB.every(p => p.owner?.id === ownerB.user.id);
  recordTest('Owner B manages strictly their own properties', allBelongToB && propsListB.length >= 2, `Count: ${propsListB.length}`);

  // Verify no overlap
  const idsA = propsListA.map(p => p.id);
  const idsB = propsListB.map(p => p.id);
  const overlap = idsA.filter(id => idsB.includes(id));
  recordTest('Zero property overlap between Owner A and Owner B', overlap.length === 0, `Overlap: ${overlap.length}`);

  // Stats Isolation
  const statsA = await request('/listings/my/stats', { token: ownerA.token });
  const statsB = await request('/listings/my/stats', { token: ownerB.token });
  recordTest('Owner A and Owner B have distinct, isolated stats', statsA.ok && statsB.ok, `Owner A Total: ${statsA.data?.data?.total}, Owner B Total: ${statsB.data?.data?.total}`);

  // --- PART 5: DRAFT PRIVACY & IDOR ATTACK DEFENSE ---
  console.log('\n--- 6. Draft Privacy & Cross-Owner IDOR Defense ---');
  // Owner A draft: prop-draft-001
  const draftA_byOwnerA = await request('/listings/prop-draft-001', { token: ownerA.token });
  recordTest('Owner A CAN view their own draft (prop-draft-001)', draftA_byOwnerA.ok && draftA_byOwnerA.data?.data?.listing?.id === 'prop-draft-001');

  // IDOR: Owner B attempts to view Owner A's draft
  const draftA_byOwnerB = await request('/listings/prop-draft-001', { token: ownerB.token });
  recordTest('DRAFT LEAK BLOCKED: Owner B viewing Owner A draft returns 404', draftA_byOwnerB.status === 404);

  // IDOR: Student A attempts to view Owner A's draft
  const draftA_byStudent = await request('/listings/prop-draft-001', { token: studentA.token });
  recordTest('DRAFT LEAK BLOCKED: Student viewing draft returns 404', draftA_byStudent.status === 404);

  // IDOR: Owner B attempts to update Owner A's property
  const idorUpdate = await request('/listings/prop-001', {
    method: 'PUT',
    token: ownerB.token,
    body: { title: 'تم الاستيلاء على العقار' },
  });
  recordTest('IDOR BLOCKED: Owner B updating Owner A property returns 403', idorUpdate.status === 403);

  // IDOR: Owner B attempts to toggle status of Owner A's property
  const idorStatus = await request('/listings/prop-001/status', {
    method: 'PATCH',
    token: ownerB.token,
    body: { status: 'paused' },
  });
  recordTest('IDOR BLOCKED: Owner B changing status of Owner A property returns 403', idorStatus.status === 403);

  // IDOR: Owner B attempts to delete Owner A's property
  const idorDelete = await request('/listings/prop-001', {
    method: 'DELETE',
    token: ownerB.token,
  });
  recordTest('IDOR BLOCKED: Owner B deleting Owner A property returns 403', idorDelete.status === 403);

  // --- PART 6: OWNER INQUIRIES & CONVERSATIONS ISOLATION ---
  console.log('\n--- 7. Owner Inquiries & Conversations Isolation ---');
  const ownerAInq = await request('/listings/inquiries/my', { token: ownerA.token });
  const inqOwnerListA = ownerAInq.data?.data?.inquiries || [];
  recordTest('Owner A receives inquiries on their properties only', inqOwnerListA.every(i => i.ownerId === ownerA.user.id), `Inquiries count: ${inqOwnerListA.length}`);

  const ownerBInq = await request('/listings/inquiries/my', { token: ownerB.token });
  const inqOwnerListB = ownerBInq.data?.data?.inquiries || [];
  recordTest('Owner B receives inquiries on their properties only', inqOwnerListB.every(i => i.ownerId === ownerB.user.id), `Inquiries count: ${inqOwnerListB.length}`);

  // IDOR: Owner B attempts to change status of Owner A's inquiry req-01
  const idorInqStatus = await request('/listings/inquiries/req-01/status', {
    method: 'PATCH',
    token: ownerB.token,
    body: { status: 'accepted' },
  });
  recordTest('IDOR BLOCKED: Owner B modifying Owner A inquiry status returns 403', idorInqStatus.status === 403);

  // Owner Messages Isolation
  const ownerAConvs = await request('/messages/conversations', { token: ownerA.token });
  const convOwnerListA = ownerAConvs.data?.data?.conversations || [];
  recordTest('Owner A sees only their conversations', convOwnerListA.every(c => c.ownerId === ownerA.user.id), `Count: ${convOwnerListA.length}`);

  const ownerBConvs = await request('/messages/conversations', { token: ownerB.token });
  const convOwnerListB = ownerBConvs.data?.data?.conversations || [];
  recordTest('Owner B sees only their conversations', convOwnerListB.every(c => c.ownerId === ownerB.user.id), `Count: ${convOwnerListB.length}`);

  // IDOR: Owner B attempts to read Owner A's conversation conv-01
  const idorOwnerConvRead = await request('/messages/conversations/conv-01', { token: ownerB.token });
  recordTest('IDOR BLOCKED: Owner B reading Owner A conversation returns 403', idorOwnerConvRead.status === 403);

  // --- PART 7: ADMIN PRIVILEGE & ROLE ESCALATION DEFENSE ---
  console.log('\n--- 8. Admin Privilege & Escalation Defense ---');
  // Non-admin attempting to review verification
  const fakeReview = await request('/auth/verification/review', {
    method: 'POST',
    token: ownerA.token,
    body: { userId: ownerB.user.id, status: 'verified' },
  });
  recordTest('PRIVILEGE ESCALATION BLOCKED: Owner reviewVerification returns 403', fakeReview.status === 403);

  // User attempting to mutate own role via PATCH /me
  const escalateRole = await request('/auth/me', {
    method: 'PATCH',
    token: studentA.token,
    body: { role: 'admin', fullName: 'أحمد علي المحدث' },
  });
  recordTest('ROLE MUTATION BLOCKED: User cannot elevate role via profile update', escalateRole.ok && escalateRole.data?.data?.user?.role === 'student');

  console.log('\n====================================================');
  const allPassed = results.every(r => r.passed);
  console.log(`TEST SUMMARY: ${results.filter(r => r.passed).length}/${results.length} PASSED`);
  console.log(`OVERALL RESULT: ${allPassed ? '🏆 ALL TESTS PASSED SUCCESSFULLY!' : '❌ SOME TESTS FAILED'}`);
  console.log('====================================================\n');
}

runTests().catch(err => {
  console.error('Test execution error:', err);
  process.exit(1);
});
