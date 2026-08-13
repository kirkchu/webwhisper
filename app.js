const recordButton = document.querySelector('#recordButton');
const clearButton = document.querySelector('#clearButton');
const transcribeButton = document.querySelector('#transcribeButton');
const copyButton = document.querySelector('#copyButton');
const apiKeyInput = document.querySelector('#apiKey');
const toggleKeyButton = document.querySelector('#toggleKeyButton');
const timer = document.querySelector('#timer');
const stageHint = document.querySelector('#stageHint');
const message = document.querySelector('#message');
const placeholder = document.querySelector('#placeholder');
const transcript = document.querySelector('#transcript');
const waveformBars = document.querySelectorAll('.waveform i');

let recorder;
let audioChunks = [];
let audioBlob;
let timerInterval;
let startedAt;

function setMessage(text, success = false) {
  message.textContent = text;
  message.classList.toggle('success', success);
}

function updateTimer() {
  const elapsed = Math.floor((Date.now() - startedAt) / 1000);
  timer.textContent = `${String(Math.floor(elapsed / 60)).padStart(2, '0')}:${String(elapsed % 60).padStart(2, '0')}`;
}

function resetRecording() {
  clearInterval(timerInterval);
  timer.textContent = '00:00';
  audioBlob = undefined;
  audioChunks = [];
  clearButton.disabled = true;
  transcribeButton.disabled = true;
  recordButton.classList.remove('recording');
  recordButton.querySelector('.button-text').textContent = '開始錄音';
  stageHint.textContent = '點擊按鈕，允許瀏覽器使用麥克風';
  waveformBars.forEach((bar, index) => { bar.style.height = `${[12, 25, 17, 12][index % 4]}px`; });
}

recordButton.addEventListener('click', async () => {
  if (recorder?.state === 'recording') {
    recorder.stop();
    return;
  }
  if (!navigator.mediaDevices?.getUserMedia || !window.MediaRecorder) {
    setMessage('此瀏覽器不支援錄音，請改用最新版 Chrome 或 Safari。');
    return;
  }
  try {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    recorder = new MediaRecorder(stream);
    audioChunks = [];
    recorder.ondataavailable = (event) => audioChunks.push(event.data);
    recorder.onstop = () => {
      stream.getTracks().forEach((track) => track.stop());
      audioBlob = new Blob(audioChunks, { type: recorder.mimeType || 'audio/webm' });
      clearButton.disabled = false;
      transcribeButton.disabled = false;
      stageHint.textContent = '錄音完成，可以開始轉錄';
      setMessage('錄音已準備好。', true);
    };
    recorder.start();
    startedAt = Date.now();
    timerInterval = setInterval(updateTimer, 250);
    recordButton.classList.add('recording');
    recordButton.querySelector('.button-text').textContent = '停止錄音';
    stageHint.textContent = '正在錄音，再次點擊即可停止';
    setMessage('');
  } catch (error) {
    setMessage(error.name === 'NotAllowedError' ? '需要允許麥克風權限才能錄音。' : '無法啟用麥克風，請檢查裝置設定。');
  }
});

clearButton.addEventListener('click', () => { resetRecording(); setMessage(''); });

transcribeButton.addEventListener('click', async () => {
  const apiKey = apiKeyInput.value.trim();
  if (!apiKey) { setMessage('請先輸入 OpenAI API key。'); apiKeyInput.focus(); return; }
  if (!audioBlob) return;
  transcribeButton.disabled = true;
  setMessage('Whisper 正在聆聽這段錄音…');
  const formData = new FormData();
  formData.append('file', audioBlob, 'recording.webm');
  formData.append('model', 'whisper-1');
  formData.append('language', 'zh');
  try {
    const response = await fetch('https://api.openai.com/v1/audio/transcriptions', { method: 'POST', headers: { Authorization: `Bearer ${apiKey}` }, body: formData });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error?.message || '轉錄失敗。');
    transcript.textContent = data.text || '沒有辨識到文字。';
    placeholder.hidden = true;
    transcript.hidden = false;
    copyButton.disabled = !data.text;
    setMessage('轉錄完成。', true);
  } catch (error) {
    setMessage(`轉錄失敗：${error.message}`);
  } finally { transcribeButton.disabled = false; }
});

copyButton.addEventListener('click', async () => {
  await navigator.clipboard.writeText(transcript.textContent);
  setMessage('文字已複製。', true);
});

toggleKeyButton.addEventListener('click', () => {
  const isPassword = apiKeyInput.type === 'password';
  apiKeyInput.type = isPassword ? 'text' : 'password';
  toggleKeyButton.textContent = isPassword ? '隱藏' : '顯示';
  toggleKeyButton.setAttribute('aria-label', isPassword ? '隱藏 API key' : '顯示 API key');
});