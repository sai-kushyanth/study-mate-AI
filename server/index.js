const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '.env') });

console.log('Loaded Cohere API Key:', process.env.COHERE_API_KEY ? 'Yes' : 'No');

const express = require('express');
const cors = require('cors');
const multer = require('multer');
const fs = require('fs');
const pdfParse = require('pdf-parse');
const { CohereClient } = require('cohere-ai');

const cohere = new CohereClient({
  token: process.env.COHERE_API_KEY,
});

const app = express();
const PORT = 5001;

app.use(cors({
  origin: ["http://localhost:3000", "http://localhost:3001"]
}));
app.use(express.json());

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/');
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + '-' + file.originalname);
  }
});
const upload = multer({ storage: storage });

app.post('/upload', upload.single('file'), async (req, res) => {
  console.log('Received upload request');
  if (!req.file) {
    return res.status(400).json({ message: 'No file uploaded.' });
  }
  try {
    const filePath = req.file.path;
    const dataBuffer = fs.readFileSync(filePath);
    const data = await pdfParse(dataBuffer);
    const extractedText = data.text || '';
    const preview = extractedText.slice(0, 1000);

    if (!preview.trim()) {
      return res.status(400).json({ message: 'No extractable text found in PDF.' });
    }

    const prompt = `Summarize the following into clear study notes and generate 5 flashcards in Q&A format:\n\n${preview}`;
    console.log('Prompt sent to Cohere:', prompt);

    try {
      const cohereResponse = await cohere.generate({
        model: "command",
        prompt: prompt,
        max_tokens: 800,
        temperature: 0.7,
      });
      console.log('Cohere response:', cohereResponse);

      const aiContent = cohereResponse.generations[0].text;

      res.json({
        message: 'File uploaded and AI summary/flashcards generated!',
        summary: aiContent,
        flashcards: aiContent,
        textPreview: preview,
        fullTextLength: extractedText.length
      });
    } catch (err) {
      console.error('Cohere error:', err);
      res.status(500).json({ message: 'Failed to process PDF or generate AI summary.', error: err.message });
    }
  } catch (err) {
    console.error('Error:', err);
    res.status(500).json({ message: 'Failed to process PDF or generate AI summary.', error: err.message });
  }
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
