// ============================================
// TOTAL PUNKS — Review Page Auto-Transformer
// Parses old geocities HTML and re-renders
// in Vivienne Westwood punk style
// ============================================

(function() {
  'use strict';

  // ============================================
  // BAND DATABASE (for YT links & recommendations)
  // ============================================
  const bandDB = [
    // 77 Punk
    { name: "THE CLASH", genre: "77punk", page: "c/clash.htm", yt: "The Clash London Calling" },
    { name: "SEX PISTOLS", genre: "77punk", page: "s/sexpistols.htm", yt: "Sex Pistols Anarchy In The U.K." },
    { name: "RAMONES", genre: "77punk", page: "r/ramones.htm", yt: "Ramones Blitzkrieg Bop" },
    { name: "THE DAMNED", genre: "77punk", page: "d/damned.htm", yt: "The Damned New Rose" },
    { name: "GENERATION X", genre: "77punk", page: "g/generationx.htm", yt: "Generation X King Rocker" },
    { name: "EATER", genre: "77punk", page: "e/EATER.htm", yt: "Eater Outside View" },
    { name: "EDDIE AND THE HOT RODS", genre: "77punk", page: "e/eddieandthehotrods.htm", yt: "Eddie And The Hot Rods Do Anything You Wanna Do" },
    { name: "SLAUGHTER AND THE DOGS", genre: "77punk", page: "s/slaughter.htm", yt: "Slaughter And The Dogs Cranked Up Really High" },
    { name: "THE JAM", genre: "77punk", page: "j/jam.htm", yt: "The Jam Town Called Malice" },
    // UK Hardcore
    { name: "THE EXPLOITED", genre: "ukhc", page: "e/exploited.htm", yt: "The Exploited Punks Not Dead" },
    { name: "DISCHARGE", genre: "ukhc", page: "d/discharg.htm", yt: "Discharge Hear Nothing See Nothing Say Nothing" },
    { name: "G.B.H", genre: "ukhc", page: "g/GBH.htm", yt: "GBH City Baby Attacked By Rats" },
    { name: "CHAOS U.K.", genre: "ukhc", page: "c/chaosuk.htm", yt: "Chaos UK No Security" },
    { name: "CHAOTIC DISCHORD", genre: "ukhc", page: "c/chaoticdischord.htm", yt: "Chaotic Dischord Glue Sniffing" },
    { name: "ENGLISH DOGS", genre: "ukhc", page: "e/englishdogs.htm", yt: "English Dogs Mad Punx and English Dogs" },
    { name: "THE VARUKERS", genre: "ukhc", page: "v/varukers.htm", yt: "The Varukers Die For Your Government" },
    { name: "ABRASIVE WHEELS", genre: "ukhc", page: "a/abrasive.htm", yt: "Abrasive Wheels Vicious Circle" },
    { name: "VICE SQUAD", genre: "ukhc", page: "v/vicesquad.htm", yt: "Vice Squad Last Rockers" },
    { name: "THE ENEMY", genre: "ukhc", page: "e/theenemy.htm", yt: "The Enemy UK 50,000 Dead" },
    { name: "TOTAL CHAOS", genre: "ukhc", page: "t/totalchaos.htm", yt: "Total Chaos Riot City" },
    { name: "ANTI NOWHERE LEAGUE", genre: "ukhc", page: "a/antinowhere.htm", yt: "Anti Nowhere League Streets Of London" },
    { name: "ONEWAY SYSTEM", genre: "ukhc", page: "o/oneway.htm", yt: "One Way System Jerusalem" },
    // Oi! / Skins
    { name: "COCKNEY REJECTS", genre: "oi", page: "c/cockney.htm", yt: "Cockney Rejects Oi Oi Oi" },
    { name: "COCK SPARRER", genre: "oi", page: "c/cocksparrer.htm", yt: "Cock Sparrer England Belongs To Me" },
    { name: "4SKINS", genre: "oi", page: "f/4skins.htm", yt: "4 Skins Chaos" },
    { name: "BLITZ", genre: "oi", page: "b/blitz.htm", yt: "Blitz Someone's Gonna Die" },
    { name: "THE BUSINESS", genre: "oi", page: "b/business.htm", yt: "The Business Suburban Rebels" },
    { name: "THE OPPRESSED", genre: "oi", page: "o/oppressed.htm", yt: "The Oppressed Victims" },
    { name: "ANGELIC UPSTARTS", genre: "oi", page: "a/angelic.htm", yt: "Angelic Upstarts Teenage Warning" },
    { name: "RED ALERT", genre: "oi", page: "r/redalert.htm", yt: "Red Alert In Britain" },
    { name: "SECTION 5", genre: "oi", page: "s/section5.htm", yt: "Section 5 We Don't Care" },
    { name: "THE ADICTS", genre: "oi", page: "a/adicts.htm", yt: "The Adicts Viva La Revolution" },
    { name: "SHAM 69", genre: "oi", page: "s/sham69.htm", yt: "Sham 69 If The Kids Are United" },
    // Street Punk
    { name: "THE CASUALTIES", genre: "streetpunk", page: "c/casualties.htm", yt: "The Casualties Unknown Soldier" },
    { name: "BLANKS 77", genre: "streetpunk", page: "b/blanks77.htm", yt: "Blanks 77 Killer Blanks" },
    // US Hardcore
    { name: "DEAD KENNEDYS", genre: "ushc", page: "d/deadkennedys.htm", yt: "Dead Kennedys Holiday In Cambodia" },
    { name: "AGNOSTIC FRONT", genre: "ushc", page: "a/agnostic.htm", yt: "Agnostic Front Gotta Go" },
    { name: "DROPKICK MURPHYS", genre: "ushc", page: "d/dropkick.htm", yt: "Dropkick Murphys Shipping Up To Boston" },
    // Melodic / Ska
    { name: "RANCID", genre: "melodic", page: "r/rancid.htm", yt: "Rancid Time Bomb" },
    { name: "OPERATION IVY", genre: "melodic", page: "o/oprationivy.htm", yt: "Operation Ivy Knowledge" },
    { name: "BAD RELIGION", genre: "melodic", page: "b/badreligon.htm", yt: "Bad Religion 21st Century Digital Boy" },
    { name: "GREEN DAY", genre: "melodic", page: "g/greenday.htm", yt: "Green Day Basket Case" },
    { name: "THE OFFSPRING", genre: "melodic", page: "o/offspring.htm", yt: "The Offspring Self Esteem" },
    { name: "PENNYWISE", genre: "melodic", page: "p/pennywise.htm", yt: "Pennywise Bro Hymn" },
    { name: "DANCE HALL CRASHERS", genre: "melodic", page: "d/dancehall.htm", yt: "Dance Hall Crashers Enough" },
    { name: "STIFF LITTLE FINGERS", genre: "melodic", page: "s/stiff.htm", yt: "Stiff Little Fingers Alternative Ulster" },
    { name: "THE DISTILLERS", genre: "melodic", page: "d/thedistillers.htm", yt: "The Distillers City of Angels" },
    { name: "PETER AND THE TEST TUBE BABIES", genre: "melodic", page: "p/thepeterand.htm", yt: "Peter And The Test Tube Babies Banned From The Pubs" },
    // Japan
    { name: "SA", genre: "jp", page: "s/sa.htm", yt: "SA GREAT OPERATION" },
    { name: "GUITAR WOLF", genre: "jp", page: "g/GUTERWOLF.htm", yt: "Guitar Wolf Jet Generation" },
  ];

  const genreLabels = {
    '77punk': '77 Punk', 'ukhc': 'UK Hardcore', 'oi': 'Oi! / Skins',
    'streetpunk': 'Street Punk', 'ushc': 'US Hardcore', 'melodic': 'Melodic / Ska', 'jp': 'Japan'
  };

  // Skip transformation if loaded inside a frame (old site)
  if (window !== window.top) return;

  // Wait for DOM
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', transform);
  } else {
    transform();
  }

  function transform() {
    // Extract data from old HTML before replacing
    const bandName = extractBandName();
    const bio = extractBio();
    const albums = extractAlbums();

    // Calculate paths from script tag
    const modernBase = getBasePath();
    const topBase = getTopPath();

    // Mark body as transforming and build new DOM
    document.body.className = 'transforming';

    // Inject CSS
    const cssLink = document.createElement('link');
    cssLink.rel = 'stylesheet';
    cssLink.href = modernBase + 'review.css';
    document.head.appendChild(cssLink);

    // Remove old styles
    document.querySelectorAll('link[rel="stylesheet"]').forEach(el => {
      if (!el.href.includes('review.css')) el.remove();
    });

    // Build page
    const page = document.createElement('div');
    page.className = 'rv-page';
    page.innerHTML = buildPage(bandName, bio, albums, modernBase, topBase);
    document.body.appendChild(page);

    // Remove background attribute
    document.body.removeAttribute('background');
    document.body.style.background = '';

    // Init comment system
    setTimeout(initShout, 100);
  }

  // ============================================
  // EXTRACTORS
  // ============================================

  function extractBandName() {
    const title = document.title || '';
    // Clean up full-width chars and trim
    return title.replace(/[\s　]+/g, ' ').trim();
  }

  function extractBio() {
    // Bio is in the first table[width="400"] that does NOT have a td[rowspan]
    // Or it could be a <p> before any tables
    const tables = document.querySelectorAll('table[width="400"]');
    let bioHtml = '';

    // Check for standalone <p> bio text (like EXPLOITED)
    const bodyChildren = document.body.children;
    for (let i = 0; i < bodyChildren.length; i++) {
      const el = bodyChildren[i];
      if (el.tagName === 'P' && el.querySelector('b')) {
        // This is the band name header, skip
        continue;
      }
      if (el.tagName === 'P' && el.textContent.trim().length > 20) {
        bioHtml += el.innerHTML;
        break;
      }
      if (el.tagName === 'DIV' || el.tagName === 'TABLE') break;
    }

    // Check first table for bio
    if (tables.length > 0) {
      const firstTable = tables[0];
      const hasRowspan = firstTable.querySelector('td[rowspan]');
      if (!hasRowspan) {
        // This is the bio table
        const td = firstTable.querySelector('td');
        if (td) {
          bioHtml = td.innerHTML;
        }
      }
    }

    // Clean up the bio HTML
    bioHtml = bioHtml
      .replace(/<font[^>]*>/gi, '')
      .replace(/<\/font>/gi, '')
      .replace(/<div[^>]*>/gi, '')
      .replace(/<\/div>/gi, '');

    return bioHtml.trim();
  }

  function extractAlbums() {
    const tables = document.querySelectorAll('table[width="400"]');
    const albums = [];

    tables.forEach(table => {
      const rowspanTd = table.querySelector('td[rowspan]');
      if (!rowspanTd) return; // Skip non-album tables

      const album = {};

      // Image
      const img = rowspanTd.querySelector('img');
      if (img) {
        album.img = img.getAttribute('src');
      }

      // Get all rows
      const rows = table.querySelectorAll('tr');

      // Title: usually in 2nd row's last td
      if (rows.length >= 2) {
        const titleTd = rows[1].querySelector('td:last-child') || rows[1].querySelector('td');
        if (titleTd) {
          const titleLink = titleTd.querySelector('a');
          if (titleLink) {
            album.title = titleLink.textContent.trim();
            album.titleHref = titleLink.getAttribute('href');
          } else {
            album.title = titleTd.textContent.trim();
          }
        }
      }

      // Comment: usually in 4th row's last td
      if (rows.length >= 4) {
        const commentTd = rows[3].querySelector('td:last-child') || rows[3].querySelector('td');
        if (commentTd) {
          album.comment = commentTd.innerHTML
            .replace(/<font[^>]*>/gi, '')
            .replace(/<\/font>/gi, '')
            .replace(/<a[^>]*>.*?<\/a>/gi, '')
            .trim();
        }
      }

      // Only add if we have meaningful content
      if (album.title && album.title !== '●タイトル' && album.title !== '●コメント') {
        albums.push(album);
      }
    });

    return albums;
  }

  function getDepthToReview() {
    return '';
  }

  function getBasePath() {
    // Find path to modern/ by looking at the injected script tag
    const scripts = document.querySelectorAll('script[src*="review.js"]');
    if (scripts.length > 0) {
      const src = scripts[0].getAttribute('src');
      // src is like "../../modern/review.js" -> base is "../../modern/"
      return src.replace('review.js', '');
    }
    return '../../modern/';
  }

  function getTopPath() {
    // From modern/ go up one level to totalpunks/
    const modernPath = getBasePath();
    return modernPath.replace('modern/', '');
  }

  // ============================================
  // PAGE BUILDER
  // ============================================

  function buildPage(bandName, bio, albums, modernBase, topBase) {
    const initial = bandName.replace(/^(THE\s+)?/i, '').charAt(0).toUpperCase();
    const albumCount = albums.length;

    let albumsHtml = '';
    albums.forEach((album, i) => {
      const imgHtml = album.img
        ? `<img src="${album.img}" alt="${album.title || ''}" loading="lazy">`
        : `<div class="rv-album-img-placeholder">?</div>`;

      const titleHtml = album.titleHref
        ? `<a href="${album.titleHref}" target="_blank">${escHtml(album.title)}</a>`
        : escHtml(album.title);

      albumsHtml += `
        <div class="rv-album">
          <div class="rv-album-img">${imgHtml}</div>
          <div class="rv-album-body">
            <div class="rv-album-title-label">// Album ${String(i + 1).padStart(2, '0')}</div>
            <h3 class="rv-album-title">${titleHtml}</h3>
            <div class="rv-album-comment-label">Review</div>
            <div class="rv-album-comment">${album.comment || ''}</div>
          </div>
        </div>
      `;
    });

    const bioSection = bio
      ? `<div class="rv-bio">${wrapInParagraphs(bio)}</div>`
      : '';

    // Find current band in DB
    const currentPage = window.location.pathname;
    const currentBand = bandDB.find(b => currentPage.includes(b.page));

    // YouTube button
    let ytHtml = '';
    if (currentBand && currentBand.yt) {
      const ytUrl = 'https://www.youtube.com/results?search_query=' + encodeURIComponent(currentBand.yt);
      ytHtml = `<a href="${ytUrl}" target="_blank" class="rv-yt-btn">このバンドの名曲を聴く</a>`;
    }

    // Related bands (same genre, excluding current)
    let relatedHtml = '';
    if (currentBand) {
      const related = bandDB
        .filter(b => b.genre === currentBand.genre && b.name !== currentBand.name)
        .sort(() => Math.random() - 0.5)
        .slice(0, 5);

      if (related.length > 0) {
        const genre = genreLabels[currentBand.genre] || currentBand.genre;
        const relatedCards = related.map(b => {
          const reviewBase = currentPage.replace(/[^/]+\/[^/]+$/, '');
          return `<a href="${reviewBase}${b.page}" class="rv-related-card">
            <span class="rv-related-name">${escHtml(b.name)}</span>
          </a>`;
        }).join('');

        relatedHtml = `
          <div class="rv-related">
            <h3 class="rv-related-title">&#9733; ${escHtml(genre)}が好きなら</h3>
            <div class="rv-related-grid">${relatedCards}</div>
          </div>
        `;
      }
    }

    return `
      <header class="rv-header">
        <div class="rv-header-inner">
          <a href="${topBase}modern/index.html" class="rv-header-logo">TOTAL PUNKS</a>
          <a href="${topBase}modern/index.html#reviews" class="rv-header-back">&larr; Back to Reviews</a>
        </div>
      </header>

      <div class="rv-hero" data-initial="${initial}">
        <div class="rv-hero-inner">
          <div class="rv-hero-label">// Disc Review</div>
          <h1 class="rv-hero-title">${escHtml(bandName)}</h1>
          ${ytHtml}
        </div>
      </div>

      <main class="rv-main">
        ${bioSection}
        <h2 class="rv-albums-header">Discography <span style="font-family:var(--font-punk);font-size:14px;color:#999;margin-left:8px;">${albumCount} albums</span></h2>
        ${albumsHtml}
        ${relatedHtml}

        <div class="rv-shout" id="rv-shout">
          <h3 class="rv-shout-title">&#9998; SHOUT IT OUT! <span class="rv-shout-sub">&#8212; 先着5名限定</span></h3>
          <div class="rv-shout-list" id="rv-shout-list"></div>
          <form class="rv-shout-form" id="rv-shout-form">
            <input type="text" id="rv-shout-name" class="rv-shout-input rv-shout-name" placeholder="NAME (20文字)" maxlength="20" required>
            <input type="text" id="rv-shout-text" class="rv-shout-input rv-shout-text" placeholder="叫べ！！（140文字）" maxlength="140" required>
            <button type="submit" class="rv-shout-submit" id="rv-shout-submit">POST!!</button>
          </form>
          <p class="rv-shout-closed" id="rv-shout-closed" style="display:none;">&#10006; 5名に達したため受付終了！！</p>
        </div>
      </main>

      <footer class="rv-footer">
        <p class="rv-footer-text">
          <a href="${topBase}modern/index.html">TOTAL PUNKS</a> &mdash; since 2003 &mdash; geocities.jp survivor
        </p>
      </footer>
    `;
  }

  // ============================================
  // COMMENTS (SHOUT) SYSTEM
  // ============================================

  function initShout() {
    const pageId = window.location.pathname.replace(/.*\/review\//, '').replace(/\.html?$/, '').replace(/[^a-zA-Z0-9]/g, '_');
    const apiBase = '/.netlify/functions/comments?page=' + encodeURIComponent(pageId);
    const list = document.getElementById('rv-shout-list');
    const form = document.getElementById('rv-shout-form');
    const closed = document.getElementById('rv-shout-closed');
    const submit = document.getElementById('rv-shout-submit');

    if (!list || !form) return;

    function renderComments(comments, isClosed) {
      if (comments.length === 0) {
        list.innerHTML = '<p class="rv-shout-empty">まだ誰も叫んでいない...最初の1人になれ！！</p>';
      } else {
        list.innerHTML = comments.map(c =>
          `<div class="rv-shout-item">
            <span class="rv-shout-item-name">${escHtml(c.name)}</span>
            <span class="rv-shout-item-text">${escHtml(c.text)}</span>
            <span class="rv-shout-item-date">${c.date || ''}</span>
          </div>`
        ).join('');
      }
      if (isClosed) {
        form.style.display = 'none';
        closed.style.display = 'block';
      }
    }

    // Load comments
    fetch(apiBase)
      .then(r => r.json())
      .then(data => renderComments(data.comments || [], data.closed))
      .catch(() => renderComments([], false));

    // Submit
    form.addEventListener('submit', function(e) {
      e.preventDefault();
      const name = document.getElementById('rv-shout-name').value.trim();
      const text = document.getElementById('rv-shout-text').value.trim();
      if (!name || !text) return;

      submit.disabled = true;
      submit.textContent = '...';

      fetch(apiBase, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, text }),
      })
        .then(r => r.json())
        .then(data => {
          if (data.error === 'closed') {
            renderComments(data.comments, true);
          } else {
            renderComments(data.comments || [], data.closed);
            document.getElementById('rv-shout-name').value = '';
            document.getElementById('rv-shout-text').value = '';
          }
          submit.disabled = false;
          submit.textContent = 'POST!!';
        })
        .catch(() => {
          submit.disabled = false;
          submit.textContent = 'POST!!';
        });
    });
  }

  // ============================================
  // HELPERS
  // ============================================

  function escHtml(str) {
    if (!str) return '';
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }

  function wrapInParagraphs(html) {
    // If already has <p> tags, return as is
    if (/<p[\s>]/i.test(html)) return html;
    // Split by <br> and wrap
    const parts = html.split(/<br\s*\/?>/gi).filter(s => s.trim());
    if (parts.length <= 1) return '<p>' + html + '</p>';
    return parts.map(p => '<p>' + p.trim() + '</p>').join('');
  }

})();
