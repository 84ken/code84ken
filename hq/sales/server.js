#!/usr/bin/env node
/**
 * SCHEMA 経営ダッシュボード ローカルサーバー
 * 使い方: node server.js
 * → http://localhost:3456
 */
const express = require('express');
const fs = require('fs');
const path = require('path');
const PDFParser = require('pdf2json');

const app = express();
const PORT = 3456;
const MEMO_FILE = path.join(__dirname, 'vendor-memos.json');
const INVOICE_DIR = path.join(__dirname, 'invoices'); // 請求書PDFフォルダ
const CORRECTIONS_FILE = path.join(__dirname, 'vendor-corrections.json');

app.use(express.json());
app.use(express.static(__dirname));

// ===== MEMO CRUD =====

function loadMemos() {
  try {
    return JSON.parse(fs.readFileSync(MEMO_FILE, 'utf-8'));
  } catch {
    return { memos: [] };
  }
}

function saveMemos(data) {
  fs.writeFileSync(MEMO_FILE, JSON.stringify(data, null, 2), 'utf-8');
}

// GET all data
app.get('/api/memos', (req, res) => {
  res.json(loadMemos());
});

// POST full save (projects structure)
app.post('/api/memos', (req, res) => {
  saveMemos(req.body);
  res.json({ ok: true });
});

function loadCorrections() {
  try {
    return JSON.parse(fs.readFileSync(CORRECTIONS_FILE, 'utf-8'));
  } catch {
    return { corrections: {}, updatedAt: null };
  }
}

function saveCorrections(data) {
  data.updatedAt = new Date().toISOString();
  fs.writeFileSync(CORRECTIONS_FILE, JSON.stringify(data, null, 2), 'utf-8');
}

// ===== VENDOR CORRECTIONS =====

// GET all corrections
app.get('/api/corrections', (req, res) => {
  res.json(loadCorrections());
});

// POST save corrections for a specific vendor
app.post('/api/corrections/:vendorName', (req, res) => {
  const data = loadCorrections();
  const name = decodeURIComponent(req.params.vendorName);
  data.corrections[name] = req.body;
  saveCorrections(data);
  res.json({ ok: true });
});

// DELETE corrections for a vendor
app.delete('/api/corrections/:vendorName', (req, res) => {
  const data = loadCorrections();
  const name = decodeURIComponent(req.params.vendorName);
  delete data.corrections[name];
  saveCorrections(data);
  res.json({ ok: true });
});

// ===== PDF INVOICE SCANNING =====

// Ensure invoice directory exists
if (!fs.existsSync(INVOICE_DIR)) fs.mkdirSync(INVOICE_DIR, { recursive: true });

// PDF テキスト抽出（pdf2json使用）
function extractPDFText(filepath) {
  return new Promise((resolve, reject) => {
    const parser = new PDFParser();
    const timeout = setTimeout(() => { reject(new Error('PDF解析タイムアウト')); }, 15000);

    parser.on('pdfParser_dataReady', (pdfData) => {
      clearTimeout(timeout);
      try {
        let text = pdfData.Pages.map(page =>
          page.Texts.map(t => decodeURIComponent(t.R[0].T)).join(' ')
        ).join('\n');
        // 日本語文字間スペース除去
        text = text.replace(/([\u3000-\u9FFF\uFF00-\uFFEF])\s+([\u3000-\u9FFF\uFF00-\uFFEF])/g, '$1$2');
        text = text.replace(/([\u3000-\u9FFF\uFF00-\uFFEF])\s+([\u3000-\u9FFF\uFF00-\uFFEF])/g, '$1$2');
        text = text.replace(/([\u3000-\u9FFF\uFF00-\uFFEF])\s+([\u3000-\u9FFF\uFF00-\uFFEF])/g, '$1$2');
        text = text.replace(/(\d)\s+,\s+(\d)/g, '$1,$2');
        text = text.replace(/(\d)\s+(\d)/g, '$1$2');
        text = text.replace(/(\d)\s+(\d)/g, '$1$2');
        resolve(text);
      } catch (e) { reject(e); }
    });
    parser.on('pdfParser_dataError', (err) => {
      clearTimeout(timeout);
      reject(new Error(err.parserError || String(err)));
    });
    try { parser.loadPDF(filepath); } catch(e) { clearTimeout(timeout); reject(e); }
  });
}

