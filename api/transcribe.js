import multer from 'multer';
import nextConnect from 'next-connect';
import fetch from 'node-fetch';

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

    const { upload_url } = await uploadRes.json();

    // Start transcription
    const transcriptRes = await fetch('https://api.assemblyai.com/v2/transcript', {
      method: 'POST',
      headers: {
        authorization: API_KEY,
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        audio_url: upload_url,
        language_code: 'ru',
      }),
    });

    const { id } = await transcriptRes.json();

    // Polling
    let completed = false;
    let text = '';

    while (!completed) {
      await new Promise(r => setTimeout(r, 3000));

      const pollRes = await fetch(`https://api.assemblyai.com/v2/transcript/${id}`, {
        headers: {
          authorization: API_KEY,
        },
      });

      const pollData = await pollRes.json();
      if (pollData.status === 'completed') {
        completed = true;
        text = pollData.text;
      } else if (pollData.status === 'error') {
        completed = true;
        text = 'Ошибка при транскрибации';
      }
    }

    res.status(200).json({ text });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Ошибка на сервере' });
  }
});

export const config = {
  api: {
    bodyParser: false,
  },
};

export default handler;
