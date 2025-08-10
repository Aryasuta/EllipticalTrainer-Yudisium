const { getDB } = require('../config/db');

const createSession = async (userId, startTime) => {
  const db = getDB();
  const [result] = await db.query(
    'INSERT INTO sessions (userId, startTime) VALUES (?, ?)',
    [userId, startTime]
  );
  return result.insertId;
};

const endSession = async (sessionId, endTime, status, tickCount, distance, calories, avgSpeed) => {
  const db = getDB();
  await db.query(
    `UPDATE sessions
    SET endTime = ?, status = ?, tickCount = ?, distance = ?, calories = ?, avgSpeed = ?
    WHERE id = ?`,
    [endTime, status, tickCount, distance, calories, avgSpeed, sessionId]
  );
};

module.exports = { createSession, endSession };
