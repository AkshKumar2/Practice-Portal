// ==========================================================================
// Aksh Kumar's Practice Portal - Section-Based Logic & Parallax Controller
// ==========================================================================

// ==========================================================================
// Supabase Cloud Storage
// ==========================================================================
// 1. Create a Supabase project.
// 2. Put your Project URL and anon key in supabase-config.js.
// 3. Run supabase.sql in the Supabase SQL Editor.
// ==========================================================================

let supabaseClient = null;
let currentUser = null;

function getSupabase() {
  if (!supabaseClient) {
    if (!window.supabase || !window.SUPABASE_CONFIG ||
        !window.SUPABASE_CONFIG.url || !window.SUPABASE_CONFIG.anonKey ||
        window.SUPABASE_CONFIG.url.includes('YOUR_')) {
      throw new Error('Supabase is not configured. Fill in supabase-config.js first.');
    }
    supabaseClient = window.supabase.createClient(
      window.SUPABASE_CONFIG.url,
      window.SUPABASE_CONFIG.anonKey
    );
  }
  return supabaseClient;
}

const AppState = {
  currentTab: 'dashboard',
  cse202Solved: new Set(),
  cse205Solved: new Set(),
  dsaFilter: {
    unit: 'All',
    status: 'all',
    search: ''
  },
  cppFilter: {
    week: 'All',
    platform: 'All',
    status: 'all',
    search: ''
  }
};

const STORAGE_KEYS = {
  CSE202: 'aksh_tracker_cse202_v2',
  CSE205: 'aksh_tracker_cse205_v2'
};

document.addEventListener('DOMContentLoaded', async () => {
  initParallax();
  setupNavigation();
  setupQuickAdjusters();
  setupFilters();
  setupModal();
  setupAuth();
  renderAll();

  window.addEventListener('hashchange', handleHashChange);
  if (window.location.hash) handleHashChange();

  await initializeCloudSync();
});

// Parallax Controller
function initParallax() {
  let reqId = null;
  let targetX = 0;
  let targetY = 0;
  let currentX = 0;
  let currentY = 0;

  window.addEventListener('pointermove', (e) => {
    targetX = (e.clientX / window.innerWidth - 0.5) * 2;
    targetY = (e.clientY / window.innerHeight - 0.5) * 2;

    if (!reqId) {
      reqId = requestAnimationFrame(updateParallax);
    }
  });

  function updateParallax() {
    currentX += (targetX - currentX) * 0.08;
    currentY += (targetY - currentY) * 0.08;

    document.documentElement.style.setProperty('--mouse-x', currentX.toFixed(4));
    document.documentElement.style.setProperty('--mouse-y', currentY.toFixed(4));

    if (Math.abs(targetX - currentX) > 0.001 || Math.abs(targetY - currentY) > 0.001) {
      reqId = requestAnimationFrame(updateParallax);
    } else {
      reqId = null;
    }
  }
}

// Cloud Storage
// ==========================================================================
function readLocalBackup() {
  try {
    const raw202 = localStorage.getItem(STORAGE_KEYS.CSE202) || localStorage.getItem('aksh_study_tracker_cse202_v1');
    const raw205 = localStorage.getItem(STORAGE_KEYS.CSE205) || localStorage.getItem('aksh_study_tracker_cse205_v1');
    return {
      cse202: raw202 ? new Set(JSON.parse(raw202)) : new Set(),
      cse205: raw205 ? new Set(JSON.parse(raw205)) : new Set()
    };
  } catch (e) {
    console.error('Error reading local backup:', e);
    return { cse202: new Set(), cse205: new Set() };
  }
}

function saveLocalBackup() {
  try {
    localStorage.setItem(STORAGE_KEYS.CSE202, JSON.stringify(Array.from(AppState.cse202Solved)));
    localStorage.setItem(STORAGE_KEYS.CSE205, JSON.stringify(Array.from(AppState.cse205Solved)));
  } catch (e) {
    console.error('Error saving local backup:', e);
  }
}

async function initializeCloudSync() {
  try {
    const supabase = getSupabase();
    const { data: { session } } = await supabase.auth.getSession();
    await handleAuthSession(session);
    supabase.auth.onAuthStateChange(async (event, newSession) => {
      await handleAuthSession(newSession, event);
    });
  } catch (e) {
    console.error(e);
    setAuthStatus(e.message, true);
    updateAuthUI(null);
  }
}

