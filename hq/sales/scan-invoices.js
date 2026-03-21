/**
 * scan-invoices.js
 *
 * PDFの請求書をスキャンし、vendor-data.json のエントリとマッチングして
 * vendor-corrections.json に案件名の修正候補を出力するスクリプト。
 *
 * 使い方:
 *   node scan-invoices.js [年]
 *   node scan-invoices.js 2023     ← 2023年のPDFをスキャン
 *   node scan-invoices.js 2024     ← 2024年のPDFをスキャン
 *   node scan-invoices.js          ← デフォルトは2023年
 */

const fs = require('fs');
const path = require('path');
const PDFParser = require('pdf2json');

// ── 設定 ──────────────────────────────────────────────
const year = process.argv[2] || '2023';
const SAMPLE_DIR = path.join(__dirname, '..', 'sample', year + '年');
const VENDOR_DATA_PATH = path.join(__dirname, 'vendor-data.json');
const CORRECTIONS_PATH = path.join(__dirname, 'vendor-corrections.json');

// 汎用的（＝修正対象）なプロジェクト名パターン
// これらは請求書から具体的な案件名が取れれば上書きする候補
const GENERIC_PROJECT_NAMES = [
  'コーディング', '開発', 'デザイン', '運用', 'ディレクション',
  '制作', 'ディレクション・デザイン', '企画', '企画設計他',
  '編集', 'サイト開発', 'プロダクト開発', 'イラスト',
  'ブランディング動画', 'youtube動画', '会社案内ディレクション',
  'チラシディレクション', '広告', 'サーバランニング',
  '施工材料費他', 'プレスリリース', 'タオル販売',
  '印刷関連', '販促デザイン', 'サイト構築', '構築', '改修',
  'アプリ開発', 'アプリ改修', 'サーバ運用', 'サーバ調整',
  'サーバ実費', 'LP制作', '撮影', '撮影＆映像',
  '(不明)', '出演費', '広告掲載'
];

// ── PDF テキスト抽出 ──────────────────────────────────
/**
 * PDFファイルからテキストを抽出する
 * @param {string} filepath PDFファイルパス
 * @returns {Promise<string>} 抽出されたテキスト
 */
function extractTextFromPDF(filepath) {
  return new Promise((resolve, reject) => {
    const parser = new PDFParser(null, true); // true = suppress warnings

    parser.on('pdfParser_dataReady', (pdfData) => {
      try {
        const text = pdfData.Pages.map(page =>
          page.Texts.map(t => {
            try {
              return decodeURIComponent(t.R[0].T);
            } catch (e) {
              return t.R[0].T;
            }
          }).join(' ')
        ).join('\n');
        resolve(text);
      } catch (e) {
        reject(new Error(`テキスト抽出エラー: ${e.message}`));
      }
    });

    parser.on('pdfParser_dataError', (err) => {
      reject(new Error(`PDF解析エラー: ${err.parserError || err}`));
    });

    // タイムアウト（10秒で打ち切り）
    const timeout = setTimeout(() => {
      reject(new Error('PDF解析タイムアウト'));
    }, 10000);

    const origResolve = resolve;
    const origReject = reject;
    resolve = (v) => { clearTimeout(timeout); origResolve(v); };
    reject = (e) => { clearTimeout(timeout); origReject(e); };

    try {
      parser.loadPDF(filepath);
    } catch (e) {
      reject(new Error(`PDF読み込みエラー: ${e.message}`));
    }
  });
}

// unhandled rejectionでプロセスが落ちないようにする
process.on('unhandledRejection', (err) => {
  // 無視（個別PDFのエラーはtry-catchで処理）
});

// ── 請求書情報の抽出 ──────────────────────────────────
/**
 * テキストから請求書情報を抽出する
 * @param {string} text PDFから抽出したテキスト
 * @param {string} filename ファイル名（ヒント用）
 * @returns {Object} 抽出された請求書情報
 */
