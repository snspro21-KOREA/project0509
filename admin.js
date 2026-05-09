import {
  db, collection, getDocs, query, orderBy,
  doc, getDoc, setDoc, deleteDoc,
  auth, provider, signInWithPopup, signOut, onAuthStateChanged
} from './firebase.js';

import { signInWithEmailAndPassword } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-auth.js";

// ─── 슈퍼 어드민 (코드 변경 없이는 삭제 불가) ──────────────
const SUPER_ADMIN = 'snspro@naver.com';
const ADMINS_COL  = 'admins';  // Firestore collection name

// ─── DOM refs ─────────────────────────────────────────────
const gateScreen         = document.getElementById('gateScreen');
const dashboardScreen    = document.getElementById('dashboardScreen');
const gateGoogleBtn      = document.getElementById('gateGoogleBtn');
const gateError          = document.getElementById('gateError');
const dashboardLogoutBtn = document.getElementById('dashboardLogoutBtn');
const refreshBtn         = document.getElementById('refreshBtn');
const sidebarUserName    = document.getElementById('sidebarUserName');
const sidebarUserEmail   = document.getElementById('sidebarUserEmail');
const sidebarAvatarText  = document.getElementById('sidebarAvatarText');
// Stats
const statTotal  = document.getElementById('statTotal');
const statGrade1 = document.getElementById('statGrade1');
const statGrade2 = document.getElementById('statGrade2');
const statToday  = document.getElementById('statToday');
// Table
const loadingState = document.getElementById('loadingState');
const tableWrapper = document.getElementById('tableWrapper');
const emptyState   = document.getElementById('emptyState');
const tbody        = document.getElementById('registrationsTableBody');
// Admin mgr
const adminMgrCard  = document.getElementById('adminMgrCard');
const adminList     = document.getElementById('adminList');
const newAdminEmail = document.getElementById('newAdminEmail');
const addAdminBtn   = document.getElementById('addAdminBtn');
const adminMsgBar   = document.getElementById('adminMsgBar');
// Nav
const navRegistrations = document.getElementById('navRegistrations');
const navAdmins        = document.getElementById('navAdmins');

// ─── Nav switching ────────────────────────────────────────
const regSection   = document.getElementById('loadingState').closest('.table-card').parentElement; // dashboard-body sub
let currentPanel = 'registrations';

navRegistrations.addEventListener('click', (e) => {
  e.preventDefault();
  switchPanel('registrations');
});
navAdmins.addEventListener('click', (e) => {
  e.preventDefault();
  if (isSuperAdmin()) {
    switchPanel('admins');
  } else {
    showAdminMsg('슈퍼 어드민만 관리자 목록을 관리할 수 있습니다.', 'error');
    switchPanel('admins'); // still show the card with the message
  }
});

function switchPanel(panel) {
  currentPanel = panel;
  const tableCard  = document.querySelector('.table-card');
  const statsRow   = document.querySelector('.stats-row');

  if (panel === 'registrations') {
    navRegistrations.classList.add('active');
    navAdmins.classList.remove('active');
    statsRow.style.display   = '';
    tableCard.style.display  = '';
    adminMgrCard.style.display = 'none';
    document.querySelector('.topbar-title').textContent      = '수강 신청 관리';
    document.querySelector('.topbar-breadcrumb').textContent = '자격과정 등록관리 › 수강 신청 내역';
  } else {
    navAdmins.classList.add('active');
    navRegistrations.classList.remove('active');
    statsRow.style.display   = 'none';
    tableCard.style.display  = 'none';
    adminMgrCard.style.display = '';
    document.querySelector('.topbar-title').textContent      = '관리자 계정 관리';
    document.querySelector('.topbar-breadcrumb').textContent = '설정 › 관리자 관리';
    fetchAdminList();
  }
}

function isSuperAdmin() {
  return auth.currentUser?.email === SUPER_ADMIN;
}

// ─── Auth: check Firestore admins collection ──────────────
async function checkAdminAccess(user) {
  if (!user) return false;
  if (user.email === SUPER_ADMIN) return true;
  const snap = await getDoc(doc(db, ADMINS_COL, user.email));
  return snap.exists();
}

onAuthStateChanged(auth, async (user) => {
  if (user) {
    const ok = await checkAdminAccess(user);
    if (ok) {
      showDashboard(user);
      fetchRegistrations();
    } else {
      await signOut(auth);
      showGate('이 계정은 관리자 권한이 없습니다.');
    }
  } else {
    showGate();
  }
});

