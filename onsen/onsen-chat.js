/* 温泉ソムリエ ノート — サイト内AIチャット「湯守（ゆもり）」
   - APIキーなし: 知識ベースのキーワード検索で該当章を案内
   - APIキーあり: Claude API（ブラウザ直叩き・ストリーミング）で会話
   APIキーは analyze.html と共通の localStorage キー 'anthropic_api_key' を使用 */
(function () {
  'use strict';

  var CHAT_MODEL = 'claude-sonnet-5';
  var STORE_KEY = 'anthropic_api_key';
  var HISTORY_KEY = 'onsen_chat_history';
  var SECTIONS = window.ONSEN_KB_SECTIONS || [];
  var ANCHORS = window.ONSEN_CH_ANCHORS || {};
  var messages = [];      // {role, content}
  var busy = false;

  /* ---------- styles ---------- */
  var css = [
    '#yumoriFab{position:fixed;right:20px;bottom:20px;z-index:1000;width:56px;height:56px;border-radius:9999px;',
    'background:#2b4374;color:#fff;border:none;box-shadow:0 6px 20px rgba(30,45,75,.35);cursor:pointer;',
    'display:flex;align-items:center;justify-content:center;font-size:26px;line-height:1;transition:transform .15s}',
    '#yumoriFab:hover{transform:scale(1.06)}',
    '#yumoriFab .badge{position:absolute;top:-4px;right:-4px;background:#cd4f3a;color:#fff;font-size:10px;',
    'font-weight:700;padding:2px 6px;border-radius:9999px;font-family:Inter,sans-serif}',
    '#yumoriPanel{position:fixed;right:20px;bottom:88px;z-index:1000;width:390px;max-width:calc(100vw - 32px);',
    'height:600px;max-height:calc(100vh - 120px);background:#fffdf9;border:1px solid #e6ddcc;border-radius:16px;',
    'box-shadow:0 18px 50px rgba(30,45,75,.25);display:none;flex-direction:column;overflow:hidden}',
    '#yumoriPanel.open{display:flex}',
    '#yumoriHead{background:#2b4374;color:#fff;padding:14px 16px;display:flex;align-items:center;justify-content:space-between;flex-shrink:0}',
    '#yumoriHead .t{font-family:"Noto Serif JP",serif;font-weight:700;font-size:15px}',
    '#yumoriHead .s{font-size:11px;color:#c2d3e8;margin-top:2px}',
    '#yumoriHead button{background:transparent;border:none;color:#c2d3e8;cursor:pointer;padding:4px;line-height:0}',
    '#yumoriHead button:hover{color:#fff}',
    '#yumoriBody{flex:1;overflow-y:auto;padding:16px;font-size:13.5px;line-height:1.85;color:#4c4638}',
    '.ym-msg{margin-bottom:14px;display:flex;gap:8px}',
    '.ym-msg.u{justify-content:flex-end}',
    '.ym-bub{max-width:86%;padding:9px 13px;border-radius:14px;white-space:pre-wrap;word-break:break-word}',
    '.ym-msg.u .ym-bub{background:#2b4374;color:#fff;border-bottom-right-radius:4px}',
    '.ym-msg.a .ym-bub{background:#f2ede2;border:1px solid #e6ddcc;border-bottom-left-radius:4px}',
    '.ym-bub a{color:#cd4f3a;text-decoration:underline}',
    '.ym-msg.u .ym-bub a{color:#fff}',
    '.ym-bub strong{font-weight:700;color:#28231d}',
    '.ym-msg.u .ym-bub strong{color:#fff}',
    '.ym-intro{color:#7d7160;font-size:12.5px;line-height:1.8}',
    '.ym-chip{display:inline-block;margin:4px 4px 0 0;padding:6px 11px;border:1px solid #c2d3e8;background:#f0f4fa;',
    'color:#2b4374;border-radius:9999px;font-size:12px;cursor:pointer}',
    '.ym-chip:hover{background:#dde7f3}',
    '#yumoriFoot{border-top:1px solid #e6ddcc;padding:10px;flex-shrink:0;background:#faf7f1}',
    '#yumoriForm{display:flex;gap:8px;align-items:flex-end}',
    '#yumoriInput{flex:1;resize:none;border:1px solid #d4c8b0;border-radius:10px;padding:9px 11px;font-size:13.5px;',
    'font-family:inherit;line-height:1.5;max-height:96px;background:#fffdf9;color:#4c4638}',
    '#yumoriInput:focus{outline:none;border-color:#3f66a8;box-shadow:0 0 0 3px rgba(63,102,168,.15)}',
    '#yumoriSend{width:38px;height:38px;border-radius:10px;background:#2b4374;color:#fff;border:none;cursor:pointer;',
    'display:flex;align-items:center;justify-content:center;flex-shrink:0}',
    '#yumoriSend:disabled{background:#d4c8b0;cursor:not-allowed}',
    '#yumoriMode{font-size:10.5px;color:#a89a82;margin-top:6px;display:flex;justify-content:space-between;align-items:center}',
    '#yumoriMode button{background:none;border:none;color:#3f66a8;text-decoration:underline;cursor:pointer;font-size:10.5px;padding:0}',
    '.ym-dots span{display:inline-block;width:5px;height:5px;border-radius:50%;background:#a89a82;margin-right:3px;',
    'animation:ymb 1.2s infinite ease-in-out}',
    '.ym-dots span:nth-child(2){animation-delay:.18s}.ym-dots span:nth-child(3){animation-delay:.36s}',
    '@keyframes ymb{0%,80%,100%{opacity:.3}40%{opacity:1}}',
    '@media (max-width:640px){#yumoriPanel{right:8px;left:8px;bottom:80px;width:auto;height:calc(100vh - 110px)}}',
    '@media print{#yumoriFab,#yumoriPanel{display:none !important}}'
  ].join('');

  /* ---------- helpers ---------- */
  function esc(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }
  // 出典表記「第N章」と [表示文](#anchor) をリンクに変換 + 簡易マークダウン
  function render(text) {
    var h = esc(text);
    h = h.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
    // 明示リンク [テキスト](#anchor)
    h = h.replace(/\[([^\]\n]+)\]\(#([A-Za-z0-9_-]+)\)/g, function (m, label, a) {
      return '<a href="#' + a + '" data-jump="' + a + '">' + label + '</a>';
    });
    // 「第N章」の自動リンク（すでにリンク内にあるものは除く）
    h = h.replace(/第(\d{1,2})章/g, function (m, n) {
      var a = ANCHORS[parseInt(n, 10)];
      return a ? '<a href="#' + a + '" data-jump="' + a + '">' + m + '</a>' : m;
    });
    // 二重リンク化の後始末（<a ...>...<a ...>第N章</a>...</a> を防ぐ）
    h = h.replace(/<a ([^>]+)>([^<]*)<a [^>]+>([^<]+)<\/a>([^<]*)<\/a>/g, '<a $1>$2$3$4</a>');
    return h;
  }
  function getKey() { try { return localStorage.getItem(STORE_KEY) || ''; } catch (e) { return ''; } }
  function el(id) { return document.getElementById(id); }
  function scrollDown() { var b = el('yumoriBody'); if (b) b.scrollTop = b.scrollHeight; }

  /* ---------- キーワード検索（APIキーなしモード） ---------- */
  // 日本語は分かち書きできないので文字バイグラムで照合する
  function bigrams(s) {
    var t = String(s).replace(/[\s、。，．,.?？!！「」『』（）()・…\-—]/g, '');
    var out = [], seen = {};
    for (var i = 0; i < t.length - 1; i++) {
      var g = t.substr(i, 2);
      if (!seen[g]) { seen[g] = 1; out.push(g); }
    }
    return out;
  }
  function countHits(grams, hay) {
    var n = 0;
    for (var i = 0; i < grams.length; i++) if (hay.indexOf(grams[i]) !== -1) n++;
    return n;
  }

  function searchKB(q) {
    var qb = bigrams(q);
    var scored = SECTIONS.map(function (s) {
      var score = 0;
      // 1. 登録キーワードの完全一致（長いほど具体的とみなす）
      s.keywords.forEach(function (k) { if (q.indexOf(k) !== -1) score += 6 + k.length; });
      // 2. タイトルとの一致は重く
      score += countHits(qb, s.title) * 3;
      // 3. キーワード群との一致
      score += countHits(qb, s.keywords.join(' ')) * 1.5;
      // 4. 本文との一致（頭打ちあり）
      score += Math.min(countHits(qb, s.body), 14) * 0.5;
      return { s: s, score: score };
    }).filter(function (x) { return x.score >= 6; })
      .sort(function (a, b) { return b.score - a.score; })
      .slice(0, 3);

    if (!scored.length) {
      return 'ごめんなさい、その話題はノート内で見つけられませんでした。\n「秩父の泉質は？」「美人の湯とは？」「銭湯の料金は？」のように聞いてみてください。\n\nAPIキーを設定すると、AIが文脈をふまえて答えられるようになります。';
    }
    var out = 'ノートから関連しそうな箇所を探しました（キーワード検索モード）。\n\n';
    scored.forEach(function (x) {
      // 本文を行ごとに採点し、質問にいちばん近い行を抜き出す
      var lines = x.s.body.split('\n').map(function (l) {
        var sc = countHits(qb, l);
        x.s.keywords.forEach(function (k) {
          if (q.indexOf(k) !== -1 && l.indexOf(k) !== -1) sc += 4;
        });
        return { l: l, sc: sc };
      }).filter(function (o) { return o.sc > 0; })
        .sort(function (a, b) { return b.sc - a.sc; })
        .slice(0, 2).map(function (o) { return o.l; });
      var snippet = (lines.length ? lines : x.s.body.split('\n').slice(0, 1)).join('\n');
      if (snippet.length > 200) snippet = snippet.slice(0, 200) + '…';
      var label = (x.s.ch ? '第' + x.s.ch + '章 ' : '') + x.s.title;
      out += '**[' + label + '](#' + x.s.anchor + ')**\n' + snippet + '\n\n';
    });
    out += 'くわしくは各章をご覧ください。';
    return out;
  }

  /* ---------- system prompt ---------- */
  function systemPrompt() {
    var kb = SECTIONS.map(function (s) {
      return '## ' + (s.ch ? '第' + s.ch + '章: ' : '') + s.title + '\n' + s.body;
    }).join('\n\n');
    return [
      'あなたは「湯守（ゆもり）」。温泉サイト「温泉ソムリエ ノート」（onsen.schema.tokyo）に常駐する、温泉と埼玉の温浴文化に詳しい案内役です。',
      '',
      '# 役割',
      '- 下の知識ベース（このサイト全18章の内容）を根拠に、来訪者の質問に日本語で答える。',
      '- 温泉ソムリエの知識（泉質・適応症・入浴法）と、埼玉/秩父のローカル情報の両方を扱う。',
      '',
      '# 回答ルール',
      '- 知識ベースに書かれていることを最優先で使い、根拠にした章を「（第11章）」のように必ず添える。数字で示せるものは数字で答える。',
      '- 知識ベースにない話題は、一般知識で補ってよいが「ノートには載っていませんが」と断る。推測を事実として断定しない。',
      '- 長さは3〜6文程度を基本に、簡潔に。箇条書きは「・」を使い、最大5項目。見出しは使わない。',
      '- 強調は **太字** を使う。表やコードブロックは使わない。',
      '- 医療的な判断が絡む質問（持病・妊娠・薬など）は、禁忌症の情報を伝えたうえで「最終的には医師に相談を」と添える。',
      '- 施設の営業時間・料金・休業は変動するため、必ず「公式サイトで最新情報の確認を」と添える。',
      '- 親しみやすく、湯上がりのように落ち着いた口調。絵文字は使わず、♨ のみ必要なら1つまで。',
      '',
      '# 知識ベース（全18章の要約）',
      kb
    ].join('\n');
  }

  /* ---------- Claude API（ストリーミング） ---------- */
  function askClaude(userText, onDelta) {
    var key = getKey();
    var body = {
      model: CHAT_MODEL,
      max_tokens: 1024,
      stream: true,
      system: [{ type: 'text', text: systemPrompt(), cache_control: { type: 'ephemeral' } }],
      messages: messages.concat([{ role: 'user', content: userText }]).slice(-12)
    };
    return fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': key,
        'anthropic-version': '2023-06-01',
        'anthropic-dangerous-direct-browser-access': 'true'
      },
      body: JSON.stringify(body)
    }).then(function (res) {
      if (!res.ok) {
        return res.text().then(function (t) {
          var msg = 'APIエラー (' + res.status + ')';
          try { var j = JSON.parse(t); if (j.error && j.error.message) msg = j.error.message; } catch (e) {}
          throw new Error(msg);
        });
      }
      var reader = res.body.getReader();
      var dec = new TextDecoder();
      var buf = '', full = '';
      function pump() {
        return reader.read().then(function (r) {
          if (r.done) return full;
          buf += dec.decode(r.value, { stream: true });
          var lines = buf.split('\n');
          buf = lines.pop();
          lines.forEach(function (line) {
            if (line.indexOf('data:') !== 0) return;
            var payload = line.slice(5).trim();
            if (!payload || payload === '[DONE]') return;
            try {
              var ev = JSON.parse(payload);
              if (ev.type === 'content_block_delta' && ev.delta && ev.delta.text) {
                full += ev.delta.text;
                onDelta(full);
              }
            } catch (e) {}
          });
          return pump();
        });
      }
      return pump();
    });
  }

  /* ---------- UI ---------- */
  var SUGGESTIONS = [
    '秩父の温泉はなぜ冷たいの？',
    '美人の湯ってどういう意味？',
    '冷え性に効く泉質は？',
    '埼玉の銭湯は何軒ある？',
    '温泉と療養泉の違いは？'
  ];

  function introHTML() {
    var hasKey = !!getKey();
    return '<div class="ym-intro">' +
      'こんにちは。このサイト全18章の内容から、温泉のことをお答えします。' +
      (hasKey ? '' : '<br><br>いまは<strong>キーワード検索モード</strong>で、質問に関連する章をご案内します。AIとの対話をご希望なら、下の「AI設定」からご自身のAnthropic APIキーを設定してください（ブラウザ内にのみ保存されます）。') +
      '</div><div style="margin-top:10px">' +
      SUGGESTIONS.map(function (s) { return '<span class="ym-chip" data-q="' + esc(s) + '">' + esc(s) + '</span>'; }).join('') +
      '</div>';
  }

  function build() {
    var style = document.createElement('style');
    style.textContent = css;
    document.head.appendChild(style);

    var fab = document.createElement('button');
    fab.id = 'yumoriFab';
    fab.setAttribute('aria-label', '温泉について質問する');
    fab.innerHTML = '♨<span class="badge">AI</span>';
    document.body.appendChild(fab);

    var panel = document.createElement('div');
    panel.id = 'yumoriPanel';
    panel.setAttribute('role', 'dialog');
    panel.setAttribute('aria-label', '温泉チャット 湯守');
    panel.innerHTML =
      '<div id="yumoriHead">' +
        '<div><div class="t">♨ 湯守（ゆもり）</div><div class="s">このノートの内容からお答えします</div></div>' +
        '<button id="yumoriClose" aria-label="閉じる">' +
          '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 6L6 18M6 6l12 12"/></svg>' +
        '</button>' +
      '</div>' +
      '<div id="yumoriBody"></div>' +
      '<div id="yumoriFoot">' +
        '<form id="yumoriForm">' +
          '<textarea id="yumoriInput" rows="1" placeholder="温泉のことを聞いてみてください" aria-label="質問を入力"></textarea>' +
          '<button id="yumoriSend" type="submit" aria-label="送信">' +
            '<svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z"/></svg>' +
          '</button>' +
        '</form>' +
        '<div id="yumoriMode"><span id="yumoriModeText"></span><button id="yumoriKeyBtn" type="button">AI設定</button></div>' +
      '</div>';
    document.body.appendChild(panel);

    el('yumoriBody').innerHTML = introHTML();
    updateMode();

    fab.addEventListener('click', function () {
      panel.classList.toggle('open');
      if (panel.classList.contains('open')) {
        updateMode();                       // 別タブでキーを設定した場合に追随
        if (!messages.length && !el('yumoriBody').querySelector('.ym-msg')) {
          el('yumoriBody').innerHTML = introHTML();
        }
        el('yumoriInput').focus();
        scrollDown();
      }
    });
    el('yumoriClose').addEventListener('click', function () { panel.classList.remove('open'); });
    el('yumoriForm').addEventListener('submit', function (e) { e.preventDefault(); send(el('yumoriInput').value); });
    el('yumoriInput').addEventListener('keydown', function (e) {
      if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(this.value); }
    });
    el('yumoriInput').addEventListener('input', function () {
      this.style.height = 'auto'; this.style.height = Math.min(this.scrollHeight, 96) + 'px';
    });
    el('yumoriKeyBtn').addEventListener('click', promptKey);
    el('yumoriBody').addEventListener('click', function (e) {
      var chip = e.target.closest('.ym-chip');
      if (chip) { send(chip.getAttribute('data-q')); return; }
      var jump = e.target.closest('[data-jump]');
      if (jump && window.innerWidth < 640) panel.classList.remove('open');
    });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && panel.classList.contains('open')) panel.classList.remove('open');
    });
  }

  function updateMode() {
    var t = el('yumoriModeText');
    if (!t) return;
    t.textContent = getKey() ? 'AI対話モード（' + CHAT_MODEL + '）' : 'キーワード検索モード';
  }

  function promptKey() {
    var cur = getKey();
    var v = window.prompt(
      'Anthropic APIキーを入力してください（ブラウザ内にのみ保存され、外部サーバには送信されません）。\n' +
      '空欄で保存すると削除します。\nキーの取得: console.anthropic.com/settings/keys', cur);
    if (v === null) return;
    try {
      if (v.trim()) localStorage.setItem(STORE_KEY, v.trim());
      else localStorage.removeItem(STORE_KEY);
    } catch (e) {}
    updateMode();
    if (!messages.length) el('yumoriBody').innerHTML = introHTML();
  }

  function addMsg(role, html) {
    var d = document.createElement('div');
    d.className = 'ym-msg ' + (role === 'user' ? 'u' : 'a');
    d.innerHTML = '<div class="ym-bub">' + html + '</div>';
    el('yumoriBody').appendChild(d);
    scrollDown();
    return d.querySelector('.ym-bub');
  }

  function send(text) {
    text = (text || '').trim();
    if (!text || busy) return;
    var input = el('yumoriInput');
    input.value = ''; input.style.height = 'auto';

    // 初回はイントロを消す
    var intro = el('yumoriBody').querySelector('.ym-intro');
    if (intro) el('yumoriBody').innerHTML = '';

    addMsg('user', esc(text));

    if (!getKey()) {
      addMsg('assistant', render(searchKB(text)));
      return;
    }

    busy = true;
    el('yumoriSend').disabled = true;
    var bub = addMsg('assistant', '<span class="ym-dots"><span></span><span></span><span></span></span>');

    askClaude(text, function (partial) { bub.innerHTML = render(partial); scrollDown(); })
      .then(function (full) {
        messages.push({ role: 'user', content: text });
        messages.push({ role: 'assistant', content: full });
        bub.innerHTML = render(full);
      })
      .catch(function (err) {
        bub.innerHTML = render('うまく応答できませんでした（' + (err.message || 'エラー') + '）。\n' +
          'APIキーをご確認のうえ、もう一度お試しください。かわりにキーワード検索でお探しします。\n\n' + searchKB(text));
      })
      .then(function () { busy = false; el('yumoriSend').disabled = false; scrollDown(); });
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', build);
  else build();
})();
