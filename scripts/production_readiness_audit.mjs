/**
 * Sakanly Full Production Readiness & Responsive Audit Script
 * Runs real Chrome across 10 viewports and all discovered routes.
 */

import puppeteer from 'puppeteer-core';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const SCREENSHOTS_DIR = path.resolve(__dirname, '../screenshots/audit');

if (!fs.existsSync(SCREENSHOTS_DIR)) {
  fs.mkdirSync(SCREENSHOTS_DIR, { recursive: true });
}

const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const BASE_URL = 'http://127.0.0.1:5173';

// 10 Viewports specified by user
const VIEWPORTS = [
  { name: 'Mobile Small', width: 320, height: 568 },
  { name: 'Mobile', width: 360, height: 640 },
  { name: 'Mobile', width: 375, height: 667 },
  { name: 'Mobile', width: 390, height: 844 },
  { name: 'Mobile Large', width: 430, height: 932 },
  { name: 'Tablet', width: 768, height: 1024 },
  { name: 'Tablet Landscape', width: 1024, height: 768 },
  { name: 'Laptop', width: 1280, height: 800 },
  { name: 'Desktop', width: 1440, height: 900 },
  { name: 'Large Desktop', width: 1920, height: 1080 },
];

// All discovered public and app routes
const ROUTES = [
  { path: '/', name: 'الرئيسية (Home)' },
  { path: '/browse', name: 'تصفح السكن (Browse)' },
  { path: '/beds', name: 'الأسِرّة الفردية (Beds)' },
  { path: '/how-it-works', name: 'كيف نعمل (How It Works)' },
  { path: '/login', name: 'تسجيل الدخول (Login)' },
  { path: '/register', name: 'إنشاء حساب (Register)' },
  { path: '/forgot-password', name: 'استعادة كلمة المرور' },
  { path: '/control-center/login', name: 'تسجيل دخول الإدارة (Admin Login)' },
];

async function runAudit() {
  console.log('\n========================================================================');
  console.log('🚀 SAKANLY FULL PRODUCTION RESPONSIVE & BROWSER AUDIT');
  console.log(`🌐 Chrome Executable: ${CHROME_PATH}`);
  console.log(`📡 Base URL: ${BASE_URL}`);
  console.log('========================================================================\n');

  let browser;
  try {
    browser = await puppeteer.launch({
      executablePath: CHROME_PATH,
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage'],
    });
  } catch (err) {
    console.error('❌ Failed to launch Chrome:', err);
    process.exit(1);
  }

  const auditResults = {
    totalTests: 0,
    passed: 0,
    failed: 0,
    viewportReports: [],
    consoleErrors: [],
    networkFailures: [],
  };

  const page = await browser.newPage();

  page.on('console', (msg) => {
    if (msg.type() === 'error') {
      const text = msg.text();
      // Ignore normal react dev or websocket reconnect warnings
      if (!text.includes('Failed to load resource') && !text.includes('Socket') && !text.includes('favicon')) {
        auditResults.consoleErrors.push(text);
      }
    }
  });

  page.on('requestfailed', (req) => {
    const url = req.url();
    if (!url.includes('/api/v1/notifications') && !url.includes('google') && !url.includes('socket.io')) {
      auditResults.networkFailures.push({ url, error: req.failure()?.errorText });
    }
  });

  for (const vp of VIEWPORTS) {
    console.log(`\n📱 --- Testing Viewport: ${vp.name} (${vp.width}x${vp.height}px) ---`);
    await page.setViewport({ width: vp.width, height: vp.height });

    const vpReport = {
      viewport: `${vp.name} (${vp.width}px)`,
      pagesTested: 0,
      overflowErrors: 0,
      brokenImages: 0,
    };

    for (const r of ROUTES) {
      auditResults.totalTests++;
      vpReport.pagesTested++;
      const fullUrl = `${BASE_URL}${r.path}`;

      try {
        await page.goto(fullUrl, { waitUntil: 'networkidle2', timeout: 15000 });

        // Check for Horizontal Scroll / Overflow
        const overflow = await page.evaluate(() => {
          const docEl = document.documentElement;
          const body = document.body;
          const scrollWidth = Math.max(docEl.scrollWidth, body.scrollWidth);
          const clientWidth = window.innerWidth;
          return {
            hasOverflow: scrollWidth > clientWidth + 2, // 2px tolerance for browser rounding
            scrollWidth,
            clientWidth,
          };
        });

        // Check for broken images
        const brokenImagesCount = await page.evaluate(() => {
          const imgs = Array.from(document.querySelectorAll('img'));
          return imgs.filter((img) => img.complete && img.naturalWidth === 0).length;
        });

        if (overflow.hasOverflow) {
          vpReport.overflowErrors++;
          auditResults.failed++;
          console.log(`  ❌ [OVERFLOW] ${r.name} at ${vp.width}px: scrollWidth ${overflow.scrollWidth}px > clientWidth ${overflow.clientWidth}px`);
        } else {
          auditResults.passed++;
          console.log(`  ✅ [PASS] ${r.name}: Perfectly fits ${vp.width}px (No horizontal scroll)`);
        }

        if (brokenImagesCount > 0) {
          vpReport.brokenImages += brokenImagesCount;
          console.log(`  ⚠️ [IMAGE] ${brokenImagesCount} broken images detected on ${r.name}`);
        }

        // Capture milestone screenshot on selected key viewports
        if (['Mobile Small', 'Mobile', 'Tablet', 'Desktop'].includes(vp.name) && ['/', '/browse'].includes(r.path)) {
          const cleanName = `${r.path.replace(/[^a-zA-Z0-9]/g, '_')}_${vp.width}px.png`;
          const screenshotPath = path.join(SCREENSHOTS_DIR, cleanName);
          await page.screenshot({ path: screenshotPath, fullPage: false });
        }
      } catch (err) {
        auditResults.failed++;
        console.error(`  ❌ [ERROR] Navigating to ${fullUrl} at ${vp.width}px:`, err.message);
      }
    }

    auditResults.viewportReports.push(vpReport);
  }

  await browser.close();

  console.log('\n========================================================================');
  console.log('📊 PRODUCTION RESPONSIVE & BROWSER AUDIT SUMMARY');
  console.log('========================================================================');
  console.log(`Total Page/Viewport Checks: ${auditResults.totalTests}`);
  console.log(`✅ Passed: ${auditResults.passed}`);
  console.log(`❌ Failed: ${auditResults.failed}`);
  console.log(`Console Errors Tracked: ${auditResults.consoleErrors.length}`);
  console.log(`Network Failures: ${auditResults.networkFailures.length}`);

  console.log('\nDetailed Viewport Matrix:');
  console.table(auditResults.viewportReports);

  const outputPath = path.resolve(__dirname, '../screenshots/audit/audit_summary.json');
  fs.writeFileSync(outputPath, JSON.stringify(auditResults, null, 2), 'utf-8');
  console.log(`\nDetailed results saved to: ${outputPath}`);
}

runAudit().catch((err) => {
  console.error('❌ Audit runner failed:', err);
  process.exit(1);
});