function showGate(msg = '') {
  gateScreen.style.display    = 'flex';
  dashboardScreen.style.display = 'none';
  gateError.textContent = msg;
}

function showDashboard(user) {
  gateScreen.style.display    = 'none';
  dashboardScreen.style.display = 'block';
  const name = user.displayName || user.email.split('@')[0];
  sidebarUserName.textContent  = name;
  sidebarUserEmail.textContent = user.email;
  sidebarAvatarText.textContent = name.charAt(0).toUpperCase();
  // Show admin-mgr nav only to super admin
  if (user.email === SUPER_ADMIN) {
    navAdmins.style.display = '';
  } else {
    navAdmins.style.display = 'none';
  }
}

// ─── Gate: Email/Password Login ──────────────────────────
const gateEmailBtn = document.getElementById('gateEmailBtn');
const gateEmailInput = document.getElementById('gateEmail');
const gatePasswordInput = document.getElementById('gatePassword');

gateEmailBtn.addEventListener('click', async () => {
  const email = gateEmailInput.value.trim();
  const password = gatePasswordInput.value;
  if (!email || !password) { gateError.textContent = '이메일과 비밀번호를 입력해주세요.'; return; }

  gateEmailBtn.disabled = true;
  gateEmailBtn.innerHTML = '<i class="ti ti-loader"></i> 로그인 중...';
  gateError.textContent = '';
  try {
    await signInWithEmailAndPassword(auth, email, password);
    // onAuthStateChanged handles access check
  } catch (e) {
    const msgs = {
      'auth/user-not-found': '등록된 계정이 없습니다.',
      'auth/wrong-password': '비밀번호가 올바르지 않습니다.',
      'auth/invalid-credential': '이메일 또는 비밀번호가 올바르지 않습니다.',
      'auth/invalid-email': '이메일 형식이 올바르지 않습니다.',
    };
    gateError.textContent = msgs[e.code] || '로그인 중 오류가 발생했습니다.';
    gateEmailBtn.disabled = false;
    gateEmailBtn.innerHTML = '<i class="ti ti-login"></i> 로그인';
  }
});

// Enter key on password field triggers login
gatePasswordInput?.addEventListener('keydown', (e) => {
  if (e.key === 'Enter') gateEmailBtn.click();
});

// ─── Gate: Google Login ───────────────────────────────────
gateGoogleBtn.addEventListener('click', async () => {
  gateError.textContent = '';
  gateGoogleBtn.disabled = true;
  gateGoogleBtn.textContent = '로그인 중...';
  try {
    await signInWithPopup(auth, provider);
  } catch {
    gateError.textContent = '로그인 중 오류가 발생했습니다.';
    gateGoogleBtn.disabled = false;
    gateGoogleBtn.innerHTML = 'Google 계정으로 로그인';
  }
});

// ─── Logout ───────────────────────────────────────────────
dashboardLogoutBtn.addEventListener('click', () => signOut(auth));
refreshBtn.addEventListener('click', () => { if (currentPanel === 'registrations') fetchRegistrations(); else fetchAdminList(); });

// ─── Fetch Registrations ──────────────────────────────────
async function fetchRegistrations() {
  loadingState.style.display = 'block';
  tableWrapper.style.display = 'none';
  emptyState.style.display   = 'none';
  tbody.innerHTML = '';

  try {
    const q    = query(collection(db, 'registrations'), orderBy('createdAt', 'desc'));
    const snap = await getDocs(q);
    const today = new Date(); today.setHours(0,0,0,0);
    let total=0, g1=0, g2=0, todayCount=0;

    if (snap.empty) {
      emptyState.style.display = 'block';
    } else {
      snap.forEach((docSnap) => {
        const d = docSnap.data(); total++;
        if (d.course?.includes('1급')) g1++;
        if (d.course?.includes('2급')) g2++;
        const createdAt = d.createdAt?.toDate();
        if (createdAt && createdAt >= today) todayCount++;
        const dateStr = createdAt ? createdAt.toLocaleString('ko-KR') : '-';
        const courseBadge = d.course?.includes('1급')
          ? `<span class="badge badge-primary">${d.course}</span>`
          : `<span class="badge" style="background:#FFF7ED;color:#C2410C;border:1px solid #FED7AA;">${d.course}</span>`;
        const tr = document.createElement('tr');
        tr.innerHTML = `
          <td style="color:var(--neutral-400);font-size:12px;">${total}</td>
          <td style="white-space:nowrap;font-size:12px;color:var(--neutral-500);">${dateStr}</td>
          <td style="font-weight:600;">${d.name||'-'}</td>
          <td>${d.phone||'-'}</td>
          <td>${courseBadge}</td>
          <td style="color:var(--neutral-600);">${d.email||'-'}</td>
          <td style="color:var(--neutral-500);max-width:180px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;" title="${d.memo||''}">${d.memo||'-'}</td>`;
        tbody.appendChild(tr);
      });
      tableWrapper.style.display = 'block';
    }
    statTotal.textContent=total; statGrade1.textContent=g1;
    statGrade2.textContent=g2;  statToday.textContent=todayCount;
  } catch (err) {
    emptyState.style.display = 'block';
    emptyState.innerHTML = `<i class="ti ti-alert-circle" style="color:var(--error-500);"></i><br>데이터를 불러오지 못했습니다.`;
  } finally {
    loadingState.style.display = 'none';
  }
}

