<!DOCTYPE html>
<html lang="ja">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>口コミ掲示板 | 中山田青少年育成会</title>
  <script src="https://cdn.tailwindcss.com"></script>
  <script>
    tailwind.config = {
      theme: {
        extend: {
          colors: {
            sky: { 500: '#2D9CDB', 600: '#2588C2', 700: '#1B6FA3', 50: '#EBF5FB', 100: '#D6EBF8' },
            forest: { 500: '#27AE60', 600: '#219A52', 700: '#1B8244', 50: '#E8F5E9', 100: '#C8E6C9' },
            warm: { bg: '#F8FAF8', surface: '#FFFFFF', border: '#E2E8F0' }
          },
          fontFamily: {
            sans: ['Inter', 'Hiragino Sans', 'Hiragino Kaku Gothic ProN', 'Noto Sans JP', 'sans-serif']
          }
        }
      }
    }
  </script>
</head>
<body class="bg-warm-bg min-h-screen">

  <header class="bg-white border-b border-warm-border sticky top-0 z-10">
    <div class="max-w-lg mx-auto px-4 py-3 flex items-center gap-3">
      <a href="index.html" class="w-8 h-8 inline-flex items-center justify-center rounded-lg hover:bg-slate-100 transition-colors" aria-label="ホームに戻る">
        <svg class="w-5 h-5 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"/></svg>
      </a>
      <h1 class="text-lg font-bold text-slate-900">口コミ掲示板</h1>
    </div>
  </header>

  <main class="max-w-lg mx-auto px-4 py-6">

    <!-- 投稿フォーム -->
    <section class="mb-6">
      <div class="bg-white rounded-xl border border-warm-border p-5">
        <h2 class="text-base font-bold text-slate-900 mb-3 flex items-center gap-2">
          <svg class="w-5 h-5 text-sky-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/></svg>
          投稿する
        </h2>
        <form id="post-form" class="space-y-3">
          <div class="leading-normal">
            <label class="block text-sm font-medium text-slate-700 mb-1">ニックネーム</label>
            <input type="text" id="nickname" placeholder="匿名さん" maxlength="20"
              class="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-sky-500/50 focus:border-sky-500 caret-sky-500 transition-colors">
          </div>
          <div class="leading-normal">
            <label class="block text-sm font-medium text-slate-700 mb-1">カテゴリ</label>
            <div class="flex flex-wrap gap-2">
              <label class="inline-flex items-center gap-1.5 cursor-pointer">
                <input type="radio" name="category" value="やりたいこと" checked class="text-sky-500 focus:ring-sky-500/50">
                <span class="text-sm text-slate-700">やりたいこと</span>
              </label>
              <label class="inline-flex items-center gap-1.5 cursor-pointer">
                <input type="radio" name="category" value="お悩み" class="text-sky-500 focus:ring-sky-500/50">
                <span class="text-sm text-slate-700">お悩み</span>
              </label>
              <label class="inline-flex items-center gap-1.5 cursor-pointer">
                <input type="radio" name="category" value="情報共有" class="text-sky-500 focus:ring-sky-500/50">
                <span class="text-sm text-slate-700">情報共有</span>
              </label>
              <label class="inline-flex items-center gap-1.5 cursor-pointer">
                <input type="radio" name="category" value="その他" class="text-sky-500 focus:ring-sky-500/50">
                <span class="text-sm text-slate-700">その他</span>
              </label>
            </div>
          </div>
          <div class="leading-normal">
            <label class="block text-sm font-medium text-slate-700 mb-1">本文 <span class="text-red-500">*</span></label>
            <textarea id="body" rows="4" maxlength="1000" required placeholder="やりたいこと、お悩み、情報など気軽に書いてみましょう"
              class="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-sky-500/50 focus:border-sky-500 caret-sky-500 resize-none transition-colors"></textarea>
            <p class="text-xs text-slate-400 mt-1 text-right"><span id="char-count">0</span>/1000</p>
          </div>
          <button type="submit" id="submit-btn"
            class="w-full inline-flex items-center justify-center gap-2 h-11 px-4 text-sm font-medium bg-sky-500 text-white rounded-lg hover:bg-sky-600 cursor-pointer transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"/></svg>
            投稿する
          </button>
        </form>
        <div id="post-message" class="hidden mt-3 text-sm text-center rounded-lg p-3"></div>
      </div>
    </section>

    <!-- カテゴリフィルター -->
    <div class="flex gap-2 overflow-x-auto pb-3 mb-4 -mx-4 px-4" id="filter-bar">
      <button data-cat="all" class="flex-shrink-0 px-3 py-1.5 rounded-full text-sm font-medium bg-sky-500 text-white cursor-pointer transition-colors">すべて</button>
      <button data-cat="やりたいこと" class="flex-shrink-0 px-3 py-1.5 rounded-full text-sm font-medium bg-white text-slate-600 border border-warm-border cursor-pointer hover:bg-slate-50 transition-colors">やりたいこと</button>
      <button data-cat="お悩み" class="flex-shrink-0 px-3 py-1.5 rounded-full text-sm font-medium bg-white text-slate-600 border border-warm-border cursor-pointer hover:bg-slate-50 transition-colors">お悩み</button>
      <button data-cat="情報共有" class="flex-shrink-0 px-3 py-1.5 rounded-full text-sm font-medium bg-white text-slate-600 border border-warm-border cursor-pointer hover:bg-slate-50 transition-colors">情報共有</button>
      <button data-cat="その他" class="flex-shrink-0 px-3 py-1.5 rounded-full text-sm font-medium bg-white text-slate-600 border border-warm-border cursor-pointer hover:bg-slate-50 transition-colors">その他</button>
    </div>

    <!-- 投稿一覧 -->
    <div id="posts-container" class="space-y-3">
      <div class="text-center py-12">
        <svg class="w-8 h-8 text-slate-300 mx-auto mb-2 animate-spin" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path></svg>
        <p class="text-sm text-slate-400">読み込み中...</p>
      </div>
    </div>

  </main>

  <footer class="bg-white border-t border-warm-border mt-8">
    <div class="max-w-lg mx-auto px-4 py-6 text-center">
      <p class="text-xs text-slate-500">中山田青少年育成会</p>
      <p class="text-xs text-slate-400 mt-1">会長: 橋本 健太郎 / 〒368 秩父市中山田</p>
      <p class="text-xs text-slate-400 mt-1">&copy; 2026 Nakayamada Ikuseikai</p>
    </div>
  </footer>

  <script>
    const API_URL = 'board-api.php';
    let currentFilter = 'all';

    // カテゴリ色マップ
    const catColors = {
      'やりたいこと': { bg: 'bg-sky-100', text: 'text-sky-700' },
      'お悩み': { bg: 'bg-amber-100', text: 'text-amber-700' },
      '情報共有': { bg: 'bg-forest-100', text: 'text-forest-700' },
      'その他': { bg: 'bg-slate-100', text: 'text-slate-700' }
    };

    // 投稿一覧を取得
    async function loadPosts() {
      try {
        const url = currentFilter === 'all' ? API_URL : `${API_URL}?category=${encodeURIComponent(currentFilter)}`;
        const res = await fetch(url);
        const data = await res.json();
        renderPosts(data.posts || []);
      } catch (e) {
        document.getElementById('posts-container').innerHTML =
          '<div class="text-center py-12"><p class="text-sm text-slate-500">投稿の読み込みに失敗しました</p></div>';
      }
    }

    // 投稿を描画
    function renderPosts(posts) {
      const container = document.getElementById('posts-container');
      if (posts.length === 0) {
        container.innerHTML = `
          <div class="text-center py-12">
            <div class="w-16 h-16 bg-slate-100 rounded-full inline-flex items-center justify-center mx-auto mb-3">
              <svg class="w-8 h-8 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"/></svg>
            </div>
            <p class="text-sm font-medium text-slate-700 mb-1">まだ投稿がありません</p>
            <p class="text-xs text-slate-500">最初の投稿をしてみましょう！</p>
          </div>`;
        return;
      }

      container.innerHTML = posts.map(post => {
        const colors = catColors[post.category] || catColors['その他'];
        const date = new Date(post.created_at);
        const dateStr = `${date.getFullYear()}.${String(date.getMonth()+1).padStart(2,'0')}.${String(date.getDate()).padStart(2,'0')} ${String(date.getHours()).padStart(2,'0')}:${String(date.getMinutes()).padStart(2,'0')}`;
        // Decode HTML entities for display
        const bodyText = post.body.replace(/&amp;/g,'&').replace(/&lt;/g,'<').replace(/&gt;/g,'>').replace(/&quot;/g,'"').replace(/&#039;/g,"'");

        return `
          <div class="bg-white rounded-xl border border-warm-border p-4">
            <div class="flex items-center justify-between mb-2">
              <div class="flex items-center gap-2">
                <div class="w-8 h-8 rounded-full bg-slate-100 inline-flex items-center justify-center">
                  <span class="text-xs font-medium text-slate-600">${post.nickname.charAt(0)}</span>
                </div>
                <div>
                  <p class="text-sm font-medium text-slate-900">${post.nickname}</p>
                  <p class="text-xs text-slate-400">${dateStr}</p>
                </div>
              </div>
              <span class="inline-block ${colors.bg} ${colors.text} text-xs font-medium px-2 py-0.5 rounded-full">${post.category}</span>
            </div>
            <p class="text-sm text-slate-700 leading-relaxed whitespace-pre-wrap">${bodyText}</p>
          </div>`;
      }).join('');
    }

    // 投稿フォーム
    document.getElementById('post-form').addEventListener('submit', async (e) => {
      e.preventDefault();
      const btn = document.getElementById('submit-btn');
      const msg = document.getElementById('post-message');
      btn.disabled = true;

      const body = document.getElementById('body').value.trim();
      if (!body) {
        btn.disabled = false;
        return;
      }

      try {
        const res = await fetch(API_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            nickname: document.getElementById('nickname').value.trim(),
            category: document.querySelector('input[name="category"]:checked').value,
            body: body
          })
        });
        const data = await res.json();

        if (data.success) {
          msg.className = 'mt-3 text-sm text-center rounded-lg p-3 bg-forest-50 text-forest-700';
          msg.textContent = '投稿しました！';
          msg.classList.remove('hidden');
          document.getElementById('body').value = '';
          document.getElementById('char-count').textContent = '0';
          loadPosts();
          setTimeout(() => msg.classList.add('hidden'), 3000);
        } else {
          msg.className = 'mt-3 text-sm text-center rounded-lg p-3 bg-red-50 text-red-700';
          msg.textContent = data.error || '投稿に失敗しました';
          msg.classList.remove('hidden');
        }
      } catch (e) {
        msg.className = 'mt-3 text-sm text-center rounded-lg p-3 bg-red-50 text-red-700';
        msg.textContent = '通信エラーが発生しました';
        msg.classList.remove('hidden');
      }
      btn.disabled = false;
    });

    // 文字数カウント
    document.getElementById('body').addEventListener('input', (e) => {
      document.getElementById('char-count').textContent = e.target.value.length;
    });

    // カテゴリフィルター
    document.querySelectorAll('#filter-bar button').forEach(btn => {
      btn.addEventListener('click', () => {
        currentFilter = btn.dataset.cat;
        document.querySelectorAll('#filter-bar button').forEach(b => {
          b.classList.remove('bg-sky-500', 'text-white');
          b.classList.add('bg-white', 'text-slate-600', 'border', 'border-warm-border');
        });
        btn.classList.remove('bg-white', 'text-slate-600', 'border', 'border-warm-border');
        btn.classList.add('bg-sky-500', 'text-white');
        loadPosts();
      });
    });

    // 初期読み込み
    loadPosts();
  </script>

</body>
</html>