function extractInvoiceInfo(text, filename) {
  // 文字間スペースを除去（PDF抽出時に「株 式 会 社」のようになるケース対応）
  // 日本語文字（ひらがな・カタカナ・漢字・全角記号）間のスペースを除去
  text = text.replace(/([\u3000-\u9FFF\uFF00-\uFFEF])\s+([\u3000-\u9FFF\uFF00-\uFFEF])/g, '$1$2');
  // 繰り返し適用（3文字以上の連続スペース区切りに対応）
  text = text.replace(/([\u3000-\u9FFF\uFF00-\uFFEF])\s+([\u3000-\u9FFF\uFF00-\uFFEF])/g, '$1$2');
  text = text.replace(/([\u3000-\u9FFF\uFF00-\uFFEF])\s+([\u3000-\u9FFF\uFF00-\uFFEF])/g, '$1$2');
  // 数字間のスペースも除去（金額: 2 , 2 5 2 , 0 2 0 → 2,252,020）
  text = text.replace(/(\d)\s+,\s+(\d)/g, '$1,$2');
  text = text.replace(/(\d)\s+(\d)/g, '$1$2');
  text = text.replace(/(\d)\s+(\d)/g, '$1$2');

  const info = {
    vendorName: null,
    projectNames: [],
    lineItems: [],
    totalAmount: null,       // 合計金額（税込）
    subtotalAmount: null,    // 小計（税抜）
    date: null,
    filename: filename
  };

  // ── 日付抽出 ──
  // yyyy年mm月dd日、yyyy/mm/dd、yyyymmdd 等
  const datePatterns = [
    /(\d{4})年\s*(\d{1,2})月\s*(\d{1,2})日/,
    /(\d{4})\/(\d{1,2})\/(\d{1,2})/,
    /DATE\s+(\d{4})\/(\d{1,2})\/(\d{1,2})/i,
    /⽇付\s*[:：]\s*(\d{4})年\s*(\d{1,2})月\s*(\d{1,2})⽇/,
    /日付\s*[:：]\s*(\d{4})年\s*(\d{1,2})月\s*(\d{1,2})日/,
  ];
  for (const pattern of datePatterns) {
    const match = text.match(pattern);
    if (match) {
      info.date = `${match[1]}-${match[2].padStart(2, '0')}-${match[3].padStart(2, '0')}`;
      break;
    }
  }

  // ── 合計金額抽出 ──
  // 税込合計、合計金額、御請求金額、ご請求額、税込み金額 等
  const totalPatterns = [
    /(?:合計[⾦金]額|御請求[⾦金]額|ご請求[⾦金]?額|税込み[⾦金]額|税込[⾦金]額|振込[⾦金]額合計)\s*[\\¥￥]?\s*([\d,]+)\s*円?/,
    /(?:合計[⾦金]額|御請求[⾦金]額|ご請求[⾦金]?額)\s+([\d,]+)\s*円/,
    /[\\¥￥]([\d,]+)\s*$/m,
  ];
  for (const pattern of totalPatterns) {
    const match = text.match(pattern);
    if (match) {
      info.totalAmount = parseInt(match[1].replace(/,/g, ''), 10);
      break;
    }
  }

  // ── 小計（税抜）抽出 ──
  const subtotalPatterns = [
    /[⼩小]計\s*[\\¥￥]?\s*([\d,]+)\s*円?/,
    /合計\s*[\\¥￥]?\s*([\d,]+)/,  // 「合計」が税抜の場合もある
  ];
  for (const pattern of subtotalPatterns) {
    const match = text.match(pattern);
    if (match) {
      const val = parseInt(match[1].replace(/,/g, ''), 10);
      // 合計金額と異なる場合のみ小計として記録
      if (val !== info.totalAmount) {
        info.subtotalAmount = val;
        break;
      }
    }
  }

  // ── ベンダー名抽出 ──
  // PDF内の会社名・個人名を探す（「スキーマ」宛ではなく発行者側）

  // テキストから会社名を探す（スキーマ以外）
  const companyMatch = text.match(/(合同会社\s*[^\s御中様\n]{2,20}|株式会社\s*[^\s御中様\n]{2,20}|有限会社\s*[^\s御中様\n]{2,20})/g);
  if (companyMatch) {
    for (const name of companyMatch) {
      if (!name.includes('スキーマ')) {
        info.vendorName = name.replace(/\s+/g, '');
        break;
      }
    }
  }

  // 個人名・屋号パターン（会社名が見つからない場合）
  if (!info.vendorName) {
    const soloPatterns = [
      /タテジマ\s+[^\s\n]+/,       // タテジマ 大西晃
      /aoiem/i,
      /HAIKU/i,
      /S\.?SKYDESIGN/i,
      /umi\.?design/i,
    ];
    for (const p of soloPatterns) {
      const m = text.match(p);
      if (m) {
        info.vendorName = m[0].trim();
        break;
      }
    }
  }

  // ファイル名からベンダーヒントを取得（テキストから見つからなかった場合）
  if (!info.vendorName) {
    // 「請求書_○○様.pdf」パターン
    const fnPatterns = [
      /請求書[_\s]*(.+?)様/,                    // 請求書_クマハチデザイン様
      /([^\s_]{3,})様[_\s]*(?:請求書|ご請求書)/,  // ○○様_請求書（3文字以上）
    ];
    for (const p of fnPatterns) {
      const m = filename.match(p);
      if (m && m[1] && m[1].length >= 3) {
        // 「スキーマ」は宛先なので除外
        const candidate = m[1].trim();
        if (!candidate.includes('スキーマ') && !candidate.includes('御中')
            && !candidate.includes('様') && !candidate.match(/^\d/)) {
          info.vendorName = candidate;
          info.vendorFromFilename = true;
          break;
        }
      }
    }
  }

  // ── 案件名・明細行の抽出 ──
  // 【案件名:...】パターン
  const projectBracket = text.match(/【案件名\s*[:：]\s*(.+?)】/);
  if (projectBracket) {
    info.projectNames.push(projectBracket[1].trim());
  }

  // subject パターン（aoiem形式）
  const subjectMatch = text.match(/subject\s+(.+?)(?:\s+delivery|\s+納品|$)/m);
  if (subjectMatch) {
    const subj = subjectMatch[1].trim()
      .replace(/\s+関連$/, '')  // 「tate.lab プロジェクト関連」→「tate.lab プロジェクト」
      .trim();
    if (subj.length >= 2) {
      info.projectNames.push(subj);
    }
  }

  // 明細行の抽出: 「項目名 数量 単価 金額」のパターン
  // 様々なフォーマットに対応
  const lineItemPatterns = [
    // 「項目名 N式/N個/N人月 金額 金額」パターン
    /^(.+?)\s+(\d+)\s*(?:式|個|⼈⽉|人月|本|枚|回)\s+([\d,]+)\s+([\d,]+)/gm,
    // 「項目名 1式 金額 金額」パターン
    /^(.+?)\s+1\s*式\s+([\d,]+)\s+([\d,]+)/gm,
  ];

  // より柔軟な明細行抽出
  // テキストの各行を走査して金額っぽいパターンを持つ行を抽出
  const lines = text.split(/[\n\r]+/);
  for (const line of lines) {
    // 金額パターンを含む行（ヘッダ行、小計行、合計行、源泉行を除く）
    const skipWords = ['詳細', '数量', '単価', '金額', '項目', '⼩計', '小計',
                       '合計', '消費税', '振込', '源泉', '備考', '⾦額', '⾦ 額',
                       '項  ⽬', '単 価', '数 量'];
    if (skipWords.some(w => line.includes(w))) continue;

    // 明細行: テキスト + 数値のパターン
    const itemMatch = line.match(/^(.{3,50}?)\s+\d+\s*(?:式|個|⼈⽉|人月|⼈⽉)\s+([\d,]+)\s+([\d,]+)/);
    if (itemMatch) {
      info.lineItems.push({
        description: itemMatch[1].trim(),
        amount: parseInt(itemMatch[3].replace(/,/g, ''), 10)
      });
      // 説明から案件名のヒントを抽出
      const projectHint = extractProjectHint(itemMatch[1].trim());
      if (projectHint && !info.projectNames.includes(projectHint)) {
        info.projectNames.push(projectHint);
      }
    }
  }

  // テキスト全体から案件名のヒントを抽出（明細行で見つからなかった場合）
  if (info.projectNames.length === 0) {
    const hintPatterns = [
      // 「○○ リニューアル」「○○ 制作」等のプロジェクト名パターン
      /([\w\u3000-\u9FFF]+(?:リニューアル|制作|構築|開発|プロジェクト|サイト))/g,
      // 「○○ 2023年N月運用」パターン
      /([\w\u3000-\u9FFF]+)\s+\d{4}年\d{1,2}月(?:運用|運⽤)/g,
    ];
    // 除外ワード（ベンダー名や一般的すぎる語句）
    const excludeHints = ['請求書', '御請求書', '振込', '口座', '銀行', '支店',
                          'スキーマ', '御中', '下記', '浅見制作', '月次制作'];
    for (const pattern of hintPatterns) {
      let m;
      while ((m = pattern.exec(text)) !== null) {
        const hint = m[1].trim();
        if (hint.length > 1 && !info.projectNames.includes(hint)
            && !excludeHints.some(ex => hint.includes(ex))) {
          info.projectNames.push(hint);
        }
      }
    }
  }

  // 「浅見制作」「月次制作」等のベンダー名由来の案件名をフィルタ
  info.projectNames = info.projectNames.filter(p => {
    const badPatterns = ['浅見制作', '月次制作', '請求書', '御請求書'];
    return !badPatterns.some(bp => p === bp || p.startsWith(bp));
  });

  return info;
}

