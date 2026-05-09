const API = 'https://nutrition-tracker-zorw.onrender.com/api';
let currentUser = null;
let currentSession = null;
let dailyTargets = { calories: 2000, protein: 150, carbs: 200, fats: 65 };

// ─── MODAL CONTROLS ───────────────────────────────
function showModal(type) {
  document.getElementById(`modal-${type}`).classList.remove('hidden');
}

function hideModal(type) {
  document.getElementById(`modal-${type}`).classList.add('hidden');
}

// ─── REGISTER ─────────────────────────────────────
async function register() {
  const username = document.getElementById('reg-username').value;
  const email    = document.getElementById('reg-email').value;
  const password = document.getElementById('reg-password').value;
  const msg      = document.getElementById('register-msg');

  if (!username || !email || !password) {
    msg.textContent = 'Please fill all fields!';
    msg.className = 'msg error';
    return;
  }

  try {
    const res  = await fetch(`${API}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, email, password }),
    });
    const data = await res.json();
    if (data.error) {
      msg.textContent = data.error;
      msg.className = 'msg error';
    } else {
      msg.textContent = 'Registered! Please check your email to confirm.';
      msg.className = 'msg success';
      setTimeout(() => { hideModal('register'); showModal('login'); }, 2000);
    }
  } catch (err) {
    msg.textContent = 'Server error. Is backend running?';
    msg.className = 'msg error';
  }
}

// ─── LOGIN ────────────────────────────────────────
async function login() {
  const email    = document.getElementById('login-email').value;
  const password = document.getElementById('login-password').value;
  const msg      = document.getElementById('login-msg');

  try {
    const res  = await fetch(`${API}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });
    const data = await res.json();
    if (data.error) {
      msg.textContent = data.error;
      msg.className = 'msg error';
    } else {
      currentUser    = data.user;
      currentSession = data.session;
      localStorage.setItem('user',    JSON.stringify(data.user));
      localStorage.setItem('session', JSON.stringify(data.session));
      hideModal('login');
      window.location.href = '/nutrition-tracker/frontend/dashboard.html';
    }
  } catch (err) {
    msg.textContent = 'Server error. Is backend running?';
    msg.className = 'msg error';
  }
}

// ─── LOGOUT ───────────────────────────────────────
function logout() {
  currentUser    = null;
  currentSession = null;
  localStorage.removeItem('user');
  localStorage.removeItem('session');
  window.location.href = 'index.html'; // redirect instead of DOM manipulation
}

// ─── SHOW DASHBOARD ───────────────────────────────
async function showDashboard() {
  let savedUser;
  try {
    savedUser = localStorage.getItem('user');
    if (!savedUser) return;
    currentUser = JSON.parse(savedUser);
  } catch (e) {
    console.error('Failed to parse saved user:', e);
    return;
  }
  await loadProfile();
  await loadTodayLogs();
  showTab('overview');
}

// ─── TABS ─────────────────────────────────────────
function showTab(tab) {
  document.querySelectorAll('.tab-content').forEach(t => t.classList.remove('active'));
  document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
  document.getElementById(`tab-${tab}`).classList.add('active');
  document.getElementById(`btn-${tab}`).classList.add('active');
}

// ─── LOAD PROFILE ─────────────────────────────────
async function loadProfile() {
  try {
    const res     = await fetch(`${API}/auth/profile/${currentUser.id}`);
    const profile = await res.json();
    if (profile && profile.weight_kg && profile.height_cm) {
      document.getElementById('p-age').value      = profile.age            || '';
      document.getElementById('p-gender').value   = profile.gender         || 'male';
      document.getElementById('p-height').value   = profile.height_cm      || '';
      document.getElementById('p-weight').value   = profile.weight_kg      || '';
      document.getElementById('p-activity').value = profile.activity_level || 'moderate';
      document.getElementById('p-goal').value     = profile.goal           || 'maintain';
    }
  } catch (err) {
    console.log('Profile load error:', err);
  }
}

