const { createUser, findUserByCardId, updateUserWeight } = require('../models/User');

exports.createUser = async (req, res) => {
  const { cardId, name, weight, gender } = req.body;

  if (!cardId || !name || !weight || !gender) {
    return res.status(400).json({ message: 'cardId, name, weight, and gender are required' });
  }

  if (gender !== "1" && gender !== "2") {
    return res.status(400).json({ message: 'Gender must be 1 (male) or 2 (female)' });
  }

  try {
    const existingUser = await findUserByCardId(cardId);
    if (existingUser) {
      return res.status(409).json({ message: 'cardId already exists' });
    }

    const userId = await createUser(cardId.trim(), name.trim(), weight, gender);

    return res.status(201).json({
      message: 'User created successfully',
      userId,
      cardId,
      name,
      weight,
      gender
    });
  } catch (err) {
    console.error('❌ Error creating user:', err);
    return res.status(500).json({ message: 'Internal server error' });
  }
};

exports.getUserByCardId = async (req, res) => {
  const { cardId } = req.params;

  try {
    const user = await findUserByCardId(cardId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.status(200).json(user);
  } catch (err) {
    console.error('❌ Error fetching user:', err);
    return res.status(500).json({ message: 'Internal server error' });
  }
};

exports.updateWeight = async (req, res) => {
  const { weight } = req.body;
  const { cardId } = req.params;

  if (!weight || isNaN(weight) || weight <= 0) {
    return res.status(400).json({ message: 'Invalid weight value' });
  }

  try {
    const user = await findUserByCardId(cardId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    await updateUserWeight(cardId, weight);

    return res.json({ message: 'Weight updated successfully', newWeight: weight });
  } catch (err) {
    console.error('❌ Error updating weight:', err);
    return res.status(500).json({ message: 'Internal server error' });
  }
};