/**
 * 明細行の説明文からプロジェクト名のヒントを抽出
 * 例: 「コミックウォーカーリニューアル 設計・ディレクション費」→「コミックウォーカーリニューアル」
 * 例: 「ヒロ建工 2023年3月運用」→「ヒロ建工」
 */
function extractProjectHint(description) {
  // 「○○ 作業内容」のパターンから○○部分を取得
  const patterns = [
    /^(.+?)\s+(?:設計|ディレクション|デザイン|コーディング|開発|運用|運⽤|制作|構築|撮影|編集)/,
    /^(.+?)\s+\d{4}年/,
    /^(.+?)\s+(?:YouTube|LP|サイト|アプリ|サーバ)/i,
  ];
  for (const p of patterns) {
    const m = description.match(p);
    if (m && m[1].length >= 2) {
      return m[1].trim();
    }
  }
  return null;
}

// ── マッチングロジック ────────────────────────────────
/**
 * ベンダー名のファジーマッチ
 * PDFのベンダー名と vendor-data.json のベンダー名を比較
 */
function fuzzyVendorMatch(pdfVendor, dataVendor) {
  if (!pdfVendor || !dataVendor) return false;

  // 正規化: スペース除去、全角半角統一
  const normalize = (s) => s
    .replace(/[\s\u3000]+/g, '')
    .replace(/（/g, '(').replace(/）/g, ')')
    .replace(/\n/g, '')
    .toLowerCase();

  const a = normalize(pdfVendor);
  const b = normalize(dataVendor);

  // 完全一致
  if (a === b) return true;

  // 部分一致（一方が他方を含む）
  if (a.includes(b) || b.includes(a)) return true;

  // 「合同会社」「株式会社」を除いた名前で比較
  const stripCorp = (s) => s
    .replace(/合同会社|株式会社|有限会社/g, '')
    .replace(/[\(\)]/g, '');

  const sa = stripCorp(a);
  const sb = stripCorp(b);

  // 短すぎる名前での誤マッチを防止（3文字以上必要）
  if (sa && sb && sa.length >= 3 && sb.length >= 3 && (sa.includes(sb) || sb.includes(sa))) return true;

  // 特殊なマッピング（よくある表記ゆれ）
  // 同一ベンダーの複数表記をグループ化。グループ内のいずれか2つが a, b に一致すればマッチ
  const aliasGroups = [
    ['タテジマ', 'タテジマ（大西晃）', 'タテジマ大西晃', '大西晃', 'タテジマ⼤⻄晃'],
    ['浅見制作所', '合同会社浅見制作所', 'アザミセイサクシヨ'],
    ['aoiem', 'aoiem加藤健太', 'aoiem　加藤健太', '加藤健太', 'aoiem\n加藤健太'],
    ['umi.design', 'umi.design合同会社', 'umidesign'],
  ];

  for (const group of aliasGroups) {
    const normalizedGroup = group.map(g => normalize(g));
    const aMatch = normalizedGroup.some(g => a.includes(g) || g.includes(a));
    const bMatch = normalizedGroup.some(g => b.includes(g) || g.includes(b));
    // 両方がグループ内のいずれかにマッチする場合のみ同一ベンダーとみなす
    if (aMatch && bMatch) return true;
  }

  return false;
}

