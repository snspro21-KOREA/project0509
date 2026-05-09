import {
  auth, provider,
  signInWithPopup, signOut, onAuthStateChanged,
  db, doc, setDoc, serverTimestamp
} from './firebase.js';

import {
  getAuth,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  sendPasswordResetEmail,
  updateProfile
} from "https://www.gstatic.com/firebasejs/10.8.1/firebase-auth.js";

// Redirect if already logged in
onAuthStateChanged(auth, (user) => {
  if (user) {
    window.location.href = 'index.html';
  }
});

document.addEventListener('DOMContentLoaded', () => {
  const authMessage = document.getElementById('authMessage');

  function showMessage(msg, type = 'error') {
    const color = type === 'success' ? 'var(--success-500)' : 'var(--error-500)';
    const icon = type === 'success' ? 'check' : 'alert-circle';
    authMessage.innerHTML = `<span style="color:${color};"><i class="ti ti-${icon}"></i> ${msg}</span>`;
  }

  // ── Email Login ──────────────────────────────────────────
  const loginSubmitBtn = document.getElementById('loginSubmitBtn');
  if (loginSubmitBtn) {
    loginSubmitBtn.addEventListener('click', async () => {
      const email = document.getElementById('loginEmail').value.trim();
      const password = document.getElementById('loginPassword').value;
      if (!email || !password) { showMessage('이메일과 비밀번호를 입력해주세요.'); return; }

      loginSubmitBtn.disabled = true;
      loginSubmitBtn.innerHTML = '<i class="ti ti-loader"></i> 로그인 중...';
      try {
        await signInWithEmailAndPassword(auth, email, password);
        // onAuthStateChanged will redirect
      } catch (e) {
        const msgs = {
          'auth/user-not-found': '등록된 계정이 없습니다.',
          'auth/wrong-password': '비밀번호가 올바르지 않습니다.',
          'auth/invalid-email': '이메일 형식이 올바르지 않습니다.',
          'auth/invalid-credential': '이메일 또는 비밀번호가 올바르지 않습니다.',
        };
        showMessage(msgs[e.code] || '로그인 중 오류가 발생했습니다.');
        loginSubmitBtn.disabled = false;
        loginSubmitBtn.innerHTML = '<i class="ti ti-login"></i> 로그인';
      }
    });
  }

  // ── Sign Up ──────────────────────────────────────────────
  const signupSubmitBtn = document.getElementById('signupSubmitBtn');
  if (signupSubmitBtn) {
    signupSubmitBtn.addEventListener('click', async () => {
      const name = document.getElementById('signupName').value.trim();
      const email = document.getElementById('signupEmail').value.trim();
      const pw = document.getElementById('signupPassword').value;
      const pwConfirm = document.getElementById('signupPasswordConfirm').value;

      if (!name || !email || !pw) { showMessage('모든 필수 항목을 입력해주세요.'); return; }
      if (pw.length < 8) { showMessage('비밀번호는 8자 이상이어야 합니다.'); return; }
      if (pw !== pwConfirm) { showMessage('비밀번호가 일치하지 않습니다.'); return; }

      signupSubmitBtn.disabled = true;
      signupSubmitBtn.innerHTML = '<i class="ti ti-loader"></i> 처리 중...';
      try {
        const cred = await createUserWithEmailAndPassword(auth, email, pw);
        await updateProfile(cred.user, { displayName: name });
        // Save user profile to Firestore
        await setDoc(doc(db, 'users', cred.user.uid), {
          name,
          email,
          uid: cred.user.uid,
          provider: 'email',
          createdAt: serverTimestamp()
        });
        showMessage(`${name}님, 가입을 환영합니다!`, 'success');
        // onAuthStateChanged will redirect
      } catch (e) {
        const msgs = {
          'auth/email-already-in-use': '이미 사용 중인 이메일입니다.',
          'auth/invalid-email': '이메일 형식이 올바르지 않습니다.',
          'auth/weak-password': '비밀번호가 너무 약합니다.',
        };
        showMessage(msgs[e.code] || '회원가입 중 오류가 발생했습니다.');
        signupSubmitBtn.disabled = false;
        signupSubmitBtn.innerHTML = '<i class="ti ti-user-plus"></i> 회원가입';
      }
    });
  }

  // ── Forgot Password ─────────────────────────────────────
  const forgotPwLink = document.getElementById('forgotPwLink');
  if (forgotPwLink) {
    forgotPwLink.addEventListener('click', async (e) => {
      e.preventDefault();
      const email = document.getElementById('loginEmail').value.trim();
      if (!email) { showMessage('이메일을 먼저 입력해주세요.'); return; }
      try {
        await sendPasswordResetEmail(auth, email);
        showMessage('비밀번호 재설정 이메일을 발송했습니다.', 'success');
      } catch (e) {
        showMessage('이메일 발송에 실패했습니다. 이메일 주소를 확인해주세요.');
      }
    });
  }

  // ── Google Login ─────────────────────────────────────────
  const googleLoginBtn = document.getElementById('googleLoginBtn');
  if (googleLoginBtn) {
    googleLoginBtn.addEventListener('click', async () => {
      try {
        await signInWithPopup(auth, provider);
        // onAuthStateChanged will redirect
      } catch (e) {
        showMessage('Google 로그인 중 오류가 발생했습니다.');
      }
    });
  }
});
