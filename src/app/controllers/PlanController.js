import * as Yup from 'yup';
import { Op } from 'sequelize';

import Plans from '../models/Plan';

class PlanController {
  async index(req, res) {
    const { id } = req.params;

    const plan = await Plans.findByPk(id);

    if (!plan) return res.status(400).json({ error: 'Invalid plan id' });

    return res.json(plan);
  }

  async show(req, res) {
    const { page = 1, title = '' } = req.query;

    const data = await Plans.findAndCountAll({
      where: { title: { [Op.iLike]: `%${title}%` } },
      order: ['duration'],
      limit: 10,
      offset: (page - 1) * 10,
    });

    return res.json({
      plans: data.rows,
      page,
      last_page: Math.ceil(data.count / 10),
    });
  }

  async store(req, res) {
    const schema = Yup.object().shape({
      title: Yup.string().required(),
      duration: Yup.number().required(),
      price: Yup.number().required(),
    });

    if (!(await schema.isValid(req.body))) {
      return res.status(400).json({ error: 'Validation failed' });
    }

    const planExists = await Plans.findOne({
      where: { title: req.body.title },
    });

    if (planExists) {
      return res.status(400).json({ error: 'This plan already exists.' });
    }

    const { id, title, duration, price } = await Plans.create(req.body);

    return res.json({
      id,
      title,
      duration,
      price,
    });
  }

  async update(req, res) {
    const schema = Yup.object().shape({
      id: Yup.number().required(),
      title: Yup.string(),
      duration: Yup.number().positive(),
      price: Yup.number().positive(),
    });

    if (!(await schema.isValid(req.body))) {
      return res.status(400).json({ error: 'Validation failed' });
    }

    const plan = await Plans.findByPk(req.body.id);

    if (!plan) return res.status(400).json({ error: 'Invalid plan id' });

    const { title } = req.body;

    if (title !== plan.title) {
      const planExists = await Plans.findOne({ where: { title } });

      if (planExists) {
        return res
          .status(400)
          .json({ error: 'This plan is already registered.' });
      }
    }
    await plan.update(req.body);

    const { id, duration, price } = req.body;

    return res.json({ id, title, duration, price });
  }

  async delete(req, res) {
    const { id } = req.params;
    const plan = await Plans.findByPk(id);

    if (!plan) return res.status(400).json({ error: 'Plan not found' });

    await Plans.destroy({ where: { id } });
    return res.json({ msg: 'The plan was successfully removed' });
  }
}
export default new PlanController();