// ─── Admin List (Firestore) ───────────────────────────────
async function fetchAdminList() {
  adminList.innerHTML = '<div style="padding:16px;color:var(--neutral-400);font-size:13px;">불러오는 중...</div>';
  try {
    const snap = await getDocs(collection(db, ADMINS_COL));
    const emails = [];
    snap.forEach(d => emails.push(d.id));

    // Always show super admin first
    const rows = [SUPER_ADMIN, ...emails.filter(e => e !== SUPER_ADMIN)];

    adminList.innerHTML = rows.map(email => {
      const isSuper = email === SUPER_ADMIN;
      const initial = email.charAt(0).toUpperCase();
      return `
        <div class="admin-list-item">
          <div class="admin-list-item-info">
            <div class="admin-list-avatar">${initial}</div>
            <div>
              <span class="admin-list-email">${email}</span>
              <span class="admin-list-tag ${isSuper ? 'super' : ''}">${isSuper ? '슈퍼 어드민' : '어드민'}</span>
            </div>
          </div>
          ${!isSuper ? `<button class="btn-del-admin" title="삭제" onclick="removeAdmin('${email}')"><i class="ti ti-trash"></i></button>` : ''}
        </div>`;
    }).join('');

  } catch (err) {
    adminList.innerHTML = '<div style="padding:16px;color:var(--error-500);font-size:13px;">목록을 불러오지 못했습니다.</div>';
  }
}

// ─── Add Admin ────────────────────────────────────────────
addAdminBtn.addEventListener('click', async () => {
  if (!isSuperAdmin()) return;
  const email = newAdminEmail.value.trim().toLowerCase();
  if (!email || !email.includes('@')) { showAdminMsg('유효한 이메일을 입력해주세요.', 'error'); return; }
  if (email === SUPER_ADMIN) { showAdminMsg('슈퍼 어드민은 이미 등록되어 있습니다.', 'error'); return; }

  addAdminBtn.disabled = true;
  try {
    await setDoc(doc(db, ADMINS_COL, email), {
      addedAt: new Date().toISOString(),
      addedBy: auth.currentUser.email
    });
    newAdminEmail.value = '';
    showAdminMsg(`${email} 추가 완료!`, 'success');
    fetchAdminList();
  } catch (err) {
    showAdminMsg('추가 중 오류가 발생했습니다.', 'error');
  } finally {
    addAdminBtn.disabled = false;
  }
});

// ─── Remove Admin ─────────────────────────────────────────
window.removeAdmin = async (email) => {
  if (!isSuperAdmin()) return;
  if (!confirm(`"${email}" 관리자를 삭제할까요?`)) return;
  try {
    await deleteDoc(doc(db, ADMINS_COL, email));
    showAdminMsg(`${email} 삭제 완료.`, 'success');
    fetchAdminList();
  } catch {
    showAdminMsg('삭제 중 오류가 발생했습니다.', 'error');
  }
};

function showAdminMsg(msg, type = 'success') {
  const color = type === 'success' ? 'var(--success-500)' : 'var(--error-500)';
  adminMsgBar.innerHTML = `<span style="color:${color};"><i class="ti ti-${type==='success'?'check':'alert-circle'}"></i> ${msg}</span>`;
  setTimeout(() => { adminMsgBar.innerHTML = ''; }, 4000);
}