/**
 * 金額のマッチング（10%許容）
 * 税込・税抜の両方で比較
 */
function amountMatch(invoiceAmount, entryExTax, entryIncTax) {
  if (!invoiceAmount) return false;

  const tolerance = 0.10; // 10%許容

  const isClose = (a, b) => {
    if (b === 0) return false;
    return Math.abs(a - b) / b <= tolerance;
  };

  // 税込金額と比較
  if (entryIncTax > 0 && isClose(invoiceAmount, entryIncTax)) return true;
  // 税抜金額と比較
  if (entryExTax > 0 && isClose(invoiceAmount, entryExTax)) return true;
  // 税抜×1.1と比較（税込が0の場合）
  if (entryExTax > 0 && isClose(invoiceAmount, entryExTax * 1.1)) return true;
  // 税抜×1.08と比較（旧税率）
  if (entryExTax > 0 && isClose(invoiceAmount, entryExTax * 1.08)) return true;

  return false;
}

/**
 * 月のマッチング（±1ヶ月の許容）
 * @param {string} invoiceDate "YYYY-MM-DD" 形式
 * @param {string} entryPeriod "YYYY-MM" 形式
 */
function periodMatch(invoiceDate, entryPeriod) {
  if (!invoiceDate || !entryPeriod) return false;

  const invoiceYM = invoiceDate.substring(0, 7); // "YYYY-MM"

  // 完全一致
  if (invoiceYM === entryPeriod) return true;

  // ±1ヶ月
  const [iy, im] = invoiceYM.split('-').map(Number);
  const [ey, em] = entryPeriod.split('-').map(Number);

  const invoiceMonths = iy * 12 + im;
  const entryMonths = ey * 12 + em;

  return Math.abs(invoiceMonths - entryMonths) <= 1;
}