// Scan invoices folder and extract info
// ?month=2026-03 で月別フォルダ対応
app.get('/api/invoices/scan', async (req, res) => {
  try {
    const month = req.query.month || '';
    const scanDir = month ? path.join(INVOICE_DIR, month) : INVOICE_DIR;

    // フォルダがなければ作成
    if (!fs.existsSync(scanDir)) fs.mkdirSync(scanDir, { recursive: true });

    const files = fs.readdirSync(scanDir).filter(f => f.toLowerCase().endsWith('.pdf'));
    const results = [];

    for (const file of files) {
      try {
        const text = await extractPDFText(path.join(scanDir, file));
        const info = extractInvoiceInfo(text, file);
        results.push(info);
      } catch (e) {
        results.push({ file, error: e.message, vendor: null, amount: null, date: null });
      }
    }

    // Cross-reference with memos (flatten from projects)
    const raw = loadMemos();
    const memos = [];
    (raw.projects || []).forEach(p => {
      (p.vendors || []).forEach(v => {
        memos.push({ ...v, project: p.name, client: p.client, pid: p.id });
      });
    });

    // 月でフィルター（指定月の予定のみ）
    const targetMemos = month
      ? memos.filter(m => m.expectedMonth === month && m.status !== 'paid')
      : memos.filter(m => m.status !== 'paid');

    const matched = [];
    const unmatchedInvoices = [];
    const usedMemoIds = new Set();

    results.forEach(inv => {
      if (!inv.vendor && !inv.amount) { unmatchedInvoices.push(inv); return; }

      let bestMatch = null;
      let bestScore = 0;
      let bestDiff = 0;

      targetMemos.forEach(m => {
        if (usedMemoIds.has(m.id)) return;

        // ベンダー名スコア
        let vendorScore = 0;
        if (inv.vendor && m.vendor) {
          const a = inv.vendor.toLowerCase(), b = m.vendor.toLowerCase();
          if (a === b) vendorScore = 100;
          else if (a.includes(b) || b.includes(a)) {
            const ratio = Math.min(a.length, b.length) / Math.max(a.length, b.length);
            vendorScore = ratio > 0.3 ? 80 : 40;
          }
        }

        // 金額スコア
        let amountScore = 0;
        let amountDiff = 0;
        if (inv.amount) {
          const targets = [m.amountTax, m.amount, m.amountTax ? Math.round(m.amountTax / 1.1) : 0].filter(Boolean);
          for (const t of targets) {
            const diff = Math.abs(inv.amount - t);
            if (diff === 0) { amountScore = 100; amountDiff = 0; break; }
            if (diff < 500) { amountScore = Math.max(amountScore, 90); amountDiff = inv.amount - t; }
            else if (diff / t < 0.05) { amountScore = Math.max(amountScore, 70); amountDiff = inv.amount - t; }
          }
        }

        const combined = vendorScore * 0.6 + amountScore * 0.4;
        if (combined > bestScore && combined >= 40) {
          bestScore = combined;
          bestMatch = m;
          bestDiff = amountDiff;
        }
      });

      if (bestMatch) {
        usedMemoIds.add(bestMatch.id);
        matched.push({
          invoice: inv,
          memo: bestMatch,
          amountDiff: bestDiff,
          matchConfidence: Math.round(bestScore),
        });
      } else {
        unmatchedInvoices.push(inv);
      }
    });

    // 未マッチの予定
    const unmatchedMemos = targetMemos.filter(m => !usedMemoIds.has(m.id));

    res.json({
      scannedAt: new Date().toISOString(),
      month: month || 'all',
      scanDir: scanDir,
      totalFiles: files.length,
      matched,
      unmatchedInvoices,
      unmatchedMemos,
      allInvoices: results,
    });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// Extract vendor name, amount, date from PDF text
function extractInvoiceInfo(text, filename) {
  const lines = text.split('\n').map(l => l.trim()).filter(Boolean);

  // Try to find vendor name (usually near top, after "請求書" or company name patterns)
  let vendor = null;
  let amount = null;
  let date = null;

  // Amount patterns: ¥xxx,xxx or xxx,xxx円 or 合計 xxx
  const amountPatterns = [
    /(?:合計|請求金額|ご請求額|税込合計|お支払[い金]額)[^\d]*?([¥￥]?\s?[\d,]+)/,
    /([¥￥]\s?[\d,]+(?:\s?円)?)/g,
    /([\d,]+)\s*円/g,
  ];

  for (const pattern of amountPatterns) {
    const m = text.match(pattern);
    if (m) {
      const numStr = (m[1] || m[0]).replace(/[¥￥円\s,]/g, '');
      const num = parseInt(numStr);
      if (num > 1000 && num < 100000000) { // reasonable invoice range
        amount = num;
        break;
      }
    }
  }

  // Date patterns: 2026年3月20日 or 2026/3/20 or R8.3.20
  const datePatterns = [
    /(\d{4})\s*年\s*(\d{1,2})\s*月\s*(\d{1,2})\s*日/,
    /(\d{4})[\/\-](\d{1,2})[\/\-](\d{1,2})/,
  ];
  for (const pattern of datePatterns) {
    const m = text.match(pattern);
    if (m) {
      date = m[1] + '-' + m[2].padStart(2, '0') + '-' + m[3].padStart(2, '0');
      break;
    }
  }

  // Vendor: look for company names (株式会社xxx, xxx制作所, etc.)
  const vendorPatterns = [
    /(?:株式会社|有限会社|合同会社)\s*[\u3000-\u9FFF\w]+/,
    /[\u3000-\u9FFF]{2,}(?:制作所|事務所|デザイン|クリエイト|フィルム)/,
  ];
  for (const line of lines.slice(0, 15)) { // Check first 15 lines
    for (const pattern of vendorPatterns) {
      const m = line.match(pattern);
      if (m) { vendor = m[0].trim(); break; }
    }
    if (vendor) break;
  }

  // Fallback: use filename
  if (!vendor) {
    vendor = filename.replace(/\.pdf$/i, '').replace(/[\d_\-]/g, ' ').trim() || null;
  }

  return { file: filename, vendor, amount, date, textPreview: lines.slice(0, 5).join(' / ') };
}

// ===== REGENERATE DATA =====
app.post('/api/regenerate', (req, res) => {
  try {
    require('child_process').execSync('node generate-sales-data.js && node generate-vendor-data.js', {
      cwd: __dirname,
      stdio: 'pipe',
    });
    res.json({ ok: true, message: 'データ再生成完了' });
  } catch (e) {
    res.status(500).json({ error: e.stderr?.toString() || e.message });
  }
});

// ===== START =====
app.listen(PORT, () => {
  console.log('');
  console.log('  SCHEMA 経営ダッシュボード');
  console.log('  ========================');
  console.log('  http://localhost:' + PORT + '/');
  console.log('');
  console.log('  ページ:');
  console.log('    /sales-dashboard.html    売上ダッシュボード');
  console.log('    /vendor-search.html      外注先検索・管理');
  console.log('    /vendor-memo.html        外注予定メモ');
  console.log('    /cashflow.html           キャッシュフロー');
  console.log('');
  console.log('  API:');
  console.log('    GET  /api/memos          メモ一覧');
  console.log('    POST /api/memos          メモ追加');
  console.log('    PUT  /api/memos/:id      メモ更新');
  console.log('    DEL  /api/memos/:id      メモ削除');
  console.log('    GET  /api/invoices/scan  請求書PDF照合');
  console.log('    GET  /api/corrections       外注先修正データ');
  console.log('    POST /api/corrections/:name 外注先修正保存');
  console.log('    POST /api/regenerate     データ再生成');
  console.log('');
  console.log('  請求書PDF: ' + INVOICE_DIR + '/');
  console.log('');
});
