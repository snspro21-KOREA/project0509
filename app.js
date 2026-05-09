import { db, collection, addDoc, serverTimestamp, doc, getDoc, setDoc, auth, signOut, onAuthStateChanged } from './firebase.js';

document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('registrationForm');
  const submitBtn = document.getElementById('submitBtn');
  const formMessage = document.getElementById('formMessage');
  const loginBtn = document.getElementById('loginBtn');
  const logoutBtn = document.getElementById('logoutBtn');
  const userChip        = document.getElementById('userChip');
  const userAvatar      = document.getElementById('userAvatar');
  const userDisplayName = document.getElementById('userDisplayName');

  // Auth state: toggle login/logout button + auto-save user to Firestore
  onAuthStateChanged(auth, async (user) => {
    if (loginBtn && logoutBtn) {
      if (user) {
        loginBtn.style.display  = 'none';
        logoutBtn.style.display = 'inline-flex';

        // Show user chip
        if (userChip) {
          const name = user.displayName || user.email.split('@')[0];
          userAvatar.textContent      = name.charAt(0).toUpperCase();
          userDisplayName.textContent = name;
          userChip.style.display      = 'inline-flex';
        }

        // Auto-create Firestore profile if not exists (catches existing Auth users)
        try {
          const userRef = doc(db, 'users', user.uid);
          const snap = await getDoc(userRef);
          if (!snap.exists()) {
            const isGoogle = user.providerData?.[0]?.providerId === 'google.com';
            await setDoc(userRef, {
              name:      user.displayName || user.email.split('@')[0],
              email:     user.email,
              uid:       user.uid,
              provider:  isGoogle ? 'google' : 'email',
              createdAt: serverTimestamp()
            });
          }
        } catch (e) {
          console.warn('Firestore user sync error:', e);
        }

      } else {
        loginBtn.style.display = 'inline-flex';
        logoutBtn.style.display = 'none';
        if (userChip) userChip.style.display = 'none';
      }
    }
  });

  // Logout handler
  if (logoutBtn) {
    logoutBtn.addEventListener('click', async () => {
      await signOut(auth);
    });
  }

  if (form) {
    form.addEventListener('submit', async (e) => {
      e.preventDefault();

      const name = document.getElementById('userName').value.trim();
      const phone = document.getElementById('userPhone').value.trim();
      const course = document.getElementById('courseSelect').value;
      const email = document.getElementById('userEmail').value.trim();
      const memo = document.getElementById('userMemo').value.trim();

      if (!name || !phone || !course) {
        showMessage('필수 항목을 모두 입력해주세요.', 'error');
        return;
      }

      submitBtn.disabled = true;
      submitBtn.innerHTML = '신청 중... <i class="ti ti-loader"></i>';
      formMessage.innerHTML = '';

      try {
        const docRef = await addDoc(collection(db, 'registrations'), {
          name,
          phone,
          course,
          email,
          memo,
          createdAt: serverTimestamp()
        });

        console.log("Document written with ID: ", docRef.id);
        showMessage('신청이 완료되었습니다! 담당자가 확인 후 연락드리겠습니다.', 'success');
        form.reset();
      } catch (error) {
        console.error("Error adding document: ", error);
        showMessage('신청 중 오류가 발생했습니다. 나중에 다시 시도해주세요.', 'error');
      } finally {
        submitBtn.disabled = false;
        submitBtn.innerHTML = '신청 완료하기';
      }
    });
  }

  function showMessage(msg, type) {
    formMessage.innerHTML = `<span style="color: ${type === 'success' ? 'var(--success-500)' : 'var(--error-500)'};"><i class="ti ti-${type === 'success' ? 'check' : 'alert-circle'}"></i> ${msg}</span>`;
  }
});