async function handleAuthSession(session, authEvent = null) {
  currentUser = session?.user || null;
  updateAuthUI(currentUser);

  if (authEvent === 'PASSWORD_RECOVERY') {
    document.body.classList.remove('auth-locked');
    document.getElementById('auth-modal')?.classList.remove('active');
    document.getElementById('reset-modal')?.classList.add('active');
    return;
  }

  const authModal = document.getElementById('auth-modal');
  document.body.classList.toggle('auth-locked', !currentUser);

  if (currentUser) {
    authModal?.classList.remove('active');
    await loadCloudState();
  } else {
    AppState.cse202Solved.clear();
    AppState.cse205Solved.clear();
    renderAll();
    authModal?.classList.add('active');
  }
}

async function loadCloudState() {
  const supabase = getSupabase();
  const { data, error } = await supabase
    .from('progress')
    .select('problem_id, subject, completed')
    .eq('user_id', currentUser.id);

  if (error) throw error;

  if (data.length === 0) {
    const local = readLocalBackup();
    if (local.cse202.size || local.cse205.size) {
      AppState.cse202Solved = local.cse202;
      AppState.cse205Solved = local.cse205;
      await uploadAllProgress();
      setAuthStatus('Your existing browser progress was migrated to the cloud.');
      renderAll();
      return;
    }
  }

  AppState.cse202Solved = new Set();
  AppState.cse205Solved = new Set();
  data.forEach(row => {
    if (!row.completed) return;
    if (row.subject === 'cse202') AppState.cse202Solved.add(row.problem_id);
    if (row.subject === 'cse205') AppState.cse205Solved.add(row.problem_id);
  });
  saveLocalBackup();
  renderAll();
}

async function setCloudProblem(subject, id, isDone) {
  if (!currentUser) {
    alert('Please log in first so your progress can be saved.');
    return false;
  }

  const supabase = getSupabase();
  if (isDone) {
    const { error } = await supabase.from('progress').upsert({
      user_id: currentUser.id,
      problem_id: id,
      subject,
      completed: true,
      updated_at: new Date().toISOString()
    }, { onConflict: 'user_id,problem_id' });
    if (error) throw error;
  } else {
    const { error } = await supabase
      .from('progress')
      .delete()
      .eq('user_id', currentUser.id)
      .eq('problem_id', id);
    if (error) throw error;
  }
  return true;
}

async function uploadAllProgress() {
  if (!currentUser) return;
  const rows = [
    ...Array.from(AppState.cse202Solved).map(id => ({ user_id: currentUser.id, problem_id: id, subject: 'cse202', completed: true })),
    ...Array.from(AppState.cse205Solved).map(id => ({ user_id: currentUser.id, problem_id: id, subject: 'cse205', completed: true }))
  ];
  if (!rows.length) return;
  const { error } = await getSupabase().from('progress').upsert(rows, { onConflict: 'user_id,problem_id' });
  if (error) throw error;
  saveLocalBackup();
}

// Navigation
function setupNavigation() {
  document.querySelectorAll('.js-tab-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      const tab = btn.getAttribute('data-tab');
      switchTab(tab);
    });
  });
}

function handleHashChange() {
  const hash = window.location.hash.replace('#', '');
  if (['dashboard', 'cse202', 'cse205'].includes(hash)) {
    switchTab(hash, false);
  }
}

function switchTab(tabId, updateHash = true) {
  AppState.currentTab = tabId;

  document.querySelectorAll('.js-tab-btn').forEach(btn => {
    btn.classList.toggle('active', btn.getAttribute('data-tab') === tabId);
  });

  document.querySelectorAll('.page-view').forEach(view => {
    view.classList.toggle('active', view.id === `view-${tabId}`);
  });

  if (updateHash) {
    window.location.hash = tabId;
  }

  window.scrollTo({ top: 0, behavior: 'smooth' });
  renderAll();
}

// Progress Calculations
function getProgressStats() {
  const cse202Total = CSE202_PROBLEMS.length; // 104
  const cse202Done = AppState.cse202Solved.size;
  const cse202Pct = Math.round((cse202Done / cse202Total) * 100);

  const cse205Total = CSE205_PROBLEMS.length; // 100
  const cse205Done = AppState.cse205Solved.size;
  const cse205Pct = Math.round((cse205Done / cse205Total) * 100);

  const totalOverall = cse202Total + cse205Total; // 204
  const doneOverall = cse202Done + cse205Done;
  const overallPct = Math.round((doneOverall / totalOverall) * 100);

  return {
    cse202: { total: cse202Total, done: cse202Done, pct: cse202Pct },
    cse205: { total: cse205Total, done: cse205Done, pct: cse205Pct },
    overall: { total: totalOverall, done: doneOverall, pct: overallPct }
  };
}

