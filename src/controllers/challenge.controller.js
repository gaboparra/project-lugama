import * as challengeService from "../services/challenge.service.js";

export const createChallenge = async (req, res) => {
  try {
    const { genre, difficulty, artist, maxPlayers } = req.body;
    const result = await challengeService.createChallenge({
      userId: req.user.id,
      genre: genre || null,
      difficulty: difficulty ? parseInt(difficulty) : null,
      artist: artist || null,
      maxPlayers: maxPlayers ? parseInt(maxPlayers) : null,
    });
    res.status(201).json(result);
  } catch (error) {
    res.status(error.status || 500).json({ error: error.message });
  }
};

export const joinChallenge = async (req, res) => {
  try {
    const result = await challengeService.joinChallenge(
      req.params.code,
      req.user.id,
    );
    res.json(result);
  } catch (error) {
    res.status(error.status || 500).json({ error: error.message });
  }
};

export const getChallenge = async (req, res) => {
  try {
    const result = await challengeService.getChallenge(
      req.params.code,
      req.user.id,
    );
    res.json(result);
  } catch (error) {
    res.status(error.status || 500).json({ error: error.message });
  }
};

export const validateChallengeAnswer = async (req, res) => {
  try {
    const result = await challengeService.validateChallengeAnswer({
      code: req.params.code,
      answer: req.body.answer,
      attempt: req.body.attempt,
      userId: req.user.id,
    });
    res.json(result);
  } catch (error) {
    res.status(error.status || 500).json({ error: error.message });
  }
};

export const getChallengeResults = async (req, res) => {
  try {
    const result = await challengeService.getChallengeResults(req.params.code);
    res.json(result);
  } catch (error) {
    res.status(error.status || 500).json({ error: error.message });
  }
};
