import { db, collection, addDoc, serverTimestamp, auth, signOut, onAuthStateChanged } from './firebase.js';

document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('registrationForm');
  const submitBtn = document.getElementById('submitBtn');
  const formMessage = document.getElementById('formMessage');
  const loginBtn = document.getElementById('loginBtn');
  const logoutBtn = document.getElementById('logoutBtn');

  // Auth state: toggle login/logout button
  onAuthStateChanged(auth, (user) => {
    if (loginBtn && logoutBtn) {
      if (user) {
        loginBtn.style.display = 'none';
        logoutBtn.style.display = 'inline-flex';
      } else {
        loginBtn.style.display = 'inline-flex';
        logoutBtn.style.display = 'none';
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