/**
 * プロジェクト名が汎用的（修正対象）かどうか判定
 */
function isGenericProject(projectName) {
  if (!projectName) return false;
  return GENERIC_PROJECT_NAMES.some(g =>
    projectName === g || projectName.includes(g)
  );
}

// ── ディレクトリスキャン ──────────────────────────────
/**
 * 指定ディレクトリ配下の全PDFファイルパスを取得
 */
function findPDFs(baseDir) {
  const pdfs = [];

  if (!fs.existsSync(baseDir)) {
    console.error(`エラー: ディレクトリが見つかりません: ${baseDir}`);
    return pdfs;
  }

  const monthDirs = fs.readdirSync(baseDir);
  for (const monthDir of monthDirs) {
    const monthPath = path.join(baseDir, monthDir);
    if (!fs.statSync(monthPath).isDirectory()) continue;

    const files = fs.readdirSync(monthPath);
    for (const file of files) {
      if (file.toLowerCase().endsWith('.pdf')) {
        pdfs.push({
          filepath: path.join(monthPath, file),
          filename: file,
          monthDir: monthDir
        });
      }
    }
  }

  return pdfs;
}

// ── メイン処理 ────────────────────────────────────────
async function main() {
  console.log(`\n===== 請求書スキャン: ${year}年 =====\n`);

  // vendor-data.json の読み込み
  if (!fs.existsSync(VENDOR_DATA_PATH)) {
    console.error(`エラー: vendor-data.json が見つかりません: ${VENDOR_DATA_PATH}`);
    process.exit(1);
  }
  const vendorData = JSON.parse(fs.readFileSync(VENDOR_DATA_PATH, 'utf-8'));

  // 既存の corrections を読み込み
  let corrections = { corrections: {}, updatedAt: null };
  if (fs.existsSync(CORRECTIONS_PATH)) {
    corrections = JSON.parse(fs.readFileSync(CORRECTIONS_PATH, 'utf-8'));
  }

  // 対象年のエントリを月ごとに収集
  const yearMonths = vendorData.months.filter(m => m.period.startsWith(year));
  if (yearMonths.length === 0) {
    console.error(`エラー: ${year}年のデータが vendor-data.json に見つかりません`);
    process.exit(1);
  }
  console.log(`vendor-data.json: ${year}年のデータ ${yearMonths.length}ヶ月分を読み込み`);

  // PDFファイルの取得
  const pdfFiles = findPDFs(SAMPLE_DIR);
  if (pdfFiles.length === 0) {
    console.error(`エラー: PDFファイルが見つかりません: ${SAMPLE_DIR}`);
    process.exit(1);
  }
  console.log(`PDFファイル: ${pdfFiles.length}件を検出\n`);

  // 統計
  let totalProcessed = 0;
  let totalExtracted = 0;
  let totalMatched = 0;
  let totalNewCorrections = 0;
  let totalSkipped = 0;
  let totalErrors = 0;

  // 各PDFを処理
  for (const pdf of pdfFiles) {
    totalProcessed++;
    process.stdout.write(`[${totalProcessed}/${pdfFiles.length}] ${pdf.filename} ... `);

    try {
      // PDFテキスト抽出
      const text = await extractTextFromPDF(pdf.filepath);

      if (!text || text.trim().length < 10) {
        console.log('テキスト不足 → スキップ');
        totalSkipped++;
        continue;
      }

      // 請求書情報の抽出
      const invoice = extractInvoiceInfo(text, pdf.filename);
      totalExtracted++;

      // 月ディレクトリ名から月を推定（例: "2023年3月" → "2023-03"）
      const monthMatch = pdf.monthDir.match(/(\d{4})年(\d{1,2})月/);
      const folderPeriod = monthMatch
        ? `${monthMatch[1]}-${monthMatch[2].padStart(2, '0')}`
        : null;

      // デバッグ情報
      const vendorShort = invoice.vendorName ? invoice.vendorName.substring(0, 20) : '不明';
      const projects = invoice.projectNames.length > 0
        ? invoice.projectNames.join(', ').substring(0, 40)
        : '案件名なし';

      console.log(`ベンダー: ${vendorShort} / 金額: ${invoice.totalAmount || '不明'} / 案件: ${projects}`);

      if (!invoice.vendorName) {
        totalSkipped++;
        continue;
      }

      // vendor-data.json のエントリとマッチング
      // フォルダの月、または請求書日付の月で検索
      const targetPeriod = folderPeriod || (invoice.date ? invoice.date.substring(0, 7) : null);
      if (!targetPeriod) {
        console.log('  → 対象月を特定できず → スキップ');
        totalSkipped++;
        continue;
      }

      // 対象月のエントリを取得（±1ヶ月含む）
      const candidateMonths = vendorData.months.filter(m => {
        const [my, mm] = m.period.split('-').map(Number);
        const [ty, tm] = targetPeriod.split('-').map(Number);
        return Math.abs((my * 12 + mm) - (ty * 12 + tm)) <= 1;
      });

      // マッチするエントリを探す
      let matched = false;
      for (const month of candidateMonths) {
        for (const entry of month.entries) {
          // ベンダー名マッチ
          if (!fuzzyVendorMatch(invoice.vendorName, entry.vendor)) continue;

          // 金額マッチ（請求書の合計金額 or 小計金額）
          const amtMatch =
            amountMatch(invoice.totalAmount, entry.amountExTax, entry.amountIncTax) ||
            amountMatch(invoice.subtotalAmount, entry.amountExTax, entry.amountIncTax);

          // 金額マッチしなくても、ベンダー名＋月が合っていれば候補として記録
          // ただし修正は金額一致した場合のみ
          if (!amtMatch) continue;

          matched = true;
          totalMatched++;

          // 汎用プロジェクト名のみ修正対象
          if (!isGenericProject(entry.project)) {
            // 既に具体的な案件名がある → スキップ
            continue;
          }

          // 請求書から案件名が取れた場合のみ修正
          if (invoice.projectNames.length === 0) continue;

          // 既存の corrections に同じエントリがないか確認
          const vendorKey = entry.vendor;
          if (!corrections.corrections[vendorKey]) {
            corrections.corrections[vendorKey] = { entryCorrections: [] };
          }

          const existingCorrections = corrections.corrections[vendorKey].entryCorrections;
          const alreadyExists = existingCorrections.some(c =>
            c.period === month.period &&
            c.originalProject === entry.project &&
            c.amount === entry.amountExTax
          );

          if (alreadyExists) {
            // 既存の修正は上書きしない（手動入力を保護）
            continue;
          }

          // 新規修正候補を追加
          // 案件名を整形（長すぎるものは短縮、不要な情報を除去）
          let correctedProject = invoice.projectNames[0];
          // 個人情報（電話番号、住所等）が含まれていたら除去
          correctedProject = correctedProject
            .replace(/\s*\d{2,4}-\d{2,4}-\d{4}\s*/g, '')      // 電話番号
            .replace(/\s*代表\s*.+$/g, '')                      // 「代表 加藤 健太」
            .replace(/\s*納品済み\s*/g, '')                      // 「納品済み」
            .replace(/\s*0\d{1,3}-\d{3,4}-\d{4}\s*/g, '')     // 電話番号（一般）
            .replace(/\s*埼玉りそな.*$/g, '')                    // 振込先情報
            .replace(/\s*完了\s*$/g, '')                         // 末尾の「完了」
            .replace(/\s*要相談\s*/g, '')                        // 「要相談」
            .replace(/\s*関連\s*$/g, '')                         // 末尾の「関連」を除去
            .replace(/\s+/g, ' ')                               // 複数スペースを1つに
            .trim();
          // 50文字を超える案件名は短縮
          if (correctedProject.length > 50) {
            correctedProject = correctedProject.substring(0, 50);
          }
          // 空になったらスキップ
          if (!correctedProject || correctedProject.length < 2) continue;
          existingCorrections.push({
            period: month.period,
            originalProject: entry.project,
            amount: entry.amountExTax,
            correctedProject: correctedProject,
            source: 'scan-invoices',   // 自動スキャンで生成された修正であることを記録
            sourceFile: pdf.filename
          });

          totalNewCorrections++;
          console.log(`  → 修正候補: [${month.period}] ${entry.vendor} "${entry.project}" → "${correctedProject}" (¥${entry.amountExTax.toLocaleString()})`);
        }
      }

      if (!matched) {
        // マッチしなかった場合
        // ログに出力するが何もしない
      }

    } catch (err) {
      console.log(`エラー: ${err.message}`);
      totalErrors++;
    }
  }

  // corrections を保存
  corrections.updatedAt = new Date().toISOString();
  fs.writeFileSync(CORRECTIONS_PATH, JSON.stringify(corrections, null, 2), 'utf-8');

  // サマリー出力
  console.log('\n===== スキャン結果サマリー =====');
  console.log(`処理PDF数:     ${totalProcessed}`);
  console.log(`テキスト抽出:  ${totalExtracted}`);
  console.log(`マッチ成功:    ${totalMatched}`);
  console.log(`新規修正候補:  ${totalNewCorrections}`);
  console.log(`スキップ:      ${totalSkipped}`);
  console.log(`エラー:        ${totalErrors}`);
  console.log(`\n修正ファイル: ${CORRECTIONS_PATH}`);
  console.log(`合計修正数:    ${Object.values(corrections.corrections).reduce((sum, v) => sum + v.entryCorrections.length, 0)}`);
  console.log('================================\n');
}

main().catch(err => {
  console.error('致命的エラー:', err);
  process.exit(1);
});
