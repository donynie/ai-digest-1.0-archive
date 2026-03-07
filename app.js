const contentEl = document.getElementById('content');
const dateSelectEl = document.getElementById('date-select');
const updatedAtEl = document.getElementById('last-updated');
const tabYoutubeEl = document.getElementById('tab-youtube');
const tabAppsEl = document.getElementById('tab-apps');
const tabBlogEl = document.getElementById('tab-blog');

const state = {
  data: null,
  selectedTab: 'youtube',
  selectedDate: null,
};

function escapeHtml(text) {
  return String(text)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

function toMultilineHtml(text) {
  return escapeHtml(text || '')
    .split('\n')
    .map((line) => `<p>${line || '&nbsp;'}</p>`)
    .join('');
}

function formatDateLabel(date, index) {
  if (index === 0) return '今天';
  const d = new Date(`${date}T00:00:00Z`);
  return `${d.getMonth() + 1}/${d.getDate()}`;
}

function formatDateTime(iso) {
  if (!iso) return '';
  const d = new Date(iso);
  return d.toLocaleString('zh-CN', { hour12: false });
}

function setActiveTab(tab) {
  state.selectedTab = tab;
  tabYoutubeEl.classList.toggle('active', tab === 'youtube');
  tabAppsEl.classList.toggle('active', tab === 'apps');
  if (tabBlogEl) tabBlogEl.classList.toggle('active', tab === 'blog');
  render();
}

function setActiveDate(date) {
  state.selectedDate = date;
  if (dateSelectEl) dateSelectEl.value = date || '';
  render();
}

function renderDateSelect() {
  if (!dateSelectEl) return;
  const dates = state.data?.dates || [];
  dateSelectEl.innerHTML = '';
  dates.forEach((date, index) => {
    const opt = document.createElement('option');
    opt.value = date;
    opt.textContent = index === 0 ? `今天 (${date})` : `${date} (${formatDateLabel(date, index)})`;
    if (date === state.selectedDate) opt.selected = true;
    dateSelectEl.appendChild(opt);
  });
}

function renderYoutubeTransparency(transparency) {
  if (!transparency) return '';
  const { feedsConfigured, totalVideosFetched, withTranscript, includedInReport, highPriorityCount, lowPriorityCount, bySource } = transparency;
  let bySourceLine = '';
  if (Array.isArray(bySource) && bySource.length > 0) {
    bySourceLine = `<p class="transparency-line">按 Feed：${bySource.map((s) => `${escapeHtml(s.feedName)} ${s.count}`).join('；')}</p>`;
  }
  return `
    <section class="transparency-block">
      <h3 class="transparency-title">📊 数据透明度</h3>
      <p class="transparency-line">配置 Feed ${feedsConfigured} 个 · 抓取视频 ${totalVideosFetched} 条 · 有字幕 ${withTranscript} 条 · 入选 ${includedInReport} 条${highPriorityCount != null ? ` · 高优先级 ${highPriorityCount}` : ''}${lowPriorityCount != null ? ` · 低优先级 ${lowPriorityCount}` : ''}</p>
      ${bySourceLine}
    </section>
  `;
}

function renderYoutube(date) {
  const dayData = state.data.tabs.youtube.days[date];
  const items = dayData?.items || [];
  const ytTransparency = dayData?.transparency || null;

  if (!items.length && !ytTransparency) {
    return `<div class="empty">这一天暂无 YouTube 内容。</div>`;
  }

  const cards = (items || [])
    .map((item) => {
      const source = item.sourceName ? escapeHtml(item.sourceName) : '';
      const published = item.publishedAt ? formatDateTime(item.publishedAt) : '';
      const header = [source, published].filter(Boolean).join(' · ');
      const insights = Array.isArray(item.coreInsights)
        ? `<ul>${item.coreInsights.map((it) => `<li>${escapeHtml(it)}</li>`).join('')}</ul>`
        : '';
      const relevance = item.personalRelevance
        ? `<div class="summary"><p><strong>启发：</strong></p>${toMultilineHtml(item.personalRelevance)}</div>`
        : '';
      const link = item.sourceUrl
        ? `<p><a href="${escapeHtml(item.sourceUrl)}" target="_blank" rel="noopener noreferrer">打开原文 ↗</a></p>`
        : '';

      return `
        <article class="card">
          <div class="meta">${header}</div>
          <h3 class="title">${escapeHtml(item.title || '未命名')}</h3>
          <div class="summary">${toMultilineHtml(item.briefSummary)}</div>
          ${insights}
          ${relevance}
          ${link}
        </article>
      `;
    })
    .join('');

  const transparencyHtml = renderYoutubeTransparency(ytTransparency);
  return `<section class="youtube-list">${cards}</section>${transparencyHtml}`;
}

function renderTransparency(transparency) {
  if (!transparency) return '';
  const { accountsConfigured, totalTweetsFetched, includedInReport, nonAICount, byBlock, byConfiguredAccount, sumMatchesTotal } = transparency;
  const legacyNote = sumMatchesTotal === false
    ? '<p class="transparency-line" style="font-size:0.75rem;opacity:0.85;">本日为历史数据（无抓取来源信息），下方各账号原创/转发/引用之和不等于「抓取推文」总数，仅按作者统计。</p>'
    : '';
  let blockLine = '';
  if (byBlock && typeof byBlock === 'object' && Object.keys(byBlock).length > 0) {
    const parts = Object.entries(byBlock)
      .filter(([k]) => k !== '非 AI')
      .map(([k, v]) => `${k} ${v}`);
    if (parts.length) blockLine = `<p class="transparency-line">按块分布：${escapeHtml(parts.join('；'))}</p>`;
  }
  let accountLine = '';
  if (Array.isArray(byConfiguredAccount) && byConfiguredAccount.length > 0) {
    accountLine = '<p class="transparency-line">信息源：' + byConfiguredAccount
      .map((a) => `@${escapeHtml(a.handle)}（原创 ${a.originalCount} / 转发 ${a.retweetCount} / 引用 ${a.quoteCount} / 入选 ${a.includedCount}）`)
      .join('；') + '</p>';
  }
  return `
    <section class="transparency-block">
      <h3 class="transparency-title">📊 数据透明度</h3>
      ${legacyNote}
      <p class="transparency-line">配置账号 ${accountsConfigured} 个 · 抓取推文 ${totalTweetsFetched} 条 · 入选摘要 ${includedInReport} 条${nonAICount > 0 ? ` · 非 AI 已剔除 ${nonAICount} 条` : ''}</p>
      ${blockLine}
      ${accountLine}
    </section>
  `;
}

function renderApps(date) {
  const dayData = state.data.tabs.apps.days[date];
  const categories = dayData?.categories || [];
  const transparency = dayData?.transparency || null;

  if (!categories.length && !transparency) {
    return `<div class="empty">这一天暂无 X 资讯 内容。</div>`;
  }

  const categoriesHtml = categories
    .map((category) => {
      const name = escapeHtml(category.category || '未分类');
      const summary = category.summary
        ? `<div class="category-summary">${toMultilineHtml(category.summary)}</div>`
        : '';
      const items = (category.items || [])
        .map(
          (item) => `
            <article class="card">
              <h4 class="title">${escapeHtml(item.title || '未命名')}</h4>
              <div class="summary">${toMultilineHtml(item.summary)}</div>
            </article>
          `
        )
        .join('');

      return `
        <section class="category">
          <h3>${name}</h3>
          ${summary}
          <div class="apps-list">${items || ''}</div>
        </section>
      `;
    })
    .join('');

  const transparencyHtml = renderTransparency(transparency);
  return `<section>${categoriesHtml}</section>${transparencyHtml}`;
}

function renderBlog(date) {
  const dayData = state.data?.tabs?.blog?.days?.[date];
  if (!dayData) {
    return `<div class="empty">这一天暂无博客精选内容。</div>`;
  }
  const main = dayData.main || [];
  const uncertain = dayData.uncertain || [];
  if (!main.length && !uncertain.length) {
    return `<div class="empty">这一天暂无博客精选内容。</div>`;
  }
  const mainCards = main
    .map((item) => {
      const source = item.sourceName ? escapeHtml(item.sourceName) : '';
      const published = item.publishedAt ? formatDateTime(item.publishedAt) : '';
      const header = [source, published].filter(Boolean).join(' · ');
      const insights = Array.isArray(item.coreInsights)
        ? `<ul>${item.coreInsights.map((it) => `<li>${escapeHtml(it)}</li>`).join('')}</ul>`
        : '';
      const relevance = item.personalRelevance
        ? `<div class="summary"><p><strong>启发：</strong></p>${toMultilineHtml(item.personalRelevance)}</div>`
        : '';
      const link = item.sourceUrl
        ? `<p><a href="${escapeHtml(item.sourceUrl)}" target="_blank" rel="noopener noreferrer">打开原文 ↗</a></p>`
        : '';
      return `
        <article class="card">
          <div class="meta">${header}</div>
          <h3 class="title">${escapeHtml(item.title || '未命名')}</h3>
          <div class="summary">${toMultilineHtml(item.briefSummary)}</div>
          ${insights}
          ${relevance}
          ${link}
        </article>
      `;
    })
    .join('');
  const uncertainCards = uncertain
    .map((u) => {
      const intro = u.oneSentenceIntro ? `<p class="uncertain-intro">${escapeHtml(u.oneSentenceIntro)}</p>` : '';
      const source = u.sourceName ? escapeHtml(u.sourceName) : '';
      const link = u.link
        ? `<p><a href="${escapeHtml(u.link)}" target="_blank" rel="noopener noreferrer">打开原文 ↗</a></p>`
        : '';
      return `
        <article class="card card-uncertain">
          <h4 class="title">${escapeHtml(u.title || '未命名')}</h4>
          ${intro}
          <div class="meta">${source}</div>
          ${link}
        </article>
      `;
    })
    .join('');
  const uncertainSection =
    uncertainCards &&
    `<section class="blog-uncertain"><h3 class="section-title">其他可阅</h3>${uncertainCards}</section>`;
  return `<section class="youtube-list">${mainCards}</section>${uncertainSection || ''}`;
}

function render() {
  if (!state.data || !state.selectedDate) {
    contentEl.innerHTML = '<div class="loading">加载中...</div>';
    return;
  }

  const date = state.selectedDate;
  if (state.selectedTab === 'youtube') {
    contentEl.innerHTML = renderYoutube(date);
  } else if (state.selectedTab === 'apps') {
    contentEl.innerHTML = renderApps(date);
  } else if (state.selectedTab === 'blog') {
    contentEl.innerHTML = renderBlog(date);
  } else {
    contentEl.innerHTML = renderYoutube(date);
  }
}

async function loadData() {
  // 使用当前页面的 origin + pathname 解析 data 路径，避免 GitHub Pages 子路径下相对路径错误
  const dataUrl = new URL('data/digest.json', location.href).href;
  const res = await fetch(dataUrl, { cache: 'no-store' });
  if (!res.ok) throw new Error(`digest.json ${res.status}`);
  return res.json();
}

async function init() {
  try {
    let data;
    try {
      data = await loadData();
    } catch (first) {
      await new Promise((r) => setTimeout(r, 800));
      data = await loadData();
    }

    state.data = data;
    state.selectedDate = data.dates?.[0] || null;

    if (data.generatedAt) {
      updatedAtEl.textContent = `更新时间：${formatDateTime(data.generatedAt)}`;
    } else {
      updatedAtEl.textContent = '';
    }

    renderDateSelect();
    dateSelectEl?.addEventListener('change', () => {
      state.selectedDate = dateSelectEl.value || state.data?.dates?.[0] || null;
      render();
    });
    render();
  } catch (error) {
    console.error(error);
    contentEl.innerHTML =
      '<div class="empty">数据加载失败，请稍后重试（或检查 data/digest.json 是否存在）。</div>';
  }
}

tabYoutubeEl.addEventListener('click', () => setActiveTab('youtube'));
tabAppsEl.addEventListener('click', () => setActiveTab('apps'));
if (tabBlogEl) tabBlogEl.addEventListener('click', () => setActiveTab('blog'));

init();
