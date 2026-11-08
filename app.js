/**
 * Meta Ad Miner Pro - Engine
 * Plataforma de Mineração de Ofertas da Meta Ad Library para GitHub Pages
 */

// Application State
let savedProxy = localStorage.getItem('meta_proxy_type') || 'direct';
// Migrate deprecated corsproxy.io to direct
if (savedProxy === 'corsproxy') {
  savedProxy = 'direct';
  localStorage.setItem('meta_proxy_type', 'direct');
}

const state = {
  token: localStorage.getItem('meta_ad_token') || '',
  proxyType: savedProxy,
  customProxyUrl: localStorage.getItem('meta_custom_proxy') || '',
  favorites: JSON.parse(localStorage.getItem('meta_ad_favorites') || '[]'),
  currentRawAds: [],
  filteredAds: [],
  nextPageUrl: null,
  isDemo: false,
  showVisualMedia: true,
};

// DOM Elements
const el = {
  searchForm: document.getElementById('search-form'),
  searchTerm: document.getElementById('search-term'),
  linkFilter: document.getElementById('link-filter'),
  filterStatus: document.getElementById('filter-status'),
  filterMinDays: document.getElementById('filter-min-days'),
  filterCountry: document.getElementById('filter-country'),
  filterLimit: document.getElementById('filter-limit'),
  filterPlatform: document.getElementById('filter-platform'),
  sortResults: document.getElementById('sort-results'),
  toggleVisualMedia: document.getElementById('toggle-visual-media'),
  
  metricsBar: document.getElementById('metrics-bar'),
  toolbarRow: document.getElementById('toolbar-row'),
  resultsContainer: document.getElementById('results-container'),
  initialState: document.getElementById('initial-state'),
  loadingState: document.getElementById('loading-state'),
  adsGrid: document.getElementById('ads-grid'),
  paginationWrapper: document.getElementById('pagination-wrapper'),
  btnLoadMore: document.getElementById('btn-load-more'),

  // Stats
  statTotal: document.getElementById('stat-total'),
  statValidated: document.getElementById('stat-validated'),
  statAvgDays: document.getElementById('stat-avg-days'),
  statOldest: document.getElementById('stat-oldest'),

  // Modal: Ad Preview Inside Tool
  modalAdPreview: document.getElementById('modal-ad-preview'),
  previewModalTitle: document.getElementById('preview-modal-title'),
  previewModalSubtitle: document.getElementById('preview-modal-subtitle'),
  previewModalExternal: document.getElementById('preview-modal-external'),
  previewMediaContainer: document.getElementById('preview-media-container'),
  previewPageName: document.getElementById('preview-page-name'),
  previewBadges: document.getElementById('preview-badges'),
  previewCopyText: document.getElementById('preview-copy-text'),
  previewCopyBtn: document.getElementById('preview-copy-btn'),
  previewOfferTitle: document.getElementById('preview-offer-title'),
  previewOfferDesc: document.getElementById('preview-offer-desc'),
  previewOfferLink: document.getElementById('preview-offer-link'),

  // Modals & triggers
  btnOpenSettings: document.getElementById('btn-open-settings'),
  modalSettings: document.getElementById('modal-settings'),
  formSettings: document.getElementById('form-settings'),
  settingToken: document.getElementById('setting-token'),
  settingProxy: document.getElementById('setting-proxy'),
  wrapperCustomProxy: document.getElementById('wrapper-custom-proxy'),
  settingCustomProxy: document.getElementById('setting-custom-proxy'),
  btnClearToken: document.getElementById('btn-clear-token'),

  btnOpenHelp: document.getElementById('btn-open-help'),
  modalHelp: document.getElementById('modal-help'),

  btnOpenFavorites: document.getElementById('btn-open-favorites'),
  modalFavorites: document.getElementById('modal-favorites'),
  favoritesGrid: document.getElementById('favorites-grid'),
  btnClearFavorites: document.getElementById('btn-clear-favorites'),
  favCounter: document.getElementById('fav-counter'),

  btnLoadDemo: document.getElementById('btn-load-demo'),
  btnInitialDemo: document.getElementById('btn-initial-demo'),
  btnInitialConfig: document.getElementById('btn-initial-config'),

  btnExportCsv: document.getElementById('btn-export-csv'),
  btnExportJson: document.getElementById('btn-export-json'),

  toast: document.getElementById('toast'),
  toastMsg: document.getElementById('toast-msg'),
  toastIcon: document.getElementById('toast-icon'),
};

// Initialize App
document.addEventListener('DOMContentLoaded', () => {
  lucide.createIcons();
  loadStoredSettings();
  updateFavoritesBadge();
  setupEventListeners();
});

// Load settings into inputs
function loadStoredSettings() {
  el.settingToken.value = state.token;
  el.settingProxy.value = state.proxyType;
  el.settingCustomProxy.value = state.customProxyUrl;
  
  if (state.proxyType === 'custom') {
    el.wrapperCustomProxy.classList.remove('hidden');
  }
}

// Event Listeners Setup
function setupEventListeners() {
  // Preset filter buttons
  document.querySelectorAll('.preset-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const days = e.currentTarget.dataset.days;
      const status = e.currentTarget.dataset.status;
      if (days !== undefined) el.filterMinDays.value = days;
      if (status !== undefined) el.filterStatus.value = status;
      applyFiltersAndRender();
      showToast(`Filtro rápido aplicado: +${days} dias, status ${status}`);
    });
  });

  // Search submission
  el.searchForm.addEventListener('submit', (e) => {
    e.preventDefault();
    initiateSearch();
  });

  // Client side filters change
  el.filterMinDays.addEventListener('input', () => applyFiltersAndRender());
  el.linkFilter.addEventListener('input', () => applyFiltersAndRender());
  el.filterPlatform.addEventListener('change', () => applyFiltersAndRender());
  el.sortResults.addEventListener('change', () => applyFiltersAndRender());

  if (el.toggleVisualMedia) {
    el.toggleVisualMedia.addEventListener('change', (e) => {
      state.showVisualMedia = e.target.checked;
      applyFiltersAndRender();
    });
  }

  // Demo triggers
  if (el.btnLoadDemo) el.btnLoadDemo.addEventListener('click', () => loadDemoData());
  if (el.btnInitialDemo) el.btnInitialDemo.addEventListener('click', () => loadDemoData());
  if (el.btnInitialConfig) el.btnInitialConfig.addEventListener('click', () => openModal(el.modalSettings));

  // Modals Open/Close
  el.btnOpenSettings.addEventListener('click', () => openModal(el.modalSettings));
  el.btnOpenHelp.addEventListener('click', () => openModal(el.modalHelp));
  el.btnOpenFavorites.addEventListener('click', () => {
    renderFavoritesModal();
    openModal(el.modalFavorites);
  });

  document.querySelectorAll('.modal-close').forEach(btn => {
    btn.addEventListener('click', () => {
      closeAllModals();
    });
  });

  // Close modal when clicking backdrop
  [el.modalSettings, el.modalHelp, el.modalFavorites, el.modalAdPreview, document.getElementById('modal-verification')].forEach(modal => {
    if (!modal) return;
    modal.addEventListener('click', (e) => {
      if (e.target === modal) closeAllModals();
    });
  });

  // Settings Save
  el.formSettings.addEventListener('submit', (e) => {
    e.preventDefault();
    state.token = el.settingToken.value.trim();
    state.proxyType = el.settingProxy.value;
    state.customProxyUrl = el.settingCustomProxy.value.trim();

    localStorage.setItem('meta_ad_token', state.token);
    localStorage.setItem('meta_proxy_type', state.proxyType);
    localStorage.setItem('meta_custom_proxy', state.customProxyUrl);

    closeAllModals();
    showToast('Configurações salvas com sucesso!', 'success');
  });

  // Setting Proxy Change
  el.settingProxy.addEventListener('change', (e) => {
    if (e.target.value === 'custom') {
      el.wrapperCustomProxy.classList.remove('hidden');
    } else {
      el.wrapperCustomProxy.classList.add('hidden');
    }
  });

  // Clear Token
  el.btnClearToken.addEventListener('click', () => {
    state.token = '';
    el.settingToken.value = '';
    localStorage.removeItem('meta_ad_token');
    showToast('Token removido.', 'info');
  });

  // Clear Favorites
  el.btnClearFavorites.addEventListener('click', () => {
    if (confirm('Deseja realmente limpar todos os favoritos do Swipe File?')) {
      state.favorites = [];
      localStorage.setItem('meta_ad_favorites', JSON.stringify([]));
      updateFavoritesBadge();
      renderFavoritesModal();
      applyFiltersAndRender();
      showToast('Swipe File limpo.');
    }
  });

  // Load More Ads
  el.btnLoadMore.addEventListener('click', () => {
    if (state.nextPageUrl) {
      fetchNextPage(state.nextPageUrl);
    }
  });

  // Export buttons
  el.btnExportCsv.addEventListener('click', exportToCsv);
  el.btnExportJson.addEventListener('click', exportToJson);
}

// Show verification required helper modal (Error 2332002)
function showVerificationRequiredModal(details) {
  const modal = document.getElementById('modal-verification');
  if (modal) {
    openModal(modal);
  } else {
    alert(
      "Aviso da Meta:\n\n" +
      "Para liberar o acesso à API da Biblioteca de Anúncios, a Meta exige que você confirme sua identidade no link oficial:\n" +
      "https://facebook.com/ads/library/api\n\n" +
      "Acesse o link, confirme seu perfil de desenvolvedor e tente novamente!"
    );
  }
}

// Open full ad preview inside tool modal
function openAdPreviewModal(ad) {
  if (!el.modalAdPreview) return;
  el.previewPageName.textContent = ad.pageName;
  el.previewModalTitle.textContent = ad.pageName;
  el.previewModalSubtitle.textContent = `ID do Anúncio: ${ad.id} • ${ad.daysRunning} dias ativo`;
  el.previewModalExternal.href = ad.snapshotUrl;

  // Badges
  let badgeHtml = '';
  if (ad.daysRunning >= 30) {
    badgeHtml += `<span class="px-2 py-0.5 rounded text-[10px] font-bold bg-purple-500/20 text-purple-300">👑 Super Escala: ${ad.daysRunning}d</span>`;
  } else if (ad.daysRunning >= 10) {
    badgeHtml += `<span class="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500/20 text-amber-300">🔥 Validado: ${ad.daysRunning}d</span>`;
  } else {
    badgeHtml += `<span class="px-2 py-0.5 rounded text-[10px] bg-slate-800 text-slate-400">⏱️ ${ad.daysRunning}d no ar</span>`;
  }
  badgeHtml += ad.isActive
    ? `<span class="px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-500/20 text-emerald-400">● Ativo</span>`
    : `<span class="px-2 py-0.5 rounded text-[10px] bg-slate-800 text-slate-400">Inativo</span>`;
  el.previewBadges.innerHTML = badgeHtml;

  // Copy
  el.previewCopyText.textContent = ad.primaryText || '(Sem texto capturado)';
  el.previewCopyBtn.onclick = () => {
    navigator.clipboard.writeText(ad.primaryText || '');
    showToast('Copy copiada!', 'success');
  };

  // Offer Info
  if (ad.title || ad.destinationUrl) {
    el.previewOfferTitle.textContent = ad.title || 'Oferta Principal';
    el.previewOfferDesc.textContent = ad.description || (ad.destinationUrl ? new URL(ad.destinationUrl).hostname : '');
    el.previewOfferLink.href = ad.destinationUrl || ad.snapshotUrl;
  } else {
    el.previewOfferTitle.textContent = 'Link não especificado';
    el.previewOfferDesc.textContent = '';
    el.previewOfferLink.href = ad.snapshotUrl;
  }

  // Media Container (Direct render in modal)
  el.previewMediaContainer.innerHTML = '';
  if (ad.imageUrl) {
    el.previewMediaContainer.innerHTML = `
      <div class="flex flex-col items-center justify-center p-4 w-full h-full">
        <img src="${ad.imageUrl}" alt="${escapeHtml(ad.pageName)}" class="max-h-[500px] w-auto max-w-full object-contain rounded-xl shadow-2xl">
      </div>
    `;
  } else if (ad.snapshotUrl) {
    el.previewMediaContainer.innerHTML = `
      <iframe src="${ad.snapshotUrl}" class="w-full h-full min-h-[460px] border-0 rounded-xl bg-slate-950" sandbox="allow-scripts allow-same-origin allow-popups" loading="lazy"></iframe>
    `;
  }

  openModal(el.modalAdPreview);
}