// ─── SAVE PROFILE ─────────────────────────────────
async function saveProfile() {
  const body = {
    user_id:        currentUser.id,
    age:            parseInt(document.getElementById('p-age').value),
    gender:         document.getElementById('p-gender').value,
    height_cm:      parseFloat(document.getElementById('p-height').value),
    weight_kg:      parseFloat(document.getElementById('p-weight').value),
    activity_level: document.getElementById('p-activity').value,
    goal:           document.getElementById('p-goal').value,
  };

  try {
    await fetch(`${API}/auth/profile`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    document.getElementById('profile-msg').textContent = '✅ Profile saved!';
    setTimeout(() => document.getElementById('profile-msg').textContent = '', 2000);
  } catch (err) {
    console.log(err);
  }
}

// ─── SEARCH FOOD ──────────────────────────────────
async function searchFood() {
  const query   = document.getElementById('food-search-input').value.trim();
  const type    = document.getElementById('search-type').value;
  const results = document.getElementById('search-results');

  if (!query) {
    results.innerHTML = '<p style="color:var(--text-muted);font-size:13px;">Please enter a food name.</p>';
    return;
  }

  results.innerHTML = '<p style="color:var(--text-muted);font-size:13px;">Searching...</p>';

  try {
    const res  = await fetch(`${API}/food/search?q=${encodeURIComponent(query)}&type=${type}`);
    const data = await res.json();

    if (!data.foods || data.foods.length === 0) {
      results.innerHTML = '<p style="color:var(--text-muted);font-size:13px;">No results found.</p>';
      return;
    }

    results.innerHTML = data.foods.map((food, i) => `
      <div class="food-result-item">
        <div>
          <div class="food-name">${food.name || food.food_name}</div>
          <div class="food-macros">
            <span>🔥 ${Math.round(food.calories)} kcal</span>
            <span>💪 ${Math.round(food.protein)}g protein</span>
            <span>🍞 ${Math.round(food.carbs)}g carbs</span>
            <span>🧈 ${Math.round(food.fats)}g fat</span>
          </div>
        </div>
        <div style="display:flex;align-items:center;gap:8px;">
          <input type="number" id="qty-${i}" value="100" min="1" max="2000"
            style="width:70px;background:var(--bg2);border:1px solid var(--card-border);
            color:var(--text);padding:6px 8px;border-radius:6px;font-size:13px;outline:none;"
            placeholder="g"/>
          <button class="btn-primary" style="padding:8px 14px;font-size:13px;"
            onclick="logFood(${JSON.stringify(food).replace(/"/g, '&quot;')}, ${i})">
            + Log
          </button>
        </div>
      </div>
    `).join('');
  } catch (err) {
    results.innerHTML = '<p style="color:var(--danger);font-size:13px;">Error fetching results. Is backend running?</p>';
  }
}

// ─── QUICK SEARCH ─────────────────────────────────
function quickSearch(term) {
  document.getElementById('food-search-input').value = term;
  document.getElementById('search-type').value = 'indian';
  searchFood();
}

// ─── LOG FOOD ─────────────────────────────────────
async function logFood(food, index) {
  const qty = parseFloat(document.getElementById(`qty-${index}`).value) || 100;

  try {
    const res  = await fetch(`${API}/logs/add`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        user_id:        currentUser.id,
        food_name:      food.name || food.food_name,
        quantity_grams: qty,
        calories:       food.calories,
        protein:        food.protein,
        carbs:          food.carbs,
        fats:           food.fats,
        fiber:          food.fiber || 0,
      }),
    });
    const data = await res.json();
    if (data.error) {
      alert('Error logging food: ' + data.error);
    } else {
      alert(`✅ ${food.name || food.food_name} logged successfully!`);
      await loadTodayLogs();
    }
  } catch (err) {
    alert('Server error logging food.');
  }
}