function renderAll() {
  const stats = getProgressStats();
  renderDashboard(stats);
  renderCse205Sections(stats);
  renderCse202Sections(stats);
}

// Dashboard Render
function renderDashboard(stats) {
  const overallDoneEl = document.getElementById('dash-overall-done');
  const overallPctEl = document.getElementById('dash-overall-pct');
  const overallCircle = document.getElementById('dash-circle-fg');
  const navBadge = document.getElementById('header-nav-stats');

  if (overallDoneEl) overallDoneEl.textContent = `${stats.overall.done} / ${stats.overall.total}`;
  if (overallPctEl) overallPctEl.textContent = `${stats.overall.pct}%`;
  if (navBadge) navBadge.textContent = `${stats.overall.pct}%`;

  if (overallCircle) {
    const circumference = 2 * Math.PI * 27; // r=27
    const offset = circumference - (stats.overall.pct / 100) * circumference;
    overallCircle.style.strokeDasharray = `${circumference}`;
    overallCircle.style.strokeDashoffset = `${offset}`;
  }

  // C++ (CSE202) Card
  const cse202PctEl = document.getElementById('dash-cse202-pct');
  const cse202CountEl = document.getElementById('dash-cse202-count');
  const cse202Bar = document.getElementById('dash-cse202-bar');

  if (cse202PctEl) cse202PctEl.textContent = `${stats.cse202.pct}%`;
  if (cse202CountEl) cse202CountEl.textContent = `${stats.cse202.done} / ${stats.cse202.total}`;
  if (cse202Bar) cse202Bar.style.width = `${stats.cse202.pct}%`;

  // DSA (CSE205) Card
  const cse205PctEl = document.getElementById('dash-cse205-pct');
  const cse205CountEl = document.getElementById('dash-cse205-count');
  const cse205Bar = document.getElementById('dash-cse205-bar');

  if (cse205PctEl) cse205PctEl.textContent = `${stats.cse205.pct}%`;
  if (cse205CountEl) cse205CountEl.textContent = `${stats.cse205.done} / ${stats.cse205.total}`;
  if (cse205Bar) cse205Bar.style.width = `${stats.cse205.pct}%`;

  // Sync Sliders
  const slider202 = document.getElementById('quick-slider-cse202');
  const input202 = document.getElementById('quick-input-cse202');
  const badge202 = document.getElementById('quick-badge-cse202');

  if (slider202 && input202 && badge202) {
    slider202.value = stats.cse202.done;
    input202.value = stats.cse202.done;
    badge202.textContent = `${stats.cse202.pct}% (${stats.cse202.done}/104)`;
  }

  const slider205 = document.getElementById('quick-slider-cse205');
  const input205 = document.getElementById('quick-input-cse205');
  const badge205 = document.getElementById('quick-badge-cse205');

  if (slider205 && input205 && badge205) {
    slider205.value = stats.cse205.done;
    input205.value = stats.cse205.done;
    badge205.textContent = `${stats.cse205.pct}% (${stats.cse205.done}/100)`;
  }
}

// Quick Adjuster Inputs
function setupQuickAdjusters() {
  const slider202 = document.getElementById('quick-slider-cse202');
  const input202 = document.getElementById('quick-input-cse202');
  const badge202 = document.getElementById('quick-badge-cse202');

  const slider205 = document.getElementById('quick-slider-cse205');
  const input205 = document.getElementById('quick-input-cse205');
  const badge205 = document.getElementById('quick-badge-cse205');

  if (slider202 && input202 && badge202) {
    slider202.addEventListener('input', (e) => {
      const count = parseInt(e.target.value, 10) || 0;
      input202.value = count;
      const pct = Math.round((count / 104) * 100);
      badge202.textContent = `${pct}% (${count}/104)`;
    });
    slider202.addEventListener('change', (e) => {
      setBulkCount('cse202', parseInt(e.target.value, 10));
    });

    input202.addEventListener('change', (e) => {
      let val = Math.max(0, Math.min(104, parseInt(e.target.value, 10) || 0));
      input202.value = val;
      slider202.value = val;
      setBulkCount('cse202', val);
    });
  }

  if (slider205 && input205 && badge205) {
    slider205.addEventListener('input', (e) => {
      const count = parseInt(e.target.value, 10) || 0;
      input205.value = count;
      const pct = Math.round((count / 100) * 100);
      badge205.textContent = `${pct}% (${count}/100)`;
    });
    slider205.addEventListener('change', (e) => {
      setBulkCount('cse205', parseInt(e.target.value, 10));
    });

    input205.addEventListener('change', (e) => {
      let val = Math.max(0, Math.min(100, parseInt(e.target.value, 10) || 0));
      input205.value = val;
      slider205.value = val;
      setBulkCount('cse205', val);
    });
  }

  document.querySelectorAll('.js-quick-preset').forEach(btn => {
    btn.addEventListener('click', () => {
      const subject = btn.getAttribute('data-subject');
      const pct = parseFloat(btn.getAttribute('data-pct'));
      const total = subject === 'cse202' ? 104 : 100;
      const count = Math.round((pct / 100) * total);
      setBulkCount(subject, count);
    });
  });
}