// Modal management
function openModal(modal) {
  modal.classList.remove('hidden');
  lucide.createIcons();
}

function closeAllModals() {
  if (el.modalSettings) el.modalSettings.classList.add('hidden');
  if (el.modalHelp) el.modalHelp.classList.add('hidden');
  if (el.modalFavorites) el.modalFavorites.classList.add('hidden');
  if (el.modalAdPreview) el.modalAdPreview.classList.add('hidden');
  const modVer = document.getElementById('modal-verification');
  if (modVer) modVer.classList.add('hidden');
}

// Toast Notification
function showToast(message, type = 'info') {
  el.toastMsg.textContent = message;
  el.toast.classList.remove('translate-y-20', 'opacity-0');
  setTimeout(() => {
    el.toast.classList.add('translate-y-20', 'opacity-0');
  }, 3500);
}

// Calculate days running
function calculateDaysRunning(startDateStr, stopDateStr, isActive) {
  if (!startDateStr) return 0;
  const start = new Date(startDateStr);
  const end = (isActive || !stopDateStr) ? new Date() : new Date(stopDateStr);
  
  const diffTime = end.getTime() - start.getTime();
  const diffDays = Math.max(0, Math.floor(diffTime / (1000 * 60 * 60 * 24)));
  return diffDays;
}

// Format Date string: DD/MM/YYYY
function formatDate(dateStr) {
  if (!dateStr) return 'N/D';
  try {
    const d = new Date(dateStr);
    return d.toLocaleDateString('pt-BR');
  } catch (err) {
    return dateStr;
  }
}

// Search Execution
async function initiateSearch() {
  const query = el.searchTerm.value.trim();
  if (!query) {
    showToast('Digite um termo para pesquisar.', 'warning');
    return;
  }

  // If no token is provided, alert and offer demo or modal
  if (!state.token) {
    const wantsDemo = confirm(
      'Nenhum Token da Meta configurado.\n\n' +
      'Deseja carregar a Demonstração com ofertas validadas pré-carregadas?\n' +
      '(Ou clique em Cancelar para inserir seu Token).'
    );
    if (wantsDemo) {
      loadDemoData();
    } else {
      openModal(el.modalSettings);
    }
    return;
  }

  state.isDemo = false;
  el.initialState.classList.add('hidden');
  el.loadingState.classList.remove('hidden');
  el.adsGrid.innerHTML = '';
  el.metricsBar.classList.add('hidden');
  el.toolbarRow.classList.add('hidden');
  el.paginationWrapper.classList.add('hidden');

  try {
    const country = el.filterCountry.value === 'ALL' ? 'ALL' : el.filterCountry.value;
    const status = el.filterStatus.value;
    const limit = el.filterLimit.value;

    // Meta Graph API Endpoint
    const baseUrl = `https://graph.facebook.com/v21.0/ads_archive`;
    const params = new URLSearchParams({
      access_token: state.token,
      search_terms: query,
      ad_active_status: status,
      ad_type: 'ALL',
      limit: limit,
      fields: [
        'id',
        'ad_creation_time',
        'ad_delivery_start_time',
        'ad_delivery_stop_time',
        'ad_snapshot_url',
        'page_id',
        'page_name',
        'publisher_platforms',
        'languages',
        'currency',
        'spend',
        'impressions',
        'creative_bodies',
        'creative_link_captions',
        'creative_link_descriptions',
        'creative_link_titles',
        'creative_link_urls',
        'ad_creative_link_titles',
        'ad_creative_link_captions',
        'ad_creative_link_descriptions',
        'ad_creative_link_urls'
      ].join(',')
    });

    if (country !== 'ALL') {
      params.append('ad_reached_countries', `['${country}']`);
    }

    const fullUrl = `${baseUrl}?${params.toString()}`;
    const fetchUrl = applyCorsProxy(fullUrl);

    const response = await fetch(fetchUrl);
    if (!response.ok) {
      if (response.status === 401) {
        throw new Error("Token de acesso expirado ou inválido (401). Gere um novo no Graph API Explorer e atualize em 'Configurar Token'.");
      }
      const errorJson = await response.json().catch(() => ({}));
      const subcode = errorJson.error?.error_subcode;
      const errCode = errorJson.error?.code;

      if (subcode === 2332002 || subcode === 2332004) {
        showVerificationRequiredModal(errorJson.error?.error_user_msg || errorJson.error?.message);
        return;
      }
      if (errCode === 190) {
        throw new Error("O Token da Meta expirou (Código 190). Gere um novo token no Graph API Explorer e atualize.");
      }
      throw new Error(errorJson.error?.message || `Erro HTTP ${response.status}`);
    }

    const data = await response.json();
    const rawAds = data.data || [];
    state.nextPageUrl = data.paging?.next || null;

    if (rawAds.length === 0) {
      showToast('Nenhum anúncio encontrado para essa busca.', 'info');
    } else {
      showToast(`${rawAds.length} anúncios minerados com sucesso!`, 'success');
    }

    // Process Ads into standard model
    state.currentRawAds = rawAds.map(item => normalizeAd(item));
    applyFiltersAndRender();

  } catch (err) {
    console.error('Erro na mineração:', err);
    showToast(`Falha na API: ${err.message}`, 'error');
    
    // Provide fallback helper
    el.loadingState.classList.add('hidden');
    el.initialState.classList.remove('hidden');
  } finally {
    el.loadingState.classList.add('hidden');
  }
}

