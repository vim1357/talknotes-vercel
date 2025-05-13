const recordBtn = document.getElementById('recordBtn');
const transcriptionBlock = document.getElementById('transcriptionBlock');
const transcription = document.getElementById('transcription');
const btnText = document.getElementById('btnText');
const loader = document.getElementById('loader');
const copyIcon = document.getElementById('copyIcon');

let mediaRecorder;
let audioChunks = [];
let isRecording = false;

// Функция записи
async function startRecording() {
  const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
  mediaRecorder = new MediaRecorder(stream);

  mediaRecorder.ondataavailable = event => {
    audioChunks.push(event.data);
  };

  mediaRecorder.onstop = async () => {
    const audioBlob = new Blob(audioChunks, { type: 'audio/wav' });
    const audioFile = new File([audioBlob], 'recording.wav', { type: 'audio/wav' });

    // Отправка на сервер для транскрипции
    await sendToAssemblyAI(audioFile);
    audioChunks = [];
  };

  mediaRecorder.start();
}

// Функция отправки на сервер
async function sendToAssemblyAI(audioFile) {
  // Показываем загрузчик
  loader.classList.remove('hidden');
  transcriptionBlock.classList.add("hidden");
  btnText.innerText = 'Распознаем...';

  const formData = new FormData();
  formData.append("audio", audioFile);

  const response = await fetch("/api/transcribe", {
    method: "POST",
    body: formData
  });

  const data = await response.json();
  transcription.innerText = data.text || 'Ошибка';
  transcriptionBlock.classList.remove("hidden");

  // Обновляем кнопку
  btnText.innerText = 'Начать запись';
  recordBtn.classList.remove('recording');
  recordBtn.classList.add('none');
  loader.classList.add('hidden');
}

// Обработчик кнопки записи
recordBtn.addEventListener('click', () => {
  if (isRecording) {
    // Останавливаем запись
    mediaRecorder.stop();
    isRecording = false;

    // Обновляем кнопку
    btnText.innerText = 'Распознаем';
    recordBtn.classList.remove('recording');
    recordBtn.classList.add('pulsing');
  } else {
    // Начинаем запись
    isRecording = true;
    startRecording();
    btnText.innerText = 'Остановить';
    recordBtn.classList.add('recording');
    recordBtn.classList.remove('none');
  }
});

// Функция копирования текста
copyIcon.addEventListener('click', () => {
  navigator.clipboard.writeText(transcription.innerText)
    .then(() => alert('Текст скопирован в буфер обмена!'))
    .catch(err => alert('Ошибка копирования текста: ' + err));
});