async function setBulkCount(subject, count) {
  if (subject === 'cse202') {
    AppState.cse202Solved.clear();
    for (let i = 0; i < Math.min(count, CSE202_PROBLEMS.length); i++) {
      AppState.cse202Solved.add(CSE202_PROBLEMS[i].id);
    }
  } else if (subject === 'cse205') {
    AppState.cse205Solved.clear();
    for (let i = 0; i < Math.min(count, CSE205_PROBLEMS.length); i++) {
      AppState.cse205Solved.add(CSE205_PROBLEMS[i].id);
    }
  }
  saveLocalBackup();
  renderAll();

  if (currentUser) {
    try {
      await replaceCloudProgress();
    } catch (e) {
      console.error('Cloud bulk save failed:', e);
      alert('Could not save this progress to the cloud. Your browser backup is still safe.');
    }
  }
}

async function replaceCloudProgress() {
  if (!currentUser) return;
  const supabase = getSupabase();

  // Replace this user's cloud state so bulk controls and imports also remove
  // questions that are no longer marked complete.
  const { error: deleteError } = await supabase
    .from('progress')
    .delete()
    .eq('user_id', currentUser.id);
  if (deleteError) throw deleteError;

  const rows = [
    ...Array.from(AppState.cse202Solved).map(id => ({
      user_id: currentUser.id, problem_id: id, subject: 'cse202', completed: true
    })),
    ...Array.from(AppState.cse205Solved).map(id => ({
      user_id: currentUser.id, problem_id: id, subject: 'cse205', completed: true
    }))
  ];

  if (!rows.length) return;

  const { error: insertError } = await supabase
    .from('progress')
    .insert(rows);
  if (insertError) throw insertError;
}

// ==========================================================================
// CSE205 (DSA) Section-by-Section Render (Units I to VI)
// ==========================================================================
function renderCse205Sections(stats) {
  const container = document.getElementById('dsa-sections-container');
  if (!container) return;

  const headerPct = document.getElementById('dsa-banner-pct');
  const headerCount = document.getElementById('dsa-banner-count');
  if (headerPct) headerPct.textContent = `${stats.cse205.pct}%`;
  if (headerCount) headerCount.textContent = `${stats.cse205.done} of 100 Solved`;

  const query = AppState.dsaFilter.search.toLowerCase().trim();
  const unitFilter = AppState.dsaFilter.unit;
  const statusFilter = AppState.dsaFilter.status;

  container.innerHTML = '';
  let renderedUnitsCount = 0;

  CSE205_UNIT_SUMMARY.forEach(u => {
    if (unitFilter !== 'All' && u.unit !== unitFilter) {
      return;
    }

    const unitProblems = CSE205_PROBLEMS.filter(p => p.unit === u.unit);
    const filteredProblems = unitProblems.filter(p => {
      const isDone = AppState.cse205Solved.has(p.id);
      if (statusFilter === 'completed' && !isDone) return false;
      if (statusFilter === 'pending' && isDone) return false;

      if (query) {
        const matchTitle = p.title.toLowerCase().includes(query);
        const matchNum = String(p.number).includes(query);
        const matchTopic = p.topic.toLowerCase().includes(query);
        if (!matchTitle && !matchNum && !matchTopic) return false;
      }
      return true;
    });

    if (unitProblems.length > 0 && filteredProblems.length === 0) {
      return;
    }

    renderedUnitsCount++;

    const unitDoneCount = unitProblems.filter(p => AppState.cse205Solved.has(p.id)).length;
    const unitPct = Math.round((unitDoneCount / u.problems) * 100);

    const sectionEl = document.createElement('div');
    sectionEl.className = 'chapter-section';

    sectionEl.innerHTML = `
      <div class="section-banner">
        <div class="section-banner-left">
          <span class="section-tag-pill tag-unit-color">${escapeHtml(u.unit)}</span>
          <h3 class="section-title">${escapeHtml(u.title)}</h3>
          <span class="section-subtitle">(${u.problems} Questions)</span>
        </div>
        <div class="section-banner-right">
          <span class="section-stats-badge">${unitDoneCount} / ${u.problems} Done (${unitPct}%)</span>
          <div class="section-track-wrap">
            <div class="section-fill-bar fill-emerald-sub" style="width: ${unitPct}%;"></div>
          </div>
        </div>
      </div>
      <div class="section-body">
        <div class="section-cards-grid"></div>
      </div>
    `;

    const grid = sectionEl.querySelector('.section-cards-grid');

    filteredProblems.forEach(p => {
      const isDone = AppState.cse205Solved.has(p.id);
      const card = document.createElement('div');
      card.className = `q-card ${isDone ? 'done' : ''}`;

      card.innerHTML = `
        <div class="q-card-header">
          <span class="q-meta-tag">${escapeHtml(p.tag)}</span>
          <label class="q-status-toggle">
            <input type="checkbox" class="q-checkbox" data-id="${p.id}" ${isDone ? 'checked' : ''}>
            <span class="q-status-label">${isDone ? 'Done' : 'To Do'}</span>
          </label>
        </div>
        <h4 class="q-title">${escapeHtml(p.title)}</h4>
        <div class="q-card-footer">
          <span class="q-topic-tag">${escapeHtml(p.topic)}</span>
          <a href="${p.url}" target="_blank" rel="noopener noreferrer" class="btn-solve-link">
            Solve &nearr;
          </a>
        </div>
      `;

      const chk = card.querySelector('.q-checkbox');
      chk.addEventListener('change', (e) => {
        toggleProblem('cse205', p.id, e.target.checked);
      });

      grid.appendChild(card);
    });

    container.appendChild(sectionEl);
  });

  if (renderedUnitsCount === 0) {
    container.innerHTML = `
      <div class="chapter-section" style="padding: 3rem; text-align: center; color: var(--text-dim);">
        No DSA questions found matching current filters.
      </div>
    `;
  }
}