// Next page fetch
async function fetchNextPage(nextUrl) {
  el.btnLoadMore.disabled = true;
  el.btnLoadMore.textContent = 'Carregando mais anúncios...';

  try {
    const fetchUrl = applyCorsProxy(nextUrl);
    const response = await fetch(fetchUrl);
    if (!response.ok) throw new Error(`Erro ${response.status}`);
    const data = await response.json();
    
    const newRawAds = (data.data || []).map(item => normalizeAd(item));
    state.currentRawAds = [...state.currentRawAds, ...newRawAds];
    state.nextPageUrl = data.paging?.next || null;

    applyFiltersAndRender();
    showToast(`+${newRawAds.length} anúncios adicionados!`);
  } catch (err) {
    showToast(`Erro ao carregar mais: ${err.message}`);
  } finally {
    el.btnLoadMore.disabled = false;
    el.btnLoadMore.innerHTML = `<i data-lucide="plus-circle" class="w-4 h-4 text-indigo-400"></i> Carregar Próxima Página`;
    lucide.createIcons();
  }
}

// Apply CORS Proxy Wrapper
function applyCorsProxy(targetUrl) {
  switch (state.proxyType) {
    case 'custom':
      return `${state.customProxyUrl}${encodeURIComponent(targetUrl)}`;
    case 'allorigins':
      return `https://api.allorigins.win/raw?url=${encodeURIComponent(targetUrl)}`;
    case 'direct':
    default:
      return targetUrl;
  }
}

// Normalize Meta API ad object into unified model
function normalizeAd(raw) {
  const isActive = !raw.ad_delivery_stop_time;
  const startDate = raw.ad_delivery_start_time || raw.ad_creation_time;
  const stopDate = raw.ad_delivery_stop_time || null;
  const daysRunning = calculateDaysRunning(startDate, stopDate, isActive);

  // Extract copy / bodies
  const bodies = raw.creative_bodies || [];
  const primaryText = Array.isArray(bodies) ? (bodies[0] || '') : (bodies || '');

  // Extract Titles
  const titles = raw.creative_link_titles || raw.ad_creative_link_titles || [];
  const primaryTitle = Array.isArray(titles) ? (titles[0] || '') : (titles || '');

  // Extract Descriptions
  const descriptions = raw.creative_link_descriptions || raw.ad_creative_link_descriptions || [];
  const primaryDesc = Array.isArray(descriptions) ? (descriptions[0] || '') : (descriptions || '');

  // Extract Destination URLs
  const urls = raw.creative_link_urls || raw.ad_creative_link_urls || [];
  const destinationUrl = Array.isArray(urls) ? (urls[0] || '') : (urls || '');

  // Extract Platforms
  const platforms = raw.publisher_platforms || ['facebook', 'instagram'];

  return {
    id: raw.id,
    pageId: raw.page_id,
    pageName: raw.page_name || 'Anunciante',
    startDate: startDate,
    stopDate: stopDate,
    daysRunning: daysRunning,
    isActive: isActive,
    primaryText: primaryText,
    title: primaryTitle,
    description: primaryDesc,
    destinationUrl: destinationUrl,
    imageUrl: raw.imageUrl || raw.image_url || null,
    snapshotUrl: raw.ad_snapshot_url || `https://www.facebook.com/ads/library/?id=${raw.id}`,
    platforms: platforms,
    currency: raw.currency || 'BRL',
    spend: raw.spend || null,
    raw: raw
  };
}

// Client-Side Filter & Sort Engine
function applyFiltersAndRender() {
  const minDays = parseInt(el.filterMinDays.value, 10) || 0;
  const linkSearch = el.linkFilter.value.trim().toLowerCase();
  const platformFilter = el.filterPlatform.value;
  const statusFilter = el.filterStatus.value;
  const sortBy = el.sortResults.value;

  let filtered = state.currentRawAds.filter(ad => {
    // 1. Min Days running
    if (ad.daysRunning < minDays) return false;

    // 2. Status
    if (statusFilter === 'ACTIVE' && !ad.isActive) return false;
    if (statusFilter === 'INACTIVE' && ad.isActive) return false;

    // 3. Link or Domain search
    if (linkSearch) {
      const inDest = (ad.destinationUrl || '').toLowerCase().includes(linkSearch);
      const inText = (ad.primaryText || '').toLowerCase().includes(linkSearch);
      const inTitle = (ad.title || '').toLowerCase().includes(linkSearch);
      if (!inDest && !inText && !inTitle) return false;
    }

    // 4. Platform
    if (platformFilter !== 'ALL') {
      if (!ad.platforms.includes(platformFilter)) return false;
    }

    return true;
  });

  // Sort logic
  filtered.sort((a, b) => {
    if (sortBy === 'days-desc') return b.daysRunning - a.daysRunning;
    if (sortBy === 'date-desc') return new Date(b.startDate || 0) - new Date(a.startDate || 0);
    if (sortBy === 'date-asc') return new Date(a.startDate || 0) - new Date(b.startDate || 0);
    if (sortBy === 'page-asc') return a.pageName.localeCompare(b.pageName);
    return 0;
  });

  state.filteredAds = filtered;
  renderAdsGrid(filtered);
  updateMetrics(filtered);
}

