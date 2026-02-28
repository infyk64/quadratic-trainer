import { Router } from "express";
import { authenticate } from "../middleware/authMiddleware";
import { checkAnswer, checkEquationAnswer } from "../services/answerChecker";

const router = Router();

router.post("/check-open", authenticate, (req, res) => {
  try {
    const { answer, answerMask, answerType, equation } = req.body;

    if (!answer && answer !== "") {
      return res.status(400).json({ error: "Ответ не передан" });
    }

    let result;

    if (equation) {
      const { a, b, c } = equation;
      result = checkEquationAnswer(a, b, c, answer);
    } else if (answerMask) {
      result = checkAnswer(answer, answerMask, answerType || "exact");
    } else {
      return res.status(400).json({ error: "Не передана маска ответа или уравнение" });
    }

    res.json(result);
  } catch (err) {
    console.error("Ошибка проверки ответа:", err);
    res.status(500).json({ error: "Ошибка проверки" });
  }
});

export default router;