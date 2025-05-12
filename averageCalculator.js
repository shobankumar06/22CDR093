const express = require('express');
const axios = require('axios');

const app = express();
const PORT = 9876;
const WINDOW_SIZE = 10;
const API_BASE = 'http://20.244.56.144/evaluation-service';

const windowQueue = []; 
const numberSet = new Set();

const numberTypeMap = {
  p: 'primes',
  f: 'fibo',
  e: 'even',
  r: 'rand'
};

function calculateAverage(arr) {
  if (arr.length === 0) return 0;
  const sum = arr.reduce((acc, num) => acc + num, 0);
  return parseFloat((sum / arr.length).toFixed(2));
}

app.get('/numbers/:numberid', async (req, res) => {
  const { numberid } = req.params;
  const apiPath = numberTypeMap[numberid];

  if (!apiPath) {
    return res.status(400).json({ error: 'Invalid number ID. Use p, f, e, or r.' });
  }

  const url = `${API_BASE}/${apiPath}`;
  const windowPrevState = [...windowQueue];

  let fetchedNumbers = [];

  try {
    const response = await Promise.race([
      axios.get(url),
      new Promise((_, reject) => setTimeout(() => reject(new Error('Timeout')), 500))
    ]);

    fetchedNumbers = response.data.numbers || [];
  } catch (error) {
    return res.json({
      windowPrevState,
      windowCurrState: windowQueue,
      numbers: [],
      avg: calculateAverage(windowQueue)
    });
  }

  const newUniqueNumbers = [];
  for (const num of fetchedNumbers) {
    if (!numberSet.has(num)) {
      newUniqueNumbers.push(num);
    }
  }

  for (const num of newUniqueNumbers) {
    if (windowQueue.length >= WINDOW_SIZE) {
      const removed = windowQueue.shift();
      numberSet.delete(removed);
    }
    windowQueue.push(num);
    numberSet.add(num);
  }

  const windowCurrState = [...windowQueue];
  const avg = calculateAverage(windowQueue);

  res.json({
    windowPrevState,
    windowCurrState,
    numbers: fetchedNumbers,
    avg
  });
});

app.listen(PORT, () => {
  console.log(`Average Calculator Microservice running at http://localhost:${PORT}`);
});