// ==========================================================================
// CSE202 (C++) Section-by-Section Render (Weeks 1 to 15)
// ==========================================================================
function renderCse202Sections(stats) {
  const container = document.getElementById('cpp-sections-container');
  if (!container) return;

  const headerPct = document.getElementById('cpp-banner-pct');
  const headerCount = document.getElementById('cpp-banner-count');
  if (headerPct) headerPct.textContent = `${stats.cse202.pct}%`;
  if (headerCount) headerCount.textContent = `${stats.cse202.done} of 104 Solved`;

  const query = AppState.cppFilter.search.toLowerCase().trim();
  const weekFilter = AppState.cppFilter.week;
  const platformFilter = AppState.cppFilter.platform;
  const statusFilter = AppState.cppFilter.status;

  container.innerHTML = '';
  let renderedWeeksCount = 0;

  CSE202_WEEKS.forEach(w => {
    if (weekFilter !== 'All' && String(w.week) !== String(weekFilter)) {
      return;
    }

    if (w.problems.length === 0) {
      return; // Skip empty revision weeks without questions
    }

    const filteredProblems = w.problems.filter(p => {
      const isDone = AppState.cse202Solved.has(p.id);
      if (platformFilter !== 'All' && p.platform !== platformFilter) return false;
      if (statusFilter === 'completed' && !isDone) return false;
      if (statusFilter === 'pending' && isDone) return false;

      if (query) {
        const matchTitle = p.title.toLowerCase().includes(query);
        const matchCode = p.number.toLowerCase().includes(query);
        const matchTopic = p.topic.toLowerCase().includes(query);
        const matchPlatform = p.platform.toLowerCase().includes(query);
        if (!matchTitle && !matchCode && !matchTopic && !matchPlatform) return false;
      }
      return true;
    });

    if (filteredProblems.length === 0) {
      return;
    }

    renderedWeeksCount++;

    const weekDoneCount = w.problems.filter(p => AppState.cse202Solved.has(p.id)).length;
    const weekPct = Math.round((weekDoneCount / w.problems.length) * 100);

    const sectionEl = document.createElement('div');
    sectionEl.className = 'chapter-section';

    sectionEl.innerHTML = `
      <div class="section-banner">
        <div class="section-banner-left">
          <span class="section-tag-pill tag-week-color">WEEK ${w.week}</span>
          <h3 class="section-title">${escapeHtml(w.title)}</h3>
          <span class="section-subtitle">(Lectures ${escapeHtml(w.lectures)} | ${w.problems.length} Questions)</span>
        </div>
        <div class="section-banner-right">
          <span class="section-stats-badge">${weekDoneCount} / ${w.problems.length} Done (${weekPct}%)</span>
          <div class="section-track-wrap">
            <div class="section-fill-bar fill-indigo-sub" style="width: ${weekPct}%;"></div>
          </div>
        </div>
      </div>
      <div class="section-body">
        <div class="section-cards-grid"></div>
      </div>
    `;

    const grid = sectionEl.querySelector('.section-cards-grid');

    filteredProblems.forEach(p => {
      const isDone = AppState.cse202Solved.has(p.id);
      const card = document.createElement('div');
      card.className = `q-card ${isDone ? 'done' : ''}`;

      card.innerHTML = `
        <div class="q-card-header">
          <span class="q-meta-tag" style="color: var(--accent-indigo);">${escapeHtml(p.tag)}</span>
          <label class="q-status-toggle">
            <input type="checkbox" class="q-checkbox" data-id="${p.id}" ${isDone ? 'checked' : ''}>
            <span class="q-status-label">${isDone ? 'Done' : 'To Do'}</span>
          </label>
        </div>
        <h4 class="q-title">${escapeHtml(p.title)}</h4>
        <div class="q-card-footer">
          <span class="q-topic-tag">${escapeHtml(p.topic)}</span>
          <a href="${p.url}" target="_blank" rel="noopener noreferrer" class="btn-solve-link">
            Solve &nearr;
          </a>
        </div>
      `;

      const chk = card.querySelector('.q-checkbox');
      chk.addEventListener('change', (e) => {
        toggleProblem('cse202', p.id, e.target.checked);
      });

      grid.appendChild(card);
    });

    container.appendChild(sectionEl);
  });

  if (renderedWeeksCount === 0) {
    container.innerHTML = `
      <div class="chapter-section" style="padding: 3rem; text-align: center; color: var(--text-dim);">
        No C++ questions found matching current filters.
      </div>
    `;
  }
}

// Toggle individual problem
async function toggleProblem(subject, id, isDone) {
  if (subject === 'cse202') {
    if (isDone) AppState.cse202Solved.add(id);
    else AppState.cse202Solved.delete(id);
  } else if (subject === 'cse205') {
    if (isDone) AppState.cse205Solved.add(id);
    else AppState.cse205Solved.delete(id);
  }

  saveLocalBackup();
  renderAll();
  try {
    await setCloudProblem(subject, id, isDone);
  } catch (e) {
    console.error('Cloud save failed:', e);
    alert('Could not save to the cloud. Your browser backup is still safe.');
  }
}

// Filter listeners
function setupFilters() {
  const dsaSearch = document.getElementById('dsa-search-input');
  if (dsaSearch) {
    dsaSearch.addEventListener('input', (e) => {
      AppState.dsaFilter.search = e.target.value;
      renderCse205Sections(getProgressStats());
    });
  }

  const dsaStatus = document.getElementById('dsa-status-select');
  if (dsaStatus) {
    dsaStatus.addEventListener('change', (e) => {
      AppState.dsaFilter.status = e.target.value;
      renderCse205Sections(getProgressStats());
    });
  }

  document.querySelectorAll('.js-dsa-unit-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.js-dsa-unit-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      AppState.dsaFilter.unit = btn.getAttribute('data-unit');
      renderCse205Sections(getProgressStats());
    });
  });

  const cppSearch = document.getElementById('cpp-search-input');
  if (cppSearch) {
    cppSearch.addEventListener('input', (e) => {
      AppState.cppFilter.search = e.target.value;
      renderCse202Sections(getProgressStats());
    });
  }

  const cppWeek = document.getElementById('cpp-week-select');
  if (cppWeek) {
    cppWeek.addEventListener('change', (e) => {
      AppState.cppFilter.week = e.target.value;
      renderCse202Sections(getProgressStats());
    });
  }

  const cppPlatform = document.getElementById('cpp-platform-select');
  if (cppPlatform) {
    cppPlatform.addEventListener('change', (e) => {
      AppState.cppFilter.platform = e.target.value;
      renderCse202Sections(getProgressStats());
    });
  }

  const cppStatus = document.getElementById('cpp-status-select');
  if (cppStatus) {
    cppStatus.addEventListener('change', (e) => {
      AppState.cppFilter.status = e.target.value;
      renderCse202Sections(getProgressStats());
    });
  }
}