// Render Ads Grid
function renderAdsGrid(ads) {
  el.initialState.classList.add('hidden');
  el.loadingState.classList.add('hidden');
  el.adsGrid.innerHTML = '';

  if (ads.length === 0) {
    el.adsGrid.innerHTML = `
      <div class="col-span-full py-12 text-center bg-dark-900/50 rounded-2xl border border-slate-800">
        <i data-lucide="filter-x" class="w-10 h-10 text-slate-500 mx-auto mb-2"></i>
        <h4 class="text-sm font-semibold text-slate-300">Nenhum anúncio corresponde aos filtros aplicados</h4>
        <p class="text-xs text-slate-500 mt-1">Tente reduzir o "Mínimo de dias ativo" ou limpar o filtro de link/domínio.</p>
      </div>
    `;
    lucide.createIcons();
    return;
  }

  el.metricsBar.classList.remove('hidden');
  el.metricsBar.classList.add('grid');
  el.toolbarRow.classList.remove('hidden');
  el.toolbarRow.classList.add('flex');

  if (state.nextPageUrl && !state.isDemo) {
    el.paginationWrapper.classList.remove('hidden');
  } else {
    el.paginationWrapper.classList.add('hidden');
  }

  const fragment = document.createDocumentFragment();

  ads.forEach(ad => {
    const isFav = state.favorites.some(f => f.id === ad.id);
    const isValidated = ad.daysRunning >= 10;
    const isSuperScale = ad.daysRunning >= 30;

    const card = document.createElement('div');
    card.className = 'ad-card bg-dark-900 border border-slate-800/90 rounded-2xl p-5 flex flex-col justify-between shadow-lg relative overflow-hidden';

    // Top status indicator bar
    let badgeHtml = '';
    if (isSuperScale) {
      badgeHtml = `
        <span class="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-purple-500/15 border border-purple-500/30 text-purple-300 badge-validated">
          <i data-lucide="crown" class="w-3 h-3 text-purple-400"></i>
          Super Escala: ${ad.daysRunning} dias
        </span>
      `;
    } else if (isValidated) {
      badgeHtml = `
        <span class="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-500/15 border border-amber-500/30 text-amber-300 badge-validated">
          <i data-lucide="flame" class="w-3 h-3 text-amber-400"></i>
          Validado: ${ad.daysRunning} dias
        </span>
      `;
    } else {
      badgeHtml = `
        <span class="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-slate-800 border border-slate-700 text-slate-400">
          <i data-lucide="clock" class="w-3 h-3"></i>
          ${ad.daysRunning} dias no ar
        </span>
      `;
    }

    const activeBadge = ad.isActive
      ? `<span class="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30"><span class="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping"></span> Ativo</span>`
      : `<span class="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-medium bg-slate-800 text-slate-400">Inativo</span>`;

    // Platforms icon list
    const platformIcons = ad.platforms.map(p => {
      if (p.includes('facebook')) return `<span title="Facebook" class="text-blue-400 text-xs">FB</span>`;
      if (p.includes('instagram')) return `<span title="Instagram" class="text-pink-400 text-xs">IG</span>`;
      if (p.includes('messenger')) return `<span title="Messenger" class="text-sky-400 text-xs">MSG</span>`;
      return `<span class="text-slate-400 text-xs">${p}</span>`;
    }).join(' • ');

    // Domain pill
    let domainPill = '';
    if (ad.destinationUrl) {
      try {
        const urlObj = new URL(ad.destinationUrl);
        domainPill = `
          <a href="${ad.destinationUrl}" target="_blank" rel="noopener noreferrer" class="inline-flex items-center gap-1 text-[11px] text-indigo-400 hover:text-indigo-300 font-mono bg-indigo-950/40 border border-indigo-800/40 px-2 py-0.5 rounded-md truncate max-w-full">
            <i data-lucide="external-link" class="w-3 h-3 flex-shrink-0"></i>
            <span class="truncate">${urlObj.hostname}</span>
          </a>
        `;
      } catch (e) {
        domainPill = `<span class="text-[11px] text-slate-500 truncate">${ad.destinationUrl}</span>`;
      }
    }

    // Visual Creative Embed Box
    let mediaBoxHtml = '';
    if (state.showVisualMedia) {
      if (ad.imageUrl) {
        mediaBoxHtml = `
          <div class="my-3 rounded-xl overflow-hidden border border-slate-800 bg-slate-950 relative group cursor-pointer btn-open-preview" data-ad-id="${ad.id}">
            <div class="relative w-full aspect-video bg-slate-900 overflow-hidden">
              <img src="${ad.imageUrl}" alt="${escapeHtml(ad.pageName)}" class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" loading="lazy">
              <div class="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent flex items-end justify-between p-2.5">
                <span class="text-[10px] text-white/90 font-medium flex items-center gap-1 bg-black/60 backdrop-blur px-2 py-0.5 rounded">
                  <i data-lucide="image" class="w-3 h-3 text-indigo-400"></i> Criativo
                </span>
                <span class="text-[10px] text-indigo-300 font-semibold flex items-center gap-1 bg-indigo-950/80 border border-indigo-500/40 px-2 py-0.5 rounded">
                  <i data-lucide="eye" class="w-3 h-3"></i> Ver Anúncio
                </span>
              </div>
            </div>
          </div>
        `;
      } else if (ad.snapshotUrl) {
        mediaBoxHtml = `
          <div class="my-3 rounded-xl overflow-hidden border border-slate-800 bg-slate-950 relative group">
            <div class="relative w-full h-[320px] bg-slate-950">
              <iframe 
                src="${ad.snapshotUrl}" 
                class="w-full h-full border-0" 
                loading="lazy" 
                sandbox="allow-scripts allow-same-origin allow-popups"
                title="Prévia do Anúncio ${ad.id}">
              </iframe>
              <button 
                type="button" 
                class="btn-open-preview absolute top-2 right-2 px-2.5 py-1 rounded-lg bg-dark-900/90 hover:bg-dark-900 border border-slate-700 text-[11px] text-slate-200 shadow-md backdrop-blur flex items-center gap-1 transition-all"
                data-ad-id="${ad.id}"
              >
                <i data-lucide="maximize-2" class="w-3 h-3 text-indigo-400"></i> Expandir
              </button>
            </div>
          </div>
        `;
      }
    }

    card.innerHTML = `
      <!-- Card Header -->
      <div>
        <div class="flex items-start justify-between gap-2 mb-3">
          <div class="flex-1 min-w-0">
            <div class="flex items-center gap-1.5 mb-1">
              ${activeBadge}
              ${badgeHtml}
            </div>
            <h4 class="font-bold text-sm text-white truncate" title="${escapeHtml(ad.pageName)}">
              ${escapeHtml(ad.pageName)}
            </h4>
            <div class="text-[11px] text-slate-400 flex items-center gap-2 mt-0.5">
              <span>Início: <b>${formatDate(ad.startDate)}</b></span>
              <span>•</span>
              <span class="font-mono text-[10px]">${platformIcons}</span>
            </div>
          </div>

          <!-- Favorite Button -->
          <button class="btn-fav p-1.5 rounded-lg border transition-all ${isFav ? 'bg-pink-500/20 border-pink-500/50 text-pink-400' : 'bg-slate-800/80 border-slate-700 text-slate-400 hover:text-pink-400'}" data-id="${ad.id}" title="${isFav ? 'Remover dos Favoritos' : 'Salvar no Swipe File'}">
            <i data-lucide="bookmark" class="w-4 h-4 ${isFav ? 'fill-current' : ''}"></i>
          </button>
        </div>

        <!-- Embedded Visual Media (Ad Creative) -->
        ${mediaBoxHtml}

        <!-- Copy / Creative Body -->
        <div class="my-3 p-3 rounded-xl bg-dark-950/70 border border-slate-800/80">
          <div class="flex items-center justify-between text-[11px] text-slate-400 mb-1.5 pb-1 border-b border-slate-800/50">
            <span class="font-medium text-slate-400">Copy / Texto do Anúncio</span>
            <button class="btn-copy-text text-indigo-400 hover:text-indigo-300 inline-flex items-center gap-1 text-[10px]" data-text="${escapeHtml(ad.primaryText || '')}">
              <i data-lucide="copy" class="w-3 h-3"></i> Copiar
            </button>
          </div>
          <p class="text-xs text-slate-200 leading-relaxed line-clamp-3 whitespace-pre-wrap font-sans selection:bg-indigo-600">
            ${escapeHtml(ad.primaryText || '(Sem texto capturado)')}
          </p>
        </div>

        <!-- Offer Title & Description -->
        ${ad.title ? `
          <div class="mb-2">
            <h5 class="text-xs font-semibold text-slate-200 truncate">${escapeHtml(ad.title)}</h5>
            ${ad.description ? `<p class="text-[11px] text-slate-400 truncate mt-0.5">${escapeHtml(ad.description)}</p>` : ''}
          </div>
        ` : ''}

        <!-- Domain / Destination Link -->
        <div class="mb-4">
          ${domainPill || '<span class="text-[11px] text-slate-500">Sem link direto capturado</span>'}
        </div>
      </div>

      <!-- Card Footer Actions -->
      <div class="pt-3 border-t border-slate-800/80 flex items-center justify-between gap-2 mt-2">
        <button 
          type="button" 
          class="btn-open-preview flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 text-white shadow-md shadow-indigo-600/25 transition-all"
          data-ad-id="${ad.id}"
        >
          <i data-lucide="eye" class="w-3.5 h-3.5"></i>
          Ver na Ferramenta
        </button>

        ${ad.destinationUrl ? `
          <a 
            href="${ad.destinationUrl}" 
            target="_blank" 
            rel="noopener noreferrer" 
            class="inline-flex items-center justify-center p-2 rounded-xl text-xs font-medium bg-slate-800 border border-slate-700 text-slate-300 hover:text-white hover:bg-slate-700 transition-all"
            title="Abrir Página da Oferta / Landing Page"
          >
            <i data-lucide="globe" class="w-4 h-4 text-emerald-400"></i>
          </a>
        ` : ''}

        <a 
          href="${ad.snapshotUrl}" 
          target="_blank" 
          rel="noopener noreferrer" 
          class="inline-flex items-center justify-center p-2 rounded-xl text-xs font-medium bg-slate-800 border border-slate-700 text-slate-400 hover:text-indigo-300 hover:bg-slate-700 transition-all"
          title="Abrir na Biblioteca Meta Oficial"
        >
          <i data-lucide="external-link" class="w-4 h-4"></i>
        </a>
      </div>
    `;

    // Bind Favorite button inside card
    const favBtn = card.querySelector('.btn-fav');
    favBtn.addEventListener('click', () => toggleFavorite(ad));

    // Bind Preview Open buttons
    card.querySelectorAll('.btn-open-preview').forEach(btn => {
      btn.addEventListener('click', () => openAdPreviewModal(ad));
    });

    // Bind Copy button
    const copyBtn = card.querySelector('.btn-copy-text');
    if (copyBtn) {
      copyBtn.addEventListener('click', (e) => {
        const text = e.currentTarget.getAttribute('data-text');
        navigator.clipboard.writeText(text);
        showToast('Texto do anúncio copiado!', 'success');
      });
    }

    fragment.appendChild(card);
  });

  el.adsGrid.appendChild(fragment);
  lucide.createIcons();
}

