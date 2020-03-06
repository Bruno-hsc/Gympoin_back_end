import * as Yup from 'yup';

import HelpOrder from '../models/HelpOrder';
import Student from '../models/Student';

// import Queue from '../../lib/Queue';

class HelpOrderController {
  async index(req, res) {
    const { student_id } = req.params;

    const helpOrders = await HelpOrder.findAll({ where: { student_id } });

    return res.json(helpOrders);
  }

  async show(req, res) {
    const helpOrders = await HelpOrder.findAll({
      where: { answered_at: null },
    });

    return res.json(helpOrders);
  }

  async store(req, res) {
    const schema = Yup.object().shape({
      question: Yup.string().required(),
    });

    if (!(await schema.isValid(req.body))) {
      return res.status(400).json({ error: 'Validation failed' });
    }

    const { id } = req.params;
    const { question } = req.body;

    const student = await Student.findByPk(id);

    if (!student) return res.status(400).json({ error: 'Invalid student id' });

    const helpOrder = await HelpOrder.create({ student_id: id, question });

    return res.json(helpOrder);
  }
}

export default new HelpOrderController();
