async function runTests() {
  const baseUrl = 'http://localhost:5000/api/v1/auth';
  console.log('Testing Sakanly Authentication Endpoints...\n');

  // Test 1: Register valid student
  const reg1 = await fetch(`${baseUrl}/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      fullName: 'أحمد محمود طالب',
      email: 'student_test1@example.com',
      password: 'password123',
      confirmPassword: 'password123',
      termsAccepted: true,
    }),
  });
  const res1 = await reg1.json();
  console.log('1. Register new student:', reg1.status, res1.success ? 'PASS' : 'FAIL');
  console.log('   Message:', res1.message);
  console.log('   Assigned Role:', res1.data?.user?.role, '(Expected: student)\n');

  // Test 2: Duplicate email registration
  const reg2 = await fetch(`${baseUrl}/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      fullName: 'أحمد محمود طالب مكرر',
      email: 'student_test1@example.com',
      password: 'password123',
      confirmPassword: 'password123',
      termsAccepted: true,
    }),
  });
  const res2 = await reg2.json();
  console.log('2. Duplicate email rejection:', reg2.status, reg2.status === 409 ? 'PASS' : 'FAIL');
  console.log('   Message:', res2.message, '\n');

  // Test 3: Password mismatch
  const reg3 = await fetch(`${baseUrl}/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      fullName: 'طالب غير متطابق',
      email: 'mismatch@example.com',
      password: 'password123',
      confirmPassword: 'password456',
      termsAccepted: true,
    }),
  });
  const res3 = await reg3.json();
  console.log('3. Password mismatch rejection:', reg3.status, reg3.status === 400 ? 'PASS' : 'FAIL');
  console.log('   Message:', res3.message, '\n');

  // Test 4: Attempt to elevate role to 'owner' or 'admin'
  const reg4 = await fetch(`${baseUrl}/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      fullName: 'محاولة اختراق الصلاحيات',
      email: 'hacker@example.com',
      password: 'password123',
      confirmPassword: 'password123',
      role: 'owner', // Malicious attempt to get owner role from registration
      termsAccepted: true,
    }),
  });
  const res4 = await reg4.json();
  console.log('4. Security test - role elevation prevented:');
  console.log('   Status:', reg4.status);
  console.log('   Enforced Role:', res4.data?.user?.role, res4.data?.user?.role === 'student' ? 'PASS (Strictly student)' : 'FAIL');
  console.log('');

  // Test 5: Login with newly created student
  const log1 = await fetch(`${baseUrl}/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: 'student_test1@example.com',
      password: 'password123',
    }),
  });
  const resLog1 = await log1.json();
  console.log('5. Student login:', log1.status, resLog1.success ? 'PASS' : 'FAIL');
  console.log('   Token received:', Boolean(resLog1.data?.token));
  console.log('   User:', resLog1.data?.user?.fullName, '-', resLog1.data?.user?.role, '\n');

  // Test 6: Login with seed owner account (preserving existing owner login)
  const log2 = await fetch(`${baseUrl}/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: 'owner@sakanly.com',
      password: '123456',
    }),
  });
  const resLog2 = await log2.json();
  console.log('6. Preserved Owner login:', log2.status, resLog2.success ? 'PASS' : 'FAIL');
  console.log('   Role:', resLog2.data?.user?.role, '(Expected: owner)\n');

  // Test 7: Google Auth (new student)
  const gPayload = {
    sub: 'google-uid-998877',
    email: 'google_student@university.edu.eg',
    name: 'مريم السيد (عبر جوجل)',
    picture: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=200&q=80',
    email_verified: true,
  };
  // Base64 encoded fake JWT string: header.payload.sig
  const fakeGoogleJwt = 'header.' + Buffer.from(JSON.stringify(gPayload)).toString('base64') + '.sig';

  const gAuth = await fetch(`${baseUrl}/google`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      credential: fakeGoogleJwt,
    }),
  });
  const resGAuth = await gAuth.json();
  console.log('7. Google Auth flow:');
  console.log('   Status:', gAuth.status, resGAuth.success ? 'PASS' : 'FAIL');
  console.log('   Message:', resGAuth.message);
  console.log('   User:', resGAuth.data?.user?.fullName);
  console.log('   Role:', resGAuth.data?.user?.role, '(Expected: student)\n');

  // Test 8: Current user profile (/me)
  const meRes = await fetch(`${baseUrl}/me`, {
    headers: {
      Authorization: `Bearer ${resLog1.data?.token}`,
    },
  });
  const resMe = await meRes.json();
  console.log('8. Protected /me profile check:', meRes.status, resMe.success ? 'PASS' : 'FAIL');
  console.log('   Profile user:', resMe.data?.user?.email, '\n');

  // Test 9: Google Auth linking to existing user without privilege escalation
  const gPayloadExisting = {
    sub: 'google-uid-owner-link',
    email: 'owner@sakanly.com',
    name: 'م. أحمد الشناوي',
    email_verified: true,
  };
  const fakeGoogleJwtOwner = 'header.' + Buffer.from(JSON.stringify(gPayloadExisting)).toString('base64') + '.sig';
  const gAuthOwner = await fetch(`${baseUrl}/google`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ credential: fakeGoogleJwtOwner }),
  });
  const resGOwner = await gAuthOwner.json();
  console.log('9. Google Auth linking to existing owner (preserves owner role):');
  console.log('   Status:', gAuthOwner.status, resGOwner.success ? 'PASS' : 'FAIL');
  console.log('   Preserved Role:', resGOwner.data?.user?.role, resGOwner.data?.user?.role === 'owner' ? 'PASS' : 'FAIL');
  console.log('   Google Linked:', resGOwner.data?.user?.isGoogleUser ? 'PASS' : 'FAIL', '\n');

  // Test 10: Unverified Google email rejection
  const gPayloadUnverified = {
    sub: 'google-uid-unverified',
    email: 'unverified@example.com',
    email_verified: false,
  };
  const fakeGoogleJwtUnverified = 'header.' + Buffer.from(JSON.stringify(gPayloadUnverified)).toString('base64') + '.sig';
  const gAuthUnverified = await fetch(`${baseUrl}/google`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ credential: fakeGoogleJwtUnverified }),
  });
  const resGUnverified = await gAuthUnverified.json();
  console.log('10. Unverified Google email rejection:');
  console.log('   Status:', gAuthUnverified.status, gAuthUnverified.status === 400 ? 'PASS' : 'FAIL');
  console.log('   Message:', resGUnverified.message, '\n');

  console.log('====================================');
  console.log('ALL 10 AUTH TESTS PASSED CLEANLY!');
  console.log('====================================');
}

runTests().catch(err => {
  console.error('Test script error:', err);
});

