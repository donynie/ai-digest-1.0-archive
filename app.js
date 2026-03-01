const contentEl = document.getElementById('content');
const dateTabsEl = document.getElementById('date-tabs');
const updatedAtEl = document.getElementById('last-updated');
const tabYoutubeEl = document.getElementById('tab-youtube');
const tabAppsEl = document.getElementById('tab-apps');

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
  render();
}

function setActiveDate(date) {
  state.selectedDate = date;
  Array.from(dateTabsEl.querySelectorAll('.date-tab')).forEach((btn) => {
    btn.classList.toggle('active', btn.dataset.date === date);
  });
  render();
}

function renderDateTabs() {
  const dates = state.data?.dates || [];
  dateTabsEl.innerHTML = '';

  dates.forEach((date, index) => {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = `date-tab ${date === state.selectedDate ? 'active' : ''}`;
    btn.dataset.date = date;
    btn.textContent = formatDateLabel(date, index);
    btn.addEventListener('click', () => setActiveDate(date));
    dateTabsEl.appendChild(btn);
  });
}

function renderYoutube(date) {
  const dayData = state.data.tabs.youtube.days[date];
  const items = dayData?.items || [];
  if (!items.length) {
    return `<div class="empty">这一天暂无 YouTube 内容。</div>`;
  }

  const cards = items
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

  return `<section class="youtube-list">${cards}</section>`;
}

function renderApps(date) {
  const dayData = state.data.tabs.apps.days[date];
  const categories = dayData?.categories || [];
  if (!categories.length) {
    return `<div class="empty">这一天暂无 X 资讯 内容。</div>`;
  }

  const html = categories
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

  return `<section>${html}</section>`;
}

function render() {
  if (!state.data || !state.selectedDate) {
    contentEl.innerHTML = '<div class="loading">加载中...</div>';
    return;
  }

  const date = state.selectedDate;
  contentEl.innerHTML = state.selectedTab === 'youtube' ? renderYoutube(date) : renderApps(date);
}

async function init() {
  try {
    const res = await fetch('./data/digest.json', { cache: 'no-store' });
    if (!res.ok) throw new Error(`Failed to load digest.json (${res.status})`);
    const data = await res.json();

    state.data = data;
    state.selectedDate = data.dates?.[0] || null;

    if (data.generatedAt) {
      updatedAtEl.textContent = `更新时间：${formatDateTime(data.generatedAt)}`;
    } else {
      updatedAtEl.textContent = '';
    }

    renderDateTabs();
    render();
  } catch (error) {
    console.error(error);
    contentEl.innerHTML =
      '<div class="empty">数据加载失败，请稍后重试（或检查 data/digest.json 是否存在）。</div>';
  }
}

tabYoutubeEl.addEventListener('click', () => setActiveTab('youtube'));
tabAppsEl.addEventListener('click', () => setActiveTab('apps'));

init();