// Update Top Metric Counters
function updateMetrics(ads) {
  const total = ads.length;
  const validated = ads.filter(a => a.daysRunning >= 10).length;
  
  const sumDays = ads.reduce((acc, a) => acc + a.daysRunning, 0);
  const avgDays = total > 0 ? Math.round(sumDays / total) : 0;

  const maxDays = ads.reduce((max, a) => Math.max(max, a.daysRunning), 0);

  el.statTotal.textContent = total;
  el.statValidated.textContent = validated;
  el.statAvgDays.textContent = `${avgDays} d`;
  el.statOldest.textContent = `${maxDays} d`;
}

// Favorites / Swipe File Management
function toggleFavorite(ad) {
  const index = state.favorites.findIndex(f => f.id === ad.id);
  if (index > -1) {
    state.favorites.splice(index, 1);
    showToast('Removido do Swipe File');
  } else {
    state.favorites.push(ad);
    showToast('Adicionado ao Swipe File!', 'success');
  }

  localStorage.setItem('meta_ad_favorites', JSON.stringify(state.favorites));
  updateFavoritesBadge();
  applyFiltersAndRender();
}

function updateFavoritesBadge() {
  el.favCounter.textContent = state.favorites.length;
}

function renderFavoritesModal() {
  el.favoritesGrid.innerHTML = '';
  if (state.favorites.length === 0) {
    el.favoritesGrid.innerHTML = `
      <div class="col-span-full py-10 text-center text-slate-500">
        <i data-lucide="bookmark-x" class="w-8 h-8 mx-auto mb-2 opacity-50"></i>
        <p class="text-xs">Nenhum anúncio salvo no Swipe File ainda.</p>
        <p class="text-[11px] text-slate-600 mt-1">Clique no ícone de marcador nos cards para salvar anúncios vencedores.</p>
      </div>
    `;
    lucide.createIcons();
    return;
  }

  state.favorites.forEach(ad => {
    const item = document.createElement('div');
    item.className = 'bg-dark-950 border border-slate-800 rounded-xl p-4 flex flex-col justify-between';
    item.innerHTML = `
      <div>
        <div class="flex items-center justify-between mb-2">
          <span class="font-bold text-xs text-white truncate">${escapeHtml(ad.pageName)}</span>
          <span class="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500/15 text-amber-300">
            ${ad.daysRunning} dias
          </span>
        </div>
        <p class="text-[11px] text-slate-300 line-clamp-3 mb-2 font-mono">${escapeHtml(ad.primaryText || '')}</p>
        ${ad.destinationUrl ? `<p class="text-[10px] text-indigo-400 truncate font-mono">${ad.destinationUrl}</p>` : ''}
      </div>
      <div class="mt-3 pt-2 border-t border-slate-800/80 flex items-center justify-between">
        <a href="${ad.snapshotUrl}" target="_blank" class="text-xs text-indigo-400 hover:underline">Ver na Biblioteca</a>
        <button class="btn-remove-fav text-xs text-rose-400 hover:text-rose-300" data-id="${ad.id}">Remover</button>
      </div>
    `;

    item.querySelector('.btn-remove-fav').addEventListener('click', () => {
      toggleFavorite(ad);
      renderFavoritesModal();
    });

    el.favoritesGrid.appendChild(item);
  });
  lucide.createIcons();
}

