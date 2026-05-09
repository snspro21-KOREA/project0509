import {
  auth, onAuthStateChanged, signOut,
  db, doc, getDoc, setDoc
} from './firebase.js';

import {
  updateProfile,
  updatePassword,
  EmailAuthProvider,
  reauthenticateWithCredential
} from "https://www.gstatic.com/firebasejs/10.8.1/firebase-auth.js";

const profileContainer = document.getElementById('profileContainer');
const notLoggedIn      = document.getElementById('notLoggedIn');

// Hero
const heroAvatar   = document.getElementById('heroAvatar');
const heroName     = document.getElementById('heroName');
const heroEmail    = document.getElementById('heroEmail');
const heroProvider = document.getElementById('heroProvider');

// Fields
const profileEmail = document.getElementById('profileEmail');
const profileName  = document.getElementById('profileName');
const saveNameBtn  = document.getElementById('saveNameBtn');
const nameMsg      = document.getElementById('nameMsg');

// Password
const pwCard       = document.getElementById('pwCard');
const currentPw    = document.getElementById('currentPw');
const newPw        = document.getElementById('newPw');
const newPwConfirm = document.getElementById('newPwConfirm');
const savePwBtn    = document.getElementById('savePwBtn');
const pwMsg        = document.getElementById('pwMsg');

// Logout
const profileLogoutBtn = document.getElementById('profileLogoutBtn');

// ─── Auth state ───────────────────────────────────────────
onAuthStateChanged(auth, async (user) => {
  if (!user) {
    notLoggedIn.style.display    = 'block';
    profileContainer.style.display = 'none';
    return;
  }

  notLoggedIn.style.display    = 'none';
  profileContainer.style.display = 'block';

  const isEmailProvider = user.providerData?.[0]?.providerId === 'password';
  const displayName = user.displayName || user.email.split('@')[0];

  // Hero
  heroAvatar.textContent   = displayName.charAt(0).toUpperCase();
  heroName.textContent     = displayName;
  heroEmail.textContent    = user.email;
  heroProvider.textContent = isEmailProvider ? '이메일 가입' : 'Google 계정';

  // Fields
  profileEmail.textContent = user.email;
  profileName.value        = displayName;

  // Show/hide password section
  pwCard.style.display = isEmailProvider ? '' : 'none';
});

// ─── Save Display Name ────────────────────────────────────
saveNameBtn.addEventListener('click', async () => {
  const name = profileName.value.trim();
  if (!name) { showMsg(nameMsg, '이름을 입력해주세요.', 'error'); return; }

  saveNameBtn.disabled = true;
  saveNameBtn.innerHTML = '<i class="ti ti-loader"></i> 저장 중...';
  try {
    const user = auth.currentUser;
    await updateProfile(user, { displayName: name });

    // Also update Firestore users collection
    const userRef = doc(db, 'users', user.uid);
    const snap = await getDoc(userRef);
    if (snap.exists()) {
      await setDoc(userRef, { name }, { merge: true });
    }

    // Update hero live
    heroName.textContent  = name;
    heroAvatar.textContent = name.charAt(0).toUpperCase();

    showMsg(nameMsg, '이름이 저장되었습니다!', 'success');
  } catch (e) {
    showMsg(nameMsg, '저장 중 오류가 발생했습니다.', 'error');
  } finally {
    saveNameBtn.disabled = false;
    saveNameBtn.innerHTML = '<i class="ti ti-device-floppy"></i> 저장';
  }
});

// ─── Change Password ──────────────────────────────────────
savePwBtn?.addEventListener('click', async () => {
  const currentVal = currentPw.value;
  const newVal     = newPw.value;
  const confirmVal = newPwConfirm.value;

  if (!currentVal || !newVal || !confirmVal) {
    showMsg(pwMsg, '모든 항목을 입력해주세요.', 'error'); return;
  }
  if (newVal.length < 8) {
    showMsg(pwMsg, '새 비밀번호는 8자 이상이어야 합니다.', 'error'); return;
  }
  if (newVal !== confirmVal) {
    showMsg(pwMsg, '새 비밀번호가 일치하지 않습니다.', 'error'); return;
  }

  savePwBtn.disabled = true;
  savePwBtn.innerHTML = '<i class="ti ti-loader"></i> 처리 중...';
  try {
    const user = auth.currentUser;
    // Re-authenticate first
    const credential = EmailAuthProvider.credential(user.email, currentVal);
    await reauthenticateWithCredential(user, credential);
    // Then update
    await updatePassword(user, newVal);
    currentPw.value = ''; newPw.value = ''; newPwConfirm.value = '';
    showMsg(pwMsg, '비밀번호가 변경되었습니다!', 'success');
  } catch (e) {
    const msgs = {
      'auth/wrong-password':       '현재 비밀번호가 올바르지 않습니다.',
      'auth/invalid-credential':   '현재 비밀번호가 올바르지 않습니다.',
      'auth/weak-password':        '새 비밀번호가 너무 약합니다.',
      'auth/requires-recent-login':'보안을 위해 다시 로그인 후 시도해주세요.',
    };
    showMsg(pwMsg, msgs[e.code] || '비밀번호 변경 중 오류가 발생했습니다.', 'error');
  } finally {
    savePwBtn.disabled = false;
    savePwBtn.innerHTML = '<i class="ti ti-lock-check"></i> 비밀번호 변경';
  }
});

// ─── Logout ───────────────────────────────────────────────
profileLogoutBtn.addEventListener('click', async () => {
  await signOut(auth);
  window.location.href = 'index.html';
});

// ─── Helper ───────────────────────────────────────────────
function showMsg(el, msg, type) {
  const color = type === 'success' ? 'var(--success-500)' : 'var(--error-500)';
  const icon  = type === 'success' ? 'check' : 'alert-circle';
  el.innerHTML = `<span style="color:${color};"><i class="ti ti-${icon}"></i> ${msg}</span>`;
  setTimeout(() => { el.innerHTML = ''; }, 5000);
}
