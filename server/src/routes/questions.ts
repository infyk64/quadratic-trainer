import { Router } from 'express';
import { generateQuestion } from '../services/equationService';


const router = Router();

router.get('/generate', (req, res) => {
  const mode = (req.query.mode as 'full' | 'incomplete' | 'random') || 'random';
  const question = generateQuestion(mode);
  res.json(question);
});

export default router;