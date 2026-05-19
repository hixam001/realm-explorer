const { GoogleGenAI } = require('@google/genai');
const { buildDmPrompt } = require('../prompts/dm-prompt');
const { buildRivalPrompt } = require('../prompts/rival-prompt');
const { buildLootPrompt } = require('../prompts/loot-prompt');
const { buildRecapPrompt } = require('../prompts/recap-prompt');

const REQUIRED_FIELDS = {
  dm: ['encounterTitle', 'narrativeText', 'enemyName', 'enemyType', 'availableActions', 'difficultyWeight', 'dmReasoning'],
  rival: ['outcomeText', 'playerHpDelta', 'enemyHpDelta', 'combatOver', 'playerWon', 'winQuality', 'rivalReasoning'],
  loot: ['itemName', 'itemEffect', 'styleNote', 'flavorText', 'itemType'],
  recap: ['narrativeText', 'runTitle']
};

function sanitise(value, maxLen) {
  if (typeof value !== 'string') return value;
  return value.replace(/[<>{}]/g, '').slice(0, maxLen);
}

function sanitiseParams(params) {
  return {
    ...params,
    playerAction: sanitise(params.playerAction, 200),
    eventLog: Array.isArray(params.eventLog)
      ? params.eventLog.map((e) => sanitise(e, 150)).slice(0, 20)
      : [],
    actionHistory: Array.isArray(params.actionHistory)
      ? params.actionHistory.map((a) => sanitise(a, 50)).slice(0, 30)
      : []
  };
}

function getClient() {
  const key = process.env.GEMINI_API_KEY;

  if (!key || key === 'YOUR_KEY_HERE' || key === 'your_gemini_api_key_here') {
    throw new Error(
      'GEMINI_API_KEY is not set. ' +
      'Open functions/.env and replace YOUR_KEY_HERE with your key from https://aistudio.google.com/app/apikey'
    );
  }

  return new GoogleGenAI({ apiKey: key });
}

function parseGeminiResponse(text) {
  const cleaned = text.replace(/```json|```/g, '').trim();
  return JSON.parse(cleaned);
}

function validateSchema(parsed, agentKey) {
  const required = REQUIRED_FIELDS[agentKey];
  for (const field of required) {
    if (parsed[field] === undefined || parsed[field] === null) {
      throw new Error(`Gemini ${agentKey} response missing field: ${field}`);
    }
  }
  return parsed;
}

const MODEL = 'gemini-2.5-flash-lite';

async function generate(prompt) {
  const ai = getClient();
  const call = () => ai.models.generateContent({ model: MODEL, contents: prompt });

  let lastErr;
  for (let attempt = 1; attempt <= 3; attempt++) {
    try {
      const response = await call();
      const text = response.text;
      if (!text) throw new Error('Empty response from Gemini');
      return text;
    } catch (e) {
      lastErr = e;
      if (e.message && e.message.includes('503') && attempt < 3) {
        console.log(`[Gemini] 503 on attempt ${attempt}, retrying in 5s...`);
        await new Promise(r => setTimeout(r, 5000));
      } else {
        throw e;
      }
    }
  }
  throw lastErr;
}

async function callDm(params) {
  const prompt = buildDmPrompt(sanitiseParams(params));
  const text = await generate(prompt);
  return validateSchema(parseGeminiResponse(text), 'dm');
}

async function callRival(params) {
  const prompt = buildRivalPrompt(sanitiseParams(params));
  const text = await generate(prompt);
  return validateSchema(parseGeminiResponse(text), 'rival');
}

async function callLoot(params) {
  const prompt = buildLootPrompt(sanitiseParams(params));
  const text = await generate(prompt);
  return validateSchema(parseGeminiResponse(text), 'loot');
}

async function callRecap(params) {
  const prompt = buildRecapPrompt(sanitiseParams(params));
  const text = await generate(prompt);
  return validateSchema(parseGeminiResponse(text), 'recap');
}

module.exports = { callDm, callRival, callLoot, callRecap };