// ─── LOAD TODAY LOGS ──────────────────────────────
async function loadTodayLogs() {
  try {
    const res  = await fetch(`${API}/logs/today/${currentUser.id}`);
    const data = await res.json();
    const { logs, totals } = data;

    // Overview cards
    document.getElementById('total-calories').textContent = Math.round(totals.calories);
    document.getElementById('total-protein').textContent  = Math.round(totals.protein) + 'g';
    document.getElementById('total-carbs').textContent    = Math.round(totals.carbs) + 'g';
    document.getElementById('total-fats').textContent     = Math.round(totals.fats) + 'g';

    // Remaining
    document.getElementById('rem-calories').textContent =
      Math.max(0, Math.round(dailyTargets.calories - totals.calories));
    document.getElementById('rem-protein').textContent  =
      Math.max(0, Math.round(dailyTargets.protein - totals.protein)) + 'g';

    // Progress bars + labels (fixed: labels were never updated before)
    updateProgress('cal-progress',     totals.calories, dailyTargets.calories);
    updateProgress('protein-progress', totals.protein,  dailyTargets.protein);
    updateProgress('carbs-progress',   totals.carbs,    dailyTargets.carbs);
    updateProgress('fats-progress',    totals.fats,     dailyTargets.fats);

    document.getElementById('cal-label').textContent     =
      `${Math.round(totals.calories)} / ${dailyTargets.calories} kcal`;
    document.getElementById('protein-label').textContent =
      `${Math.round(totals.protein)} / ${dailyTargets.protein}g`;
    document.getElementById('carbs-label').textContent   =
      `${Math.round(totals.carbs)} / ${dailyTargets.carbs}g`;
    document.getElementById('fats-label').textContent    =
      `${Math.round(totals.fats)} / ${dailyTargets.fats}g`;

    // Food log table
    const tbody = document.getElementById('log-tbody');
    if (!logs || logs.length === 0) {
      tbody.innerHTML = `<tr><td colspan="7" style="color:var(--text-muted);text-align:center;padding:20px;">
        No food logged today. Search and log your meals above!
      </td></tr>`;
      return;
    }
    tbody.innerHTML = logs.map(log => `
      <tr>
        <td>${log.food_name}</td>
        <td>${log.quantity_grams}g</td>
        <td>${Math.round(log.calories)}</td>
        <td>${Math.round(log.protein)}g</td>
        <td>${Math.round(log.carbs)}g</td>
        <td>${Math.round(log.fats)}g</td>
        <td><button class="btn-danger" onclick="deleteLog('${log.id}')">✕</button></td>
      </tr>
    `).join('');
  } catch (err) {
    console.log('Log load error:', err);
  }
}

// ─── PROGRESS BAR UPDATE ──────────────────────────
function updateProgress(id, current, target) {
  const el  = document.getElementById(id);
  const pct = Math.min((current / target) * 100, 100);
  el.style.width  = pct + '%';
  el.className    = 'progress-fill';
  if (pct > 90)      el.classList.add('danger');
  else if (pct > 70) el.classList.add('warning');
}

// ─── DELETE LOG ───────────────────────────────────
async function deleteLog(id) {
  try {
    await fetch(`${API}/logs/delete/${id}`, { method: 'DELETE' });
    await loadTodayLogs();
  } catch (err) {
    console.log(err);
  }
}

// ─── CALCULATE BMI ────────────────────────────────
async function calculateBMI() {
  const body = {
    user_id:        currentUser.id,
    weight_kg:      parseFloat(document.getElementById('bmi-weight').value),
    height_cm:      parseFloat(document.getElementById('bmi-height').value),
    age:            parseInt(document.getElementById('bmi-age').value),
    gender:         document.getElementById('bmi-gender').value,
    activity_level: document.getElementById('bmi-activity').value,
    goal:           document.getElementById('bmi-goal').value,
  };

  if (!body.weight_kg || !body.height_cm || !body.age) {
    alert('Please fill all fields!');
    return;
  }

  try {
    const res  = await fetch(`${API}/bmi/calculate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    const data = await res.json();

    dailyTargets = {
      calories: data.targetCalories,
      protein:  data.macros.protein_g,
      carbs:    data.macros.carbs_g,
      fats:     data.macros.fats_g,
    };

    document.getElementById('bmi-result').classList.add('active');
    document.getElementById('bmi-score').textContent          = data.bmi;
    document.getElementById('bmi-category').textContent       = data.category;
    document.getElementById('bmi-tdee').textContent           = data.tdee + ' kcal/day';
    document.getElementById('bmi-target').textContent         = data.targetCalories + ' kcal/day';
    document.getElementById('bmi-plan').textContent           = data.dietPlan;
    document.getElementById('bmi-recommendation').textContent = data.recommendation;
    document.getElementById('bmi-protein').textContent        = data.macros.protein_g + 'g';
    document.getElementById('bmi-carbs').textContent          = data.macros.carbs_g + 'g';
    document.getElementById('bmi-fats').textContent           = data.macros.fats_g + 'g';

    document.getElementById('food-tags').innerHTML = data.foodSuggestions
      .map(f => `<span class="food-tag">${f}</span>`).join('');

    await loadTodayLogs();
  } catch (err) {
    alert('Error calculating BMI.');
  }
}

// ─── AUTO LOGIN ON PAGE LOAD ───────────────────────
window.onload = () => {
  const savedUser    = localStorage.getItem('user');
  const savedSession = localStorage.getItem('session');
  if (savedUser && savedSession) {
    try {
      currentUser    = JSON.parse(savedUser);
      currentSession = JSON.parse(savedSession);
      showDashboard();
    } catch (e) {
      console.error('Session parse error:', e);
      localStorage.removeItem('user');
      localStorage.removeItem('session');
    }
  }
};

// ─── ENTER KEY SEARCH ─────────────────────────────
document.addEventListener('keydown', (e) => {
  if (e.key === 'Enter') {
    const input = document.getElementById('food-search-input');
    if (document.activeElement === input) searchFood();
  }
});



async function loadWeeklyReport() {
  try {
    const res = await fetch(`${API}/logs/weekly/${currentUser.id}`);
    const data = await res.json();
    const { report, avgCalories, avgProtein, bestDay, worstDay } = data;
 
    const loggedCount = report.filter(d => d.logged).length;
 
    // Show summary
    document.getElementById('weekly-summary').style.display = 'grid';
    document.getElementById('w-days').textContent = `${loggedCount}/7`;
    document.getElementById('w-avg-cal').textContent = avgCalories;
    document.getElementById('w-avg-protein').textContent = avgProtein + 'g';
    document.getElementById('w-best').textContent = bestDay ? bestDay.dayName : 'No data';
 
    // Daily breakdown
    const breakdown = document.getElementById('weekly-breakdown');
    breakdown.innerHTML = `
      <h4 style="margin-bottom:16px;color:var(--primary);">📅 Day by Day Breakdown</h4>
      ${report.map(day => {
        const goalMet = day.calories >= dailyTargets.calories * 0.85;
        const status = !day.logged ? '⬜ Not logged'
          : goalMet ? '✅ Goal achieved'
          : '❌ Below target';
        const color = !day.logged ? 'var(--text-muted)'
          : goalMet ? 'var(--primary)'
          : 'var(--danger)';
        const pct = Math.min((day.calories / dailyTargets.calories) * 100, 100);
 
        return `
          <div style="background:var(--bg3);border-radius:12px;
            padding:16px;margin-bottom:12px;border:1px solid var(--card-border);">
            <div style="display:flex;justify-content:space-between;
              align-items:center;margin-bottom:10px;flex-wrap:wrap;gap:8px;">
              <div>
                <span style="font-weight:600;">${day.dayName}</span>
                <span style="color:${color};margin-left:10px;font-size:13px;">${status}</span>
              </div>
              <div style="font-size:13px;color:var(--text-muted);">
                🔥 ${day.calories} kcal &nbsp;
                💪 ${day.protein}g protein &nbsp;
                🍞 ${day.carbs}g carbs &nbsp;
                🧈 ${day.fats}g fats
              </div>
            </div>
            <div class="progress-bar">
              <div class="progress-fill ${pct > 90 ? '' : pct > 60 ? 'warning' : 'danger'}"
                style="width:${pct}%"></div>
            </div>
            <div style="font-size:11px;color:var(--text-muted);margin-top:4px;">
              ${Math.round(pct)}% of daily target (${dailyTargets.calories} kcal)
            </div>
          </div>
        `;
      }).join('')}
    `;
 
    // Smart tip
    const tip = document.getElementById('weekly-tip');
    tip.style.display = 'block';
    if (loggedCount < 3) {
      tip.innerHTML = '💡 <strong>Tip:</strong> You logged less than 3 days this week. Try to log every meal for better tracking!';
    } else if (avgCalories < dailyTargets.calories * 0.8) {
      tip.innerHTML = '💡 <strong>Tip:</strong> Your average calories are too low this week. You may be under-eating — try adding more meals!';
    } else if (avgCalories > dailyTargets.calories * 1.2) {
      tip.innerHTML = '💡 <strong>Tip:</strong> You exceeded your calorie target most days. Try reducing portion sizes!';
    } else {
      tip.innerHTML = '💡 <strong>Tip:</strong> Great consistency this week! Keep logging daily to hit your goal faster. 🎉';
    }
 
  } catch (err) {
    console.log('Weekly report error:', err);
  }
}
