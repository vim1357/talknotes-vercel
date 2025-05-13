const nextConnect = require('next-connect');
const multer = require('multer');
const fetch = require('node-fetch');

const upload = multer();
const API_KEY = process.env.ASSEMBLYAI_API_KEY;

const handler = nextConnect();

handler.use(upload.single('audio'));

handler.post(async (req, res) => {
  try {
    const buffer = req.file.buffer;

    // Upload to AssemblyAI
    const uploadRes = await fetch('https://api.assemblyai.com/v2/upload', {
      method: 'POST',
      headers: {
        authorization: API_KEY,
      },
      body: buffer,
    });

    const uploadData = await uploadRes.json();
    const audioUrl = uploadData.upload_url;

    // Start transcription
    const transcriptRes = await fetch('https://api.assemblyai.com/v2/transcript', {
      method: 'POST',
      headers: {
        authorization: API_KEY,
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        audio_url: audioUrl,
        language_code: 'ru',
      }),
    });

    const transcriptData = await transcriptRes.json();
    const transcriptId = transcriptData.id;

    // Polling
    let completed = false;
    let text = '';

    while (!completed) {
      await new Promise(r => setTimeout(r, 3000));

      const pollingRes = await fetch(`https://api.assemblyai.com/v2/transcript/${transcriptId}`, {
        headers: {
          authorization: API_KEY,
        }
      });

      const pollingData = await pollingRes.json();
      if (pollingData.status === 'completed') {
        completed = true;
        text = pollingData.text;
      } else if (pollingData.status === 'error') {
        completed = true;
        text = 'Ошибка при транскрибации';
      }
    }

    res.status(200).json({ text });
  } catch (err) {
    console.error('[Transcription error]', err);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

module.exports = handler;

module.exports.config = {
  api: {
    bodyParser: false,
  },
};