// Modal & Backup
function setupModal() {
  const modal = document.getElementById('app-modal');
  const cancelBtn = document.getElementById('modal-cancel-btn');

  function closeModal() {
    if (modal) modal.classList.remove('active');
  }

  if (cancelBtn) cancelBtn.addEventListener('click', closeModal);
  if (modal) {
    modal.addEventListener('click', (e) => {
      if (e.target === modal) closeModal();
    });
  }

  const resetBtn = document.getElementById('btn-reset-progress');
  if (resetBtn) {
    resetBtn.addEventListener('click', () => {
      showConfirmModal(
        'Reset All Progress',
        'Reset all tracked problem completion for CSE202 and CSE205?',
        () => {
          AppState.cse202Solved.clear();
          AppState.cse205Solved.clear();
          saveLocalBackup();
          if (currentUser) {
            getSupabase().from('progress').delete().eq('user_id', currentUser.id).then(({ error }) => {
              if (error) alert('Cloud reset failed: ' + error.message);
            });
          }
          renderAll();
          closeModal();
        }
      );
    });
  }

  const exportBtn = document.getElementById('btn-export-progress');
  if (exportBtn) {
    exportBtn.addEventListener('click', () => {
      const data = {
        user: currentUser?.email || USER_PROFILE.name,
        exportedAt: new Date().toISOString(),
        cse202: Array.from(AppState.cse202Solved),
        cse205: Array.from(AppState.cse205Solved)
      };
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `aksh_progress_${new Date().toISOString().slice(0,10)}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    });
  }

  const importInput = document.getElementById('import-progress-file');
  if (importInput) {
    importInput.addEventListener('change', (e) => {
      const file = e.target.files[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = (event) => {
        try {
          const data = JSON.parse(event.target.result);
          if (Array.isArray(data.cse202)) AppState.cse202Solved = new Set(data.cse202);
          if (Array.isArray(data.cse205)) AppState.cse205Solved = new Set(data.cse205);
          saveLocalBackup();
          if (currentUser) {
            replaceCloudProgress().catch(err => alert('Cloud import failed: ' + err.message));
          }
          renderAll();
        } catch (err) {
          alert('Invalid backup file.');
        }
      };
      reader.readAsText(file);
    });
  }
}

function setupAuth() {
  const loginBtn = document.getElementById('btn-auth');
  const logoutBtn = document.getElementById('btn-logout');
  const form = document.getElementById('auth-form');
  const closeBtn = document.getElementById('auth-close');
  const authModal = document.getElementById('auth-modal');
  const switchBtn = document.getElementById('auth-switch');
  const googleBtn = document.getElementById('google-auth-btn');
  const nameInput = document.getElementById('auth-name');
  const title = document.getElementById('auth-title');
  const subtitle = document.getElementById('auth-subtitle');
  const submitBtn = form?.querySelector('button[type="submit"]');
  let signupMode = false;

  const open = () => authModal?.classList.add('active');
  const close = () => {
    if (!currentUser) return;
    authModal?.classList.remove('active');
  };

  const updateMode = () => {
    if (title) title.textContent = signupMode ? 'Create your account' : 'Welcome back';
    if (subtitle) subtitle.textContent = signupMode ? 'Create an account to keep your progress synced everywhere.' : 'Sign in to save your progress across devices.';
    if (nameInput) nameInput.style.display = signupMode ? 'block' : 'none';
    if (nameInput) nameInput.required = signupMode;
    if (submitBtn) submitBtn.textContent = signupMode ? 'Create account' : 'Sign in';
    if (switchBtn) switchBtn.textContent = signupMode ? 'Already have an account? Sign in' : 'Create a new account';
    setAuthStatus('');
  };

  loginBtn?.addEventListener('click', () => { signupMode = false; updateMode(); open(); });
  closeBtn?.addEventListener('click', close);
  authModal?.addEventListener('click', e => { if (e.target === authModal && currentUser) close(); });
  switchBtn?.addEventListener('click', () => { signupMode = !signupMode; updateMode(); });

  googleBtn?.addEventListener('click', async () => {
    try {
      setAuthStatus('Connecting to Google...');
      const redirectTo = `${window.location.origin}${window.location.pathname}`;
      const { error } = await getSupabase().auth.signInWithOAuth({
        provider: 'google',
        options: { redirectTo }
      });
      if (error) throw error;
    } catch (err) {
      setAuthStatus(err.message, true);
    }
  });

  form?.addEventListener('submit', async e => {
    e.preventDefault();
    const name = nameInput?.value.trim() || '';
    const email = document.getElementById('auth-email').value.trim();
    const password = document.getElementById('auth-password').value;
    if (signupMode && !name) {
      setAuthStatus('Please enter your name.', true);
      return;
    }
    setAuthStatus(signupMode ? 'Creating account...' : 'Signing in...');
    try {
      const supabase = getSupabase();
      if (signupMode) {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: { data: { name } }
        });
        if (error) throw error;
        setAuthStatus(data.session ? 'Account created.' : 'Account created. Check your email to confirm it.');
        if (data.session) close();
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        close();
      }
    } catch (err) {
      setAuthStatus(err.message, true);
    }
  });

  const forgotBtn = document.getElementById('auth-forgot');
  forgotBtn?.addEventListener('click', async () => {
    const email = document.getElementById('auth-email')?.value.trim();
    if (!email) {
      setAuthStatus('Enter your email first, then click Forgot password.', true);
      document.getElementById('auth-email')?.focus();
      return;
    }
    try {
      setAuthStatus('Sending password reset email...');
      const redirectTo = `${window.location.origin}${window.location.pathname}`;
      const { error } = await getSupabase().auth.resetPasswordForEmail(email, { redirectTo });
      if (error) throw error;
      setAuthStatus('Reset email sent. Check your inbox.');
    } catch (err) {
      setAuthStatus(err.message, true);
    }
  });

  document.getElementById('reset-form')?.addEventListener('submit', async e => {
    e.preventDefault();
    const password = document.getElementById('reset-password').value;
    const confirm = document.getElementById('reset-password-confirm').value;
    const status = document.getElementById('reset-status');
    if (password !== confirm) {
      if (status) { status.textContent = 'Passwords do not match.'; status.style.color = 'var(--accent-rose)'; }
      return;
    }
    try {
      if (status) { status.textContent = 'Updating password...'; status.style.color = 'var(--text-muted)'; }
      const { error } = await getSupabase().auth.updateUser({ password });
      if (error) throw error;
      if (status) { status.textContent = 'Password updated successfully.'; status.style.color = 'var(--text-muted)'; }
      setTimeout(() => document.getElementById('reset-modal')?.classList.remove('active'), 900);
    } catch (err) {
      if (status) { status.textContent = err.message; status.style.color = 'var(--accent-rose)'; }
    }
  });

  logoutBtn?.addEventListener('click', async () => {
    try { await getSupabase().auth.signOut(); } catch (err) { setAuthStatus(err.message, true); }
  });

  updateMode();
}

function setAuthStatus(message, isError = false) {
  const el = document.getElementById('auth-status');
  if (el) { el.textContent = message || ''; el.style.color = isError ? 'var(--accent-rose)' : 'var(--text-muted)'; }
}

function getUserDisplayName(user) {
  const name = user?.user_metadata?.name?.trim();
  return name || (user ? user.email : USER_PROFILE.name);
}

function getInitials(name) {
  const words = String(name || '').trim().split(/\s+/).filter(Boolean);
  if (!words.length) return 'AK';
  if (words.length === 1) return words[0].slice(0, 2).toUpperCase();
  return (words[0][0] + words[words.length - 1][0]).toUpperCase();
}

function updateAuthUI(user) {
  const loginBtn = document.getElementById('btn-auth');
  const logoutBtn = document.getElementById('btn-logout');
  const nameEl = document.querySelector('.user-name');
  const headerAvatar = document.querySelector('.avatar-initials');
  const logoBadge = document.querySelector('.logo-badge');
  const greetingEl = document.querySelector('#view-dashboard .dash-hero-left h2');

  if (loginBtn) loginBtn.style.display = user ? 'none' : 'inline-flex';
  if (logoutBtn) logoutBtn.style.display = user ? 'inline-flex' : 'none';

  const name = getUserDisplayName(user);
  const initials = getInitials(name);

  if (nameEl) nameEl.textContent = name;
  if (headerAvatar) headerAvatar.textContent = initials;
  if (logoBadge) logoBadge.textContent = initials;
  if (greetingEl) greetingEl.textContent = `Hello, ${name}`;
}

function showConfirmModal(title, text, onConfirm) {
  const modal = document.getElementById('app-modal');
  const titleEl = document.getElementById('modal-title');
  const textEl = document.getElementById('modal-text');
  const confirmBtn = document.getElementById('modal-confirm-btn');

  if (titleEl) titleEl.textContent = title;
  if (textEl) textEl.textContent = text;
  if (confirmBtn) confirmBtn.onclick = onConfirm;
  if (modal) modal.classList.add('active');
}

function escapeHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}