// Export to CSV
function exportToCsv() {
  if (state.filteredAds.length === 0) {
    showToast('Nenhum dado para exportar.', 'warning');
    return;
  }

  const headers = ['ID', 'Página', 'Status', 'Dias no Ar', 'Data Início', 'Plataformas', 'Título da Oferta', 'Link da Oferta', 'Link na Biblioteca Meta', 'Texto da Copy'];
  
  const rows = state.filteredAds.map(ad => [
    `"${ad.id}"`,
    `"${(ad.pageName || '').replace(/"/g, '""')}"`,
    `"${ad.isActive ? 'Ativo' : 'Inativo'}"`,
    ad.daysRunning,
    `"${ad.startDate || ''}"`,
    `"${ad.platforms.join(', ')}"`,
    `"${(ad.title || '').replace(/"/g, '""')}"`,
    `"${(ad.destinationUrl || '').replace(/"/g, '""')}"`,
    `"${ad.snapshotUrl || ''}"`,
    `"${(ad.primaryText || '').replace(/"/g, '""')}"`
  ]);

  const csvContent = '\uFEFF' + [headers.join(','), ...rows.map(r => r.join(','))].join('\r\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', `meta_ofertas_validadas_${new Date().toISOString().slice(0, 10)}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);

  showToast('Planilha CSV exportada com sucesso!', 'success');
}

// Export to JSON
function exportToJson() {
  if (state.filteredAds.length === 0) {
    showToast('Nenhum dado para exportar.', 'warning');
    return;
  }

  const jsonContent = JSON.stringify(state.filteredAds, null, 2);
  const blob = new Blob([jsonContent], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', `meta_ofertas_${new Date().toISOString().slice(0, 10)}.json`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);

  showToast('Arquivo JSON exportado!', 'success');
}

// Helper: Escape HTML
function escapeHtml(str) {
  if (!str) return '';
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

// Load Demo Dataset for testing immediately
function loadDemoData() {
  state.isDemo = true;
  el.searchTerm.value = 'emagrecimento & encapsulados';
  el.filterMinDays.value = '10';

  const today = new Date();
  const daysAgo = (days) => {
    const d = new Date(today);
    d.setDate(d.getDate() - days);
    return d.toISOString();
  };

  const demoAds = [
    {
      id: '984321782391023',
      pageId: '109283746152',
      pageName: 'NutriSlim Brasil Oficial',
      startDate: daysAgo(47),
      stopDate: null,
      daysRunning: 47,
      isActive: true,
      imageUrl: 'https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?w=600&auto=format&fit=crop&q=80',
      primaryText: '🚨 Revelado o segredo das clínicas de estética! Apenas 2 gotas pela manhã antes do café aceleram o metabolismo sem dietas restritivas. Mais de 4.800 mulheres já testaram e aprovaram essa fórmula 100% natural com registro na Anvisa.\n\n👉 Toque no botão e aproveite o kit com frete grátis!',
      title: 'Fórmula Termogênica Concentrada - 2 Gotas ao Dia',
      description: 'Resultados visíveis logo nas primeiras semanas. Garantia incondicional de 90 dias.',
      destinationUrl: 'https://nutrislim.com.br/oferta-especial?src=meta_c1',
      snapshotUrl: 'https://www.facebook.com/ads/library/?id=984321782391023',
      platforms: ['facebook', 'instagram']
    },
    {
      id: '873429182309182',
      pageId: '209384718293',
      pageName: 'Academia do Tráfego Pago',
      startDate: daysAgo(34),
      stopDate: null,
      daysRunning: 34,
      isActive: true,
      imageUrl: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=600&auto=format&fit=crop&q=80',
      primaryText: 'Quer parar de perder dinheiro subindo campanhas no escuro? Criamos uma esteira automática de mineração e validação de criativos no Meta Ads.\n\nAssista à aula prática de 15 minutos onde mostramos o passo a passo da nossa estrutura de escala.',
      title: 'Masterclass Gratuita: Escala Previsível no Facebook Ads',
      description: 'Sem enrolação: aprenda a identificar criativos com ROAS 4x.',
      destinationUrl: 'https://academiadotrafego.kiwify.com.br/escala-secreta',
      snapshotUrl: 'https://www.facebook.com/ads/library/?id=873429182309182',
      platforms: ['facebook', 'instagram', 'messenger']
    },
    {
      id: '564738291029384',
      pageId: '304958271625',
      pageName: 'Casa & Conforto Inteligente',
      startDate: daysAgo(21),
      stopDate: null,
      daysRunning: 21,
      isActive: true,
      imageUrl: 'https://images.unsplash.com/photo-1584100936595-c0654b55a2e2?w=600&auto=format&fit=crop&q=80',
      primaryText: 'Adeus dores nas costas ao acordar! Conheça o travesseiro anatômico de espuma de memória ortopédica que alinha sua coluna durante a noite inteira.\n\nOferta relâmpago de Compre 1 Leve 2 somente hoje!',
      title: 'Travesseiro Cervical Ergonômico - Sono Profundo',
      description: 'Envio imediato com código de rastreio e garantia total de satisfação.',
      destinationUrl: 'https://casaconforto.myshopify.com/products/travesseiro-cervical',
      snapshotUrl: 'https://www.facebook.com/ads/library/?id=564738291029384',
      platforms: ['facebook', 'instagram']
    },
    {
      id: '453627189201928',
      pageId: '409182736451',
      pageName: 'Método Renda com IA',
      startDate: daysAgo(14),
      stopDate: null,
      daysRunning: 14,
      isActive: true,
      imageUrl: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=600&auto=format&fit=crop&q=80',
      primaryText: 'Como faturar de 3 a 5 mil reais por mês criando pequenas automações de inteligência artificial para comércios locais da sua cidade, trabalhando só 2 horas por dia do seu computador.',
      title: 'Treinamento Prático: Agência de IA para Iniciantes',
      description: 'Inscrições abertas com 70% de desconto no plano vitalício.',
      destinationUrl: 'https://metodorendaia.hotmart.host/turma-oficial',
      snapshotUrl: 'https://www.facebook.com/ads/library/?id=453627189201928',
      platforms: ['instagram']
    },
    {
      id: '342516789012345',
      pageId: '501928374615',
      pageName: 'Bella Pele Cosméticos',
      startDate: daysAgo(11),
      stopDate: null,
      daysRunning: 11,
      isActive: true,
      imageUrl: 'https://images.unsplash.com/photo-1556228720-195a672e8a03?w=600&auto=format&fit=crop&q=80',
      primaryText: 'Sérum Rejuvenescedor com Ácido Hialurônico e Niacinamida Pura. Reduz linhas de expressão e uniformiza o tom da pele em até 14 dias.\n\nFrete grátis para todo o Brasil.',
      title: 'Kit Tratamento Antissinais Noturno',
      description: 'Dermatologicamente testado. Compre agora com desconto exclusivo.',
      destinationUrl: 'https://bellapele.com.br/checkout/serum-hialuronico',
      snapshotUrl: 'https://www.facebook.com/ads/library/?id=342516789012345',
      platforms: ['facebook', 'instagram']
    },
    {
      id: '231405968712390',
      pageId: '601928475819',
      pageName: 'Teste Criativo Rápido',
      startDate: daysAgo(2),
      stopDate: null,
      daysRunning: 2,
      isActive: true,
      imageUrl: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=600&auto=format&fit=crop&q=80',
      primaryText: 'Teste de copy número 3 com gancho em vídeo curto para drop nacional.',
      title: 'Produto Teste',
      description: 'Em fase de validação inicial.',
      destinationUrl: 'https://lojadedrop.cartpanda.com/item-teste',
      snapshotUrl: 'https://www.facebook.com/ads/library/?id=231405968712390',
      platforms: ['facebook']
    }
  ];

  state.currentRawAds = demoAds;
  applyFiltersAndRender();
  showToast('Dados de Demonstração carregados! Teste os filtros de dias e links.', 'success');
}
