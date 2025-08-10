let latestScannedCard = null;
let cardUsedOnce = false;
let activeSessionCardId = null; // ✅ Track active session card

const saveScannedCard = (req, res) => {
  const { cardId } = req.body;
  if (!cardId) return res.status(400).json({ message: "cardId is required" });

  // Prevent different card while session active
  if (activeSessionCardId && cardId !== activeSessionCardId) {
    return res.status(409).json({ message: "Another card is currently in use" });
  }

  latestScannedCard = cardId;
  cardUsedOnce = false;

  if (!activeSessionCardId) {
    activeSessionCardId = cardId;
  }

  res.json({ message: "Card ID received", cardId });
};

const getLatestScannedCard = (req, res) => {
  if (!latestScannedCard || cardUsedOnce) {
    return res.status(404).json({ message: "No card scanned yet" });
  }
  cardUsedOnce = true;
  res.json({ cardId: latestScannedCard });
};

const clearScannedCard = () => {
  latestScannedCard = null;
  cardUsedOnce = false;
};

const clearActiveCard = () => {
  activeSessionCardId = null;
};

const getActiveCardId = () => activeSessionCardId; // ✅ Tambahan

module.exports = {
  saveScannedCard,
  getLatestScannedCard,
  clearScannedCard,
  clearActiveCard,
  getActiveCardId
};
