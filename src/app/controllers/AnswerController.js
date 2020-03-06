import * as Yup from 'yup';

import HelpOrder from '../models/HelpOrder';
import Student from '../models/Student';

import AnswerMail from '../jobs/AnswerMail';
import Queue from '../../lib/Queue';

class AnswerController {
  async store(req, res) {
    const schema = Yup.object().shape({
      answer: Yup.string().required(),
    });

    if (!(await schema.isValid(req.body))) {
      return res.status(400).json({ error: 'Validation failed' });
    }

    const { helpOrder_id } = req.params;

    const helpOrder = await HelpOrder.findByPk(helpOrder_id, {
      include: [
        {
          model: Student,
          as: 'student',
          attributes: ['name', 'email'],
        },
      ],
    });

    if (!helpOrder) {
      return res.status(400).json({ error: 'Invalid help order' });
    }

    if (helpOrder.answered_at !== null) {
      return res
        .status(400)
        .json({ error: 'This help order has already been answered' });
    }

    await helpOrder.update({
      answer: req.body.answer,
      answered_at: new Date(),
    });

    await Queue.add(AnswerMail.key, { helpOrder });

    return res.json(helpOrder);
  }
}

export default new AnswerController();
