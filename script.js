const recordBtn = document.getElementById('recordBtn');
const btnText = document.getElementById('btnText');
const icon = recordBtn.querySelector('.icon');
const transcriptionBlock = document.getElementById('transcriptionBlock');
const transcription = document.getElementById('transcription');
const copyBtn = document.getElementById('copyBtn');

let mediaRecorder;
let audioChunks = [];
let isRecording = false;

// === ФУНКЦИЯ: начать запись ===
async function startRecording() {
  const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
  mediaRecorder = new MediaRecorder(stream);
  audioChunks = [];

  mediaRecorder.ondataavailable = event => {
    audioChunks.push(event.data);
  };

  mediaRecorder.onstop = async () => {
    const audioBlob = new Blob(audioChunks, { type: 'audio/webm' });
    const audioFile = new File([audioBlob], 'audio.webm', { type: 'audio/webm' });

    // Обновим кнопку
    btnText.innerText = 'Распознаем';
    recordBtn.classList.remove('recording');
    recordBtn.classList.add('pulsing');
    recordBtn.disabled = true;

    await sendToServer(audioFile);

    recordBtn.disabled = false;
    btnText.innerText = 'Начать запись';
    recordBtn.classList.remove('pulsing');
  };

  mediaRecorder.start();
}

// === ФУНКЦИЯ: отправка файла на /api/transcribe ===
async function sendToServer(audioFile) {
  const formData = new FormData();
  formData.append("audio", audioFile);

  const res = await fetch("/api/transcribe", {
    method: "POST",
    body: formData
  });

  const data = await res.json();
  transcription.innerText = data.text || 'Ошибка';
  transcriptionBlock.classList.remove("hidden");
}

// === Кнопка записи ===
recordBtn.addEventListener('click', async () => {
  if (!isRecording) {
    isRecording = true;
    btnText.innerText = 'Остановить';
    recordBtn.classList.add('recording');
    startRecording();
  } else {
    isRecording = false;
    mediaRecorder.stop();
  }
});

// === Кнопка копирования ===
copyBtn.addEventListener('click', () => {
  navigator.clipboard.writeText(transcription.innerText)
    .then(() => {
      copyBtn.innerHTML = '<i data-lucide="check"></i>';
      lucide.createIcons();
      setTimeout(() => {
        copyBtn.innerHTML = '<i data-lucide="copy"></i>';
        lucide.createIcons();
      }, 1000);
    });
});
