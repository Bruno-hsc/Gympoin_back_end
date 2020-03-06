import * as Yup from 'yup';
import { isBefore, parseISO, addMonths } from 'date-fns';

import Enrollment from '../models/Enrollment';
import Student from '../models/Student';
import Plan from '../models/Plan';

import Queue from '../../lib/Queue';
import EnrollmentMail from '../jobs/EnrollmentMail';

class EnrollmentController {
  async index(req, res) {
    const enrollment = await Enrollment.findOne({
      where: { id: req.params.id },
      attributes: [
        'id',
        'start_date',
        'end_date',
        'price',
        'active',
        'canceled_at',
      ],
      include: [
        {
          model: Student,
          as: 'student',
          attributes: ['id', 'name'],
        },
        {
          model: Plan,
          as: 'plan',
          attributes: ['id', 'title'],
        },
      ],
    });

    return res.json(enrollment);
  }

  async show(req, res) {
    const enrollments = await Enrollment.findAll({
      attributes: [
        'id',
        'start_date',
        'end_date',
        'price',
        'active',
        'canceled_at',
      ],
      order: [['id', 'ASC']],
      include: [
        {
          model: Student,
          as: 'student',
          attributes: ['id', 'name'],
        },
        {
          model: Plan,
          as: 'plan',
          attributes: ['id', 'title'],
        },
      ],
    });

    return res.json(enrollments);
  }

  async store(req, res) {
    const schema = Yup.object().shape({
      student_id: Yup.number().required(),
      plan_id: Yup.number().required(),
      start_date: Yup.date().required(),
    });

    if (!(await schema.isValid(req.body))) {
      return res.status(400).json({ error: 'Validation failed' });
    }

    const { student_id, plan_id, start_date } = req.body;

    const validStudent = await Student.findByPk(student_id);

    if (!validStudent) {
      return res.json({ error: 'This student does not exist' });
    }

    const enrolledStudent = await Enrollment.findOne({ where: { student_id } });

    if (enrolledStudent) {
      return res.json({ error: 'This studentis alredy enrolled' });
    }

    const plan = await Plan.findByPk(plan_id);

    if (!plan) {
      return res.json({ error: 'This plan does not exist' });
    }

    const formattedDate = parseISO(start_date);

    if (isBefore(formattedDate, new Date()))
      return res.status(400).json({ error: 'Invalid date' });

    const end_date = addMonths(formattedDate, plan.duration);
    const price = plan.price * plan.duration;

    const enrollment = await Enrollment.create({
      student_id,
      plan_id,
      start_date,
      end_date,
      price,
    });

    const createdEnrollment = await Enrollment.findByPk(enrollment.id, {
      include: [
        {
          model: Student,
          as: 'student',
          attributes: ['name', 'email'],
        },
        {
          model: Plan,
          as: 'plan',
          attributes: ['title', 'duration'],
        },
      ],
    });

    await Queue.add(EnrollmentMail.key, { createdEnrollment });

    return res.json(enrollment);
  }

  async update(req, res) {
    const schema = Yup.object().shape({
      id: Yup.number().required(),
      student_id: Yup.number().required(),
      plan_id: Yup.number().required(),
      start_date: Yup.date().required(),
    });

    if (!(await schema.isValid(req.body))) {
      return res.status(400).json({ error: 'Validation failed' });
    }

    const { id, student_id, plan_id, start_date } = req.body;

    const enrollment = await Enrollment.findByPk(id);

    if (!enrollment) {
      return res.json({ error: 'This enrollment does not exist' });
    }

    const plan = await Plan.findByPk(plan_id);

    if (!plan) {
      return res.json({ error: 'This plan does not exist' });
    }

    const student = await Student.findByPk(student_id);

    if (!student) return res.status(400).json({ error: 'Invalid student id' });

    const formattedDate = parseISO(start_date);

    if (isBefore(formattedDate, new Date()))
      return res.status(400).json({ error: 'Invalid date' });

    const end_date = addMonths(formattedDate, plan.duration);
    const price = plan.price * plan.duration;

    return res.json(
      await enrollment.update({
        student_id,
        plan_id,
        start_date,
        end_date,
        price,
      })
    );
  }

  async delete(req, res) {
    const enrollment = await Enrollment.findByPk(req.params.id);

    if (!enrollment) return res.status(400).json({ error: 'Invalid id' });

    enrollment.canceled_at = new Date();

    await enrollment.save();

    return res.json(enrollment);
  }
}

export default new EnrollmentController();
