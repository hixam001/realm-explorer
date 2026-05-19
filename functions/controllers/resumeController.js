const firestoreService = require('../services/firestoreService');

async function getState(req, res, next) {
  try {
    const { runId } = req.params;
    const { playerId } = req.query;

    if (!runId) {
      return res.status(400).json({ success: false, error: 'Missing required param: runId' });
    }

    const runState = await firestoreService.getRunState(runId, playerId || null);

    if (!runState) {
      return res.status(404).json({ success: false, error: 'Run not found' });
    }

    return res.status(200).json({ success: true, data: { run: runState } });
  } catch (err) {
    next(err);
  }
}

module.exports = { getState };
