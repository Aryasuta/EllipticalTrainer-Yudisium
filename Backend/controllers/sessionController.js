const UserModel = require('../models/User');
const SessionModel = require('../models/Session');
const { clearActiveCard, getActiveCardId } = require('./scanController');

const wheelCircumference = 1.56; // meter
const MET = 6.8;

// START SESSION
const startSession = async (req, res) => {
  const { cardId } = req.body;
  if (!cardId) return res.status(400).json({ message: 'cardId is required' });

  try {
    const user = await UserModel.findUserByCardId(cardId);
    if (!user) return res.status(404).json({ message: 'User not found' });

    const db = require('../config/db').getDB();

    // 🔒 Cek apakah masih ada sesi aktif
    const [existingSessions] = await db.query(
      'SELECT * FROM sessions WHERE userId = ? AND endTime IS NULL',
      [user.id]
    );

    if (existingSessions.length > 0) {
      return res.status(400).json({
        message: 'Sesi sebelumnya belum selesai.',
        sessionId: existingSessions[0].id,
        startTime: existingSessions[0].startTime
      });
    }

    const dateNow = new Date();
    const sessionId = await SessionModel.createSession(user.id, dateNow);

    return res.status(201).json({
      message: 'Session started',
      sessionId,
      startTime: dateNow
    });
  } catch (err) {
    console.error('❌ Error in startSession:', err);
    return res.status(500).json({ message: 'Server error' });
  }
};

// END SESSION
const endSession = async (req, res) => {
  const { cardId, tickCount } = req.body;

  if (!cardId || tickCount === undefined) {
    return res.status(400).json({ message: 'cardId and tickCount are required' });
  }

  const activeCard = getActiveCardId();
  if (!activeCard || activeCard !== cardId) {
    return res.status(403).json({ message: 'Unauthorized card. Only session owner can end the session.' });
  }

  try {
    const user = await UserModel.findUserByCardId(cardId);
    if (!user) return res.status(404).json({ message: 'User not found' });

    const db = require('../config/db').getDB();
    const [sessions] = await db.query(
      `SELECT * FROM sessions WHERE userId = ? AND endTime IS NULL ORDER BY startTime DESC LIMIT 1`,
      [user.id]
    );

    const session = sessions[0];
    if (!session) return res.status(404).json({ message: 'No active session found' });

    const endTime = new Date();
    const durationMs = endTime - new Date(session.startTime);
    const durationHours = durationMs / (1000 * 60 * 60);

    const distance = (tickCount * wheelCircumference).toFixed(1);
    const weight = user.weight || 60;
    const calories = (MET * weight * durationHours * (user.gender == 1 ? 1.2 : 1.0)).toFixed(1);
    const avgSpeed = ((distance / durationMs) * 1000 * 3.6).toFixed(1);

    // ✅ Tambahkan avgSpeed di sini
    await SessionModel.endSession(
      session.id,
      endTime,
      'done',
      tickCount,
      distance,
      calories,
      avgSpeed
    );

    clearActiveCard();

    return res.status(200).json({
      message: 'Session ended',
      sessionId: session.id,
      tickCount,
      distance,
      calories,
      avgSpeed,
      startTime: session.startTime,
      endTime
    });
  } catch (err) {
    console.error('❌ Error in endSession:', err);
    return res.status(500).json({ message: 'Internal server error' });
  }
};

// CHECK USER EXISTENCE
const checkUserExistence = async (req, res) => {
  try {
    const { cardId } = req.body;
    if (!cardId) return res.status(400).json({ message: 'cardId is required' });

    const user = await UserModel.findUserByCardId(cardId);
    return res.json({ userExists: !!user });
  } catch (err) {
    console.error('❌ Error in checkUserExistence:', err);
    return res.status(500).json({ message: 'Server error' });
  }
};

// GET LATEST ACTIVE SESSION
const getLatestActiveSession = async (req, res) => {
  try {
    const db = require('../config/db').getDB();
    const [sessions] = await db.query(
      'SELECT * FROM sessions WHERE endTime IS NULL ORDER BY startTime DESC LIMIT 1'
    );

    const latest = sessions[0];
    if (!latest) return res.status(404).json({ message: 'No active session found' });

    const user = await UserModel.findUserById(latest.userId);
    if (!user) return res.status(404).json({ message: 'User not found for session' });

    res.json({
      cardId: user.cardId,
      userExists: true,
      startTime: latest.startTime
    });
  } catch (err) {
    console.error('❌ Error in getLatestActiveSession:', err);
    return res.status(500).json({ message: 'Server error' });
  }
};

// GET SESSION HISTORY
const getSessionHistory = async (req, res) => {
  const { cardId } = req.params;
  if (!cardId) return res.status(400).json({ message: 'cardId is required' });

  try {
    const user = await UserModel.findUserByCardId(cardId);
    if (!user) return res.status(404).json({ message: 'User not found' });

    const db = require('../config/db').getDB();
    const [sessions] = await db.query(
      'SELECT * FROM sessions WHERE userId = ? ORDER BY startTime DESC',
      [user.id]
    );

    return res.json({ cardId, totalSessions: sessions.length, sessions });
  } catch (err) {
    console.error('❌ Error in getSessionHistory:', err);
    return res.status(500).json({ message: 'Internal server error' });
  }
};

// GET LATEST COMPLETED SESSION
const getLatestSession = async (req, res) => {
  const { cardId } = req.params;
  if (!cardId) return res.status(400).json({ message: 'cardId is required' });

  try {
    const user = await UserModel.findUserByCardId(cardId);
    if (!user) return res.status(404).json({ message: 'User not found' });

    const db = require('../config/db').getDB();
    const [sessions] = await db.query(
      'SELECT * FROM sessions WHERE userId = ? AND endTime IS NOT NULL ORDER BY startTime DESC LIMIT 1',
      [user.id]
    );

    const session = sessions[0];
    if (!session) return res.status(404).json({ message: 'No completed session found' });

    return res.status(200).json(session);
  } catch (err) {
    console.error('❌ Error in getLatestSession:', err);
    return res.status(500).json({ message: 'Internal server error' });
  }
};

module.exports = {
  startSession,
  endSession,
  checkUserExistence,
  getLatestActiveSession,
  getSessionHistory,
  getLatestSession
};
