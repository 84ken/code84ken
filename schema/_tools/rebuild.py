# -*- coding: utf-8 -*-
"""works.json を正として、サイト側のデータを作り直すスクリプト。

使い方（schema フォルダで）:
    python3 _tools/rebuild.py

やること:
  1. works.json を year の降順に並び替える（同じ年は現在の並び順のまま）
  2. 各実績ページの「前後のプロジェクト」リンクを張り直す
  3. app.js に埋め込まれている実績データを works.json と同期する
  4. index.html の件数表示を更新する
  5. sitemap.xml に未登録の実績ページを追加する

実績を追加したり year を直したりしたら、これを流せば全部そろう。
このフォルダ（_tools）は公開されない（deploy-schema.yml の exclude 対象）。
"""
import io, json, re, os, html

os.chdir(os.path.join(os.path.dirname(os.path.abspath(__file__)), '..'))
BASE = 'https://llschema.com/'
esc = lambda t: html.escape(t, quote=True)

works = json.load(io.open('works.json', encoding='utf-8'))

# 1. 並び替え
for i, w in enumerate(works):
    w['_i'] = i
    if 'year' not in w:
        print('!! year がありません:', w['detailPage'])
works.sort(key=lambda w: (-w.get('year', 0), w['_i']))
for w in works: w.pop('_i', None)
io.open('works.json', 'w', encoding='utf-8').write(json.dumps(works, ensure_ascii=False, indent=2) + '\n')

# 2. 前後リンク
for i, w in enumerate(works):
    p = w['detailPage']
    s = io.open(p, encoding='utf-8').read()
    parts = ''
    if i > 0:
        q = works[i-1]
        parts += '<a href="../%s"><span>← 前のプロジェクト</span><strong>%s</strong></a>' % (q['detailPage'], esc(q['title']))
    if i < len(works) - 1:
        q = works[i+1]
        parts += '<a href="../%s"><span>次のプロジェクト →</span><strong>%s</strong></a>' % (q['detailPage'], esc(q['title']))
    nav = '<nav class="case-sequence" aria-label="前後のプロジェクト">%s</nav>' % parts
    s2, n = re.subn(r'<nav class="case-sequence".*?</nav>', lambda m: nav, s, count=1, flags=re.S)
    if n != 1:
        print('!! 前後リンクの場所が見つからない:', p)
    elif s2 != s:
        io.open(p, 'w', encoding='utf-8').write(s2)

# 3. app.js
a = io.open('app.js', encoding='utf-8').read()
i, j = a.find('Promise.resolve('), a.find(']).then(works=>{')
io.open('app.js', 'w', encoding='utf-8').write(a[:i] + 'Promise.resolve(' + json.dumps(works, ensure_ascii=False) + a[j+1:])

# 4. index.html の件数
h = io.open('index.html', encoding='utf-8').read()
h2 = re.sub(r'(<span class="count">01 — 12 / )\d+(</span>)', lambda m: m.group(1) + str(len(works)) + m.group(2), h, count=1)
if h2 != h: io.open('index.html', 'w', encoding='utf-8').write(h2)

# 5. sitemap
sm = io.open('sitemap.xml', encoding='utf-8').read()
add = ''
for w in works:
    u = BASE + w['detailPage']
    if u not in sm:
        add += '<url><loc>%s</loc><lastmod>2026-09-23</lastmod><priority>0.6</priority></url>' % u
if add:
    io.open('sitemap.xml', 'w', encoding='utf-8').write(sm.replace('</urlset>', add + '</urlset>'))

print('OK:', len(works), '件')
for w in works[:5]:
    print(' ', w.get('year'), w['title'])
