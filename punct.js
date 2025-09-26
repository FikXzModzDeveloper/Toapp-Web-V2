const $ = id => document.getElementById(id);

const form       = $('builderForm');
const progr      = $('progress');
const result     = $('result');
const btn        = $('submitBtn');
const progText   = $('progText');
const progBar    = $('progBar');
const errorAlert = $('errorAlert');
const errorMsg   = $('errorMsg');
const uploadStatus = $('uploadStatus');
const fileLabel  = $('fileLabel');
const fileName   = $('fileName');
const fileError  = $('fileError');

function showError(message) {
  errorMsg.textContent = message;
  errorAlert.classList.remove('hidden');
  setTimeout(() => errorAlert.classList.add('hidden'), 5000);
}

async function uploadToUrl(file) {
  const formData = new FormData();
  formData.append('files', file, file.name);

  const res = await fetch('https://cdn.yupra.my.id/upload', {
    method : 'POST',
    body   : formData,
    headers: { 'User-Agent': 'Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36' }
  });

  const data = await res.json();
  if (data.success && data.files?.[0]) {
    return 'https://cdn.yupra.my.id' + data.files[0].url;
  } else {
    throw new Error('Upload gagal: ' + JSON.stringify(data));
  }
}

function animateProgress(tMin = 3) {
  const total = tMin * 60 * 1000;
  const start = Date.now();
  const iv = setInterval(() => {
    const elap = Math.min(90, Math.round(((Date.now() - start) / total) * 100));
    progBar.style.width = elap + '%';
    if (elap === 90) clearInterval(iv);
  }, 1000);
  return () => clearInterval(iv);
}

function validatePhoto(file) {
  const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
  const maxSize = 5 * 1024 * 1024; // 5MB

  if (!validTypes.includes(file.type)) {
    return { valid: false, message: 'cuma photo jir ngapa malah pilih file yang lain😂' };
  }
  
  if (file.size > maxSize) {
    return { valid: false, message: 'Ukuran Poto nya jan lebih dari 5mb bre' };
  }
  
  return { valid: true };
}

form.addEventListener('submit', async e => {
  e.preventDefault();
  btn.disabled = true;
  errorAlert.classList.add('hidden');
  progr.classList.remove('hidden');
  result.classList.add('hidden');
  const stopProg = animateProgress(3);

  try {
    const url     = $('url').value.trim();
    const appName = $('appName').value.trim();
    const email   = $('email').value.trim();
    const imgFile = $('iconFile').files[0];

    if (!imgFile) throw new Error('Pilih ikon dulu');
    
    const validation = validatePhoto(imgFile);
    if (!validation.valid) throw new Error(validation.message);
    
    try { new URL(url); } catch { throw new Error('URL tidak valid'); }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) throw new Error('Format email tidak valid');

    progText.textContent = 'Mengunggah ikon…';
    const iconUrl = await uploadToUrl(imgFile);

    progText.textContent = 'Processing Builder…';
    const apiUrl = 'https://api.fikmydomainsz.xyz/tools/toapp/build-complete' +
      '?url='     + encodeURIComponent(url) +
      '&email='   + encodeURIComponent(email) +
      '&appName=' + encodeURIComponent(appName) +
      '&appIcon=' + encodeURIComponent(iconUrl);

    const controller = new AbortController();
    const timeoutId  = setTimeout(() => controller.abort(), 5 * 60 * 1000);

    const res = await fetch(apiUrl, { signal: controller.signal });
    clearTimeout(timeoutId);

    if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);

    const job = await res.json();
    if (!job.status) throw new Error(job.error || 'Build gagal');

    stopProg();
    progBar.style.width = '100%';

    $('dlApk').href = job.downloadUrl;
    $('keyInfo').textContent =
`storePass : ${job.storePass}
keyPass   : ${job.keyPass}
keySha    : ${job.keySha}
package   : ${job.packageName}`;

    progr.classList.add('hidden');
    result.classList.remove('hidden');
  } catch (err) {
    stopProg();
    progr.classList.add('hidden');
    btn.disabled = false;
    showError('Error: ' + err.message);
    console.error(err);
  }
});

$('iconFile').addEventListener('change', function () {
  const file = this.files[0];
  fileError.textContent = '';
  
  if (!file) {
    fileLabel.classList.remove('has-file');
    fileName.textContent = '';
    return;
  }

  const validation = validatePhoto(file);
  if (!validation.valid) {
    fileError.textContent = validation.message;
    fileLabel.classList.remove('has-file');
    fileName.textContent = '';
    this.value = '';
    return;
  }

  fileLabel.classList.add('has-file');
  fileName.textContent = file.name;
  uploadStatus.classList.remove('hidden');
  // uploadStatus.textContent = 'File: ' + file.name;
  uploadStatus.className = 'upload-status status-success';
});
