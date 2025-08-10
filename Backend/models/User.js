const { getDB } = require('../config/db');

const createUser = async (cardId, name, weight, gender) => {
  const db = getDB();
  const [result] = await db.query(
    'INSERT INTO users (cardId, name, weight, gender) VALUES (?, ?, ?, ?)',
    [cardId, name, weight, gender]
  );
  return result.insertId;
};

const findUserByCardId = async (cardId) => {
  const db = getDB();
  const [rows] = await db.query(
    'SELECT * FROM users WHERE cardId = ?',
    [cardId]
  );
  return rows[0];
};

const updateUserWeight = async (cardId, weight) => {
  const db = getDB();
  const [result] = await db.query(
    'UPDATE users SET weight = ? WHERE cardId = ?',
    [weight, cardId]
  );
  return result.affectedRows;
};

const findUserById = async (id) => {
  const db = getDB();
  const [rows] = await db.query('SELECT * FROM users WHERE id = ?', [id]);
  return rows[0];
};

module.exports = { createUser, findUserByCardId, updateUserWeight, findUserById };
