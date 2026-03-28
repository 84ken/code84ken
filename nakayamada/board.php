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
  <style>
    .reply-form { max-height: 0; overflow: hidden; transition: max-height 0.3s ease; }
    .reply-form.open { max-height: 400px; }
  </style>
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
              class="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-sky-500/50 focus:border-sky-500 caret-sky-500">
          </div>
          <div class="leading-normal">
            <label class="block text-sm font-medium text-slate-700 mb-1">カテゴリ</label>
            <div class="flex flex-wrap gap-3">
              <label class="inline-flex items-center gap-1.5 cursor-pointer">
                <input type="radio" name="category" value="やりたいこと" checked class="text-sky-500">
                <span class="text-sm text-slate-700">やりたいこと</span>
              </label>
              <label class="inline-flex items-center gap-1.5 cursor-pointer">
                <input type="radio" name="category" value="お悩み" class="text-sky-500">
                <span class="text-sm text-slate-700">お悩み</span>
              </label>
              <label class="inline-flex items-center gap-1.5 cursor-pointer">
                <input type="radio" name="category" value="情報共有" class="text-sky-500">
                <span class="text-sm text-slate-700">情報共有</span>
              </label>
              <label class="inline-flex items-center gap-1.5 cursor-pointer">
                <input type="radio" name="category" value="その他" class="text-sky-500">
                <span class="text-sm text-slate-700">その他</span>
              </label>
            </div>
          </div>
          <div class="leading-normal">
            <label class="block text-sm font-medium text-slate-700 mb-1">本文 <span class="text-red-500">*</span></label>
            <textarea id="body" rows="4" maxlength="1000" required placeholder="やりたいこと、お悩み、情報など気軽に書いてみましょう"
              class="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-sky-500/50 focus:border-sky-500 caret-sky-500 resize-none"></textarea>
            <p class="text-xs text-slate-400 mt-1 text-right"><span id="char-count">0</span>/1000</p>
          </div>
          <button type="submit" id="submit-btn"
            class="w-full inline-flex items-center justify-center gap-2 h-11 text-sm font-medium bg-sky-500 text-white rounded-lg hover:bg-sky-600 cursor-pointer transition-colors disabled:opacity-50">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"/></svg>
            投稿する
          </button>
        </form>
        <div id="post-message" class="hidden mt-3 text-sm text-center rounded-lg p-3"></div>
      </div>
    </section>

    <!-- カテゴリフィルター -->
    <div class="flex gap-2 overflow-x-auto pb-3 mb-4 -mx-4 px-4" style="-ms-overflow-style:none;scrollbar-width:none">
      <button data-cat="all" class="flex-shrink-0 px-3 py-1.5 rounded-full text-sm font-medium bg-sky-500 text-white cursor-pointer" onclick="setFilter(this,'all')">すべて</button>
      <button data-cat="やりたいこと" class="flex-shrink-0 px-3 py-1.5 rounded-full text-sm font-medium bg-white text-slate-600 border border-warm-border cursor-pointer" onclick="setFilter(this,'やりたいこと')">やりたいこと</button>
      <button data-cat="お悩み" class="flex-shrink-0 px-3 py-1.5 rounded-full text-sm font-medium bg-white text-slate-600 border border-warm-border cursor-pointer" onclick="setFilter(this,'お悩み')">お悩み</button>
      <button data-cat="情報共有" class="flex-shrink-0 px-3 py-1.5 rounded-full text-sm font-medium bg-white text-slate-600 border border-warm-border cursor-pointer" onclick="setFilter(this,'情報共有')">情報共有</button>
      <button data-cat="その他" class="flex-shrink-0 px-3 py-1.5 rounded-full text-sm font-medium bg-white text-slate-600 border border-warm-border cursor-pointer" onclick="setFilter(this,'その他')">その他</button>
    </div>

    <!-- 投稿一覧 -->
    <div id="posts-container" class="space-y-4">
      <div class="text-center py-12">
        <svg class="w-8 h-8 text-slate-300 mx-auto animate-spin" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path></svg>
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
    const API = 'board-api.php';
    let currentFilter = 'all';

    // いいね状態をlocalStorageで管理（ユーザーUI用）
    function getLikedPosts() {
      return JSON.parse(localStorage.getItem('liked_posts') || '[]');
    }
    function toggleLocalLike(id) {
      const liked = getLikedPosts();
      const idx = liked.indexOf(id);
      if (idx >= 0) liked.splice(idx, 1); else liked.push(id);
      localStorage.setItem('liked_posts', JSON.stringify(liked));
      return idx < 0;
    }

    const catColors = {
      'やりたいこと': 'bg-sky-100 text-sky-700',
      'お悩み': 'bg-amber-100 text-amber-700',
      '情報共有': 'bg-forest-100 text-forest-700',
      'その他': 'bg-slate-100 text-slate-700',
    };

    function fmtDate(str) {
      const d = new Date(str);
      return `${d.getMonth()+1}/${d.getDate()} ${String(d.getHours()).padStart(2,'0')}:${String(d.getMinutes()).padStart(2,'0')}`;
    }
    function decode(str) {
      return str.replace(/&amp;/g,'&').replace(/&lt;/g,'<').replace(/&gt;/g,'>').replace(/&quot;/g,'"').replace(/&#039;/g,"'");
    }

    function renderReplyForm(parentId, parentNick) {
      return `
        <div class="reply-form" id="reply-form-${parentId}">
          <div class="mt-3 pt-3 border-t border-slate-100">
            <div class="flex gap-2">
              <input type="text" id="reply-nick-${parentId}" placeholder="ニックネーム（任意）" maxlength="20"
                class="flex-1 min-w-0 px-3 py-2 text-sm border border-slate-200 rounded-lg focus:ring-2 focus:ring-sky-500/50 caret-sky-500">
            </div>
            <textarea id="reply-body-${parentId}" rows="3" maxlength="500" placeholder="${decode(parentNick)}さんへの返信..."
              class="w-full mt-2 px-3 py-2 text-sm border border-slate-200 rounded-lg focus:ring-2 focus:ring-sky-500/50 caret-sky-500 resize-none"></textarea>
            <div class="flex gap-2 mt-2">
              <button onclick="submitReply('${parentId}')"
                class="flex-1 h-9 text-sm font-medium bg-sky-500 text-white rounded-lg hover:bg-sky-600 cursor-pointer transition-colors">
                返信する
              </button>
              <button onclick="toggleReply('${parentId}')"
                class="h-9 px-4 text-sm text-slate-600 border border-slate-200 rounded-lg hover:bg-slate-50 cursor-pointer transition-colors">
                キャンセル
              </button>
            </div>
          </div>
        </div>`;
    }

    function renderPost(post, isReply = false) {
      const liked = getLikedPosts().includes(post.id);
      const likeCount = post.likes ? post.likes.length : 0;
      const catColor = catColors[post.category] || catColors['その他'];
      const initial = decode(post.nickname).charAt(0);
      const replies = post.replies || [];

      return `
        <div class="${isReply ? 'ml-8 mt-2' : ''} bg-white rounded-xl border border-warm-border ${isReply ? 'border-l-2 border-l-sky-200' : ''} p-4" id="post-${post.id}">
          <div class="flex items-start gap-3">
            <div class="w-8 h-8 rounded-full ${isReply ? 'bg-slate-100' : 'bg-sky-50'} flex items-center justify-center flex-shrink-0">
              <span class="text-xs font-medium ${isReply ? 'text-slate-600' : 'text-sky-600'}">${initial}</span>
            </div>
            <div class="flex-1 min-w-0">
              <div class="flex items-center gap-2 flex-wrap mb-1">
                <span class="text-sm font-medium text-slate-900">${decode(post.nickname)}</span>
                ${!isReply ? `<span class="inline-block ${catColor} text-xs font-medium px-2 py-0.5 rounded-full">${post.category}</span>` : ''}
                <span class="text-xs text-slate-400">${fmtDate(post.created_at)}</span>
              </div>
              <p class="text-sm text-slate-700 leading-relaxed whitespace-pre-wrap">${decode(post.body)}</p>
              <div class="flex items-center gap-3 mt-2">
                <button onclick="handleLike('${post.id}', this)"
                  class="inline-flex items-center gap-1.5 text-xs ${liked ? 'text-red-500' : 'text-slate-400'} hover:text-red-500 cursor-pointer transition-colors like-btn"
                  data-liked="${liked}" data-count="${likeCount}">
                  <svg class="w-4 h-4" fill="${liked ? 'currentColor' : 'none'}" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"/></svg>
                  <span class="like-count">${likeCount > 0 ? likeCount : ''}</span>
                </button>
                ${!isReply ? `
                <button onclick="toggleReply('${post.id}')"
                  class="inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-sky-500 cursor-pointer transition-colors">
                  <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6"/></svg>
                  返信${replies.length > 0 ? ` (${replies.length})` : ''}
                </button>` : ''}
              </div>
            </div>
          </div>
          ${!isReply ? renderReplyForm(post.id, post.nickname) : ''}
        </div>
        ${!isReply && replies.length > 0 ? replies.map(r => renderPost(r, true)).join('') : ''}`;
    }

    async function loadPosts() {
      const url = currentFilter === 'all' ? API : `${API}?category=${encodeURIComponent(currentFilter)}`;
      try {
        const res = await fetch(url);
        const data = await res.json();
        const posts = data.posts || [];
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
        } else {
          container.innerHTML = posts.map(p => renderPost(p)).join('');
        }
      } catch (e) {
        document.getElementById('posts-container').innerHTML =
          '<p class="text-center text-sm text-slate-500 py-8">読み込みに失敗しました</p>';
      }
    }

    function toggleReply(parentId) {
      const form = document.getElementById(`reply-form-${parentId}`);
      form.classList.toggle('open');
      if (form.classList.contains('open')) {
        document.getElementById(`reply-body-${parentId}`).focus();
      }
    }

    async function submitReply(parentId) {
      const nick = document.getElementById(`reply-nick-${parentId}`).value.trim();
      const body = document.getElementById(`reply-body-${parentId}`).value.trim();
      if (!body) return;
      try {
        const res = await fetch(API, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ nickname: nick, category: 'その他', body, parent_id: parentId })
        });
        const data = await res.json();
        if (data.success) {
          document.getElementById(`reply-body-${parentId}`).value = '';
          document.getElementById(`reply-nick-${parentId}`).value = '';
          document.getElementById(`reply-form-${parentId}`).classList.remove('open');
          loadPosts();
        }
      } catch(e) {}
    }

    async function handleLike(postId, btn) {
      const wasLiked = btn.dataset.liked === 'true';
      // 楽観的UI更新
      const newLiked = !wasLiked;
      const newCount = parseInt(btn.dataset.count || '0') + (newLiked ? 1 : -1);
      btn.dataset.liked = newLiked;
      btn.dataset.count = newCount;
      btn.className = `inline-flex items-center gap-1.5 text-xs ${newLiked ? 'text-red-500' : 'text-slate-400'} hover:text-red-500 cursor-pointer transition-colors like-btn`;
      btn.querySelector('svg').setAttribute('fill', newLiked ? 'currentColor' : 'none');
      btn.querySelector('.like-count').textContent = newCount > 0 ? newCount : '';
      toggleLocalLike(postId);
      try {
        await fetch(`${API}?action=like`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id: postId })
        });
      } catch(e) {}
    }

    function setFilter(btn, cat) {
      currentFilter = cat;
      document.querySelectorAll('[data-cat]').forEach(b => {
        b.className = 'flex-shrink-0 px-3 py-1.5 rounded-full text-sm font-medium bg-white text-slate-600 border border-warm-border cursor-pointer';
      });
      btn.className = 'flex-shrink-0 px-3 py-1.5 rounded-full text-sm font-medium bg-sky-500 text-white cursor-pointer';
      loadPosts();
    }

    // 新規投稿フォーム
    document.getElementById('post-form').addEventListener('submit', async e => {
      e.preventDefault();
      const btn = document.getElementById('submit-btn');
      const msg = document.getElementById('post-message');
      const body = document.getElementById('body').value.trim();
      if (!body) return;
      btn.disabled = true;
      try {
        const res = await fetch(API, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            nickname: document.getElementById('nickname').value.trim(),
            category: document.querySelector('input[name="category"]:checked').value,
            body
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
      } catch(e) {
        msg.className = 'mt-3 text-sm text-center rounded-lg p-3 bg-red-50 text-red-700';
        msg.textContent = '通信エラーが発生しました';
        msg.classList.remove('hidden');
      }
      btn.disabled = false;
    });

    document.getElementById('body').addEventListener('input', e => {
      document.getElementById('char-count').textContent = e.target.value.length;
    });

    loadPosts();
  </script>

</body>
</html>
