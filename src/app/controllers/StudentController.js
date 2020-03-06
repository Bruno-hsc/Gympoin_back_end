import * as Yup from 'yup';

import { Op } from 'sequelize';
import Student from '../models/Student';

class StudentController {
  async index(req, res) {
    const { id } = req.params;

    const student = await Student.findByPk(id);

    if (!student) return res.status(400).json({ error: 'Invalid student id' });

    return res.json(student);
  }

  async show(req, res) {
    const { page = 1, name = '' } = req.query;

    const data = await Student.findAndCountAll({
      where: { name: { [Op.iLike]: `%${name}%` } },
      order: ['name'],
      limit: 10,
      offset: (page - 1) * 10,
    });

    return res.json({
      students: data.rows,
      page,
      last_page: Math.ceil(data.count / 10),
    });
  }

  async store(req, res) {
    const schema = Yup.object().shape({
      name: Yup.string().required(),
      email: Yup.string()
        .email()
        .required(),
      age: Yup.number()
        .required()
        .positive(),
      weight: Yup.number()
        .required()
        .positive(),
      height: Yup.number()
        .required()
        .positive(),
    });

    if (!(await schema.isValid(req.body))) {
      return res.status(400).json({ error: 'Validation failed' });
    }

    const studentExists = await Student.findOne({
      where: { email: req.body.email },
    });

    if (studentExists) {
      return res.status(400).json({ error: 'Student already exists.' });
    }

    const { id, name, email, age, weight, height } = await Student.create(
      req.body
    );

    return res.json({
      id,
      name,
      email,
      age,
      weight,
      height,
    });
  }

  async update(req, res) {
    const schema = Yup.object().shape({
      name: Yup.string(),
      email: Yup.string().email(),
      age: Yup.number().positive(),
      weight: Yup.number().positive(),
      height: Yup.number().positive(),
    });

    if (!(await schema.isValid(req.body))) {
      return res.status(400).json({ error: 'Validation failed' });
    }

    const { id } = req.params;
    const { email } = req.body;

    const student = await Student.findByPk(id);

    if (!student) return res.status(400).json({ error: 'Invalid student id' });

    if (email !== student.email) {
      const studentExists = await Student.findOne({ where: { email } });

      if (studentExists) {
        return res
          .status(400)
          .json({ error: 'This email is already registered.' });
      }
    }
    await student.update(req.body);

    const { name, age, weight, height } = req.body;

    return res.json({ id, name, email, age, weight, height });
  }

  async delete(req, res) {
    const { id } = req.params;
    const student = await Student.findByPk(id);

    if (!student) return res.status(400).json({ error: 'Student not found' });

    await Student.destroy({ where: { id } });
    return res.json({ msg: 'The student was successfully removed' });
  }
}

export default new StudentController();

/*
 async show(req, res) {
    const { name } = req.query;

    if (name) {
      const student = await Student.findAll({
        where: { name: { [Op.iLike]: `%${name}%` } },
      });

      return res.json(student);
    }
    const students = await Student.findAll();

    return res.json(students);
  }
  */
