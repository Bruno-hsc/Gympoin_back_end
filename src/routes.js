import { Router } from 'express';

import SessionController from './app/controllers/SessionController';
import StudentController from './app/controllers/StudentController';
import PlanController from './app/controllers/PlanController';
import EnrollmentController from './app/controllers/EnrollmentController';
import CheckinController from './app/controllers/CheckinController';
import HelpOrderController from './app/controllers/HelpOrderController';
import AnswerController from './app/controllers/AnswerController';

import authMiddleware from './app/middlewares/auth';

const routes = new Router();

routes.post('/sessions', SessionController.store);

routes.post('/students/:id/checkins', CheckinController.store);
routes.get('/students/:id/checkins', CheckinController.show);

routes.post('/students/:id/help-orders', HelpOrderController.store);

routes.use(authMiddleware);

routes.get('/students/:student_id/help-orders', HelpOrderController.index);
routes.get('/students/help-orders', HelpOrderController.show);
routes.post(
  '/students/help-orders/:helpOrder_id/answer',
  AnswerController.store
);

routes.get('/students/:id', StudentController.index);
routes.get('/students', StudentController.show);
routes.post('/students', StudentController.store);
routes.put('/students/update/:id', StudentController.update);
routes.delete('/students/:id', StudentController.delete);

routes.get('/plans/:id', PlanController.index);
routes.get('/plans', PlanController.show);
routes.post('/plans', PlanController.store);
routes.put('/plans', PlanController.update);
routes.delete('/plans/:id', PlanController.delete);

routes.get('/enrollments/:id', EnrollmentController.index);
routes.get('/enrollments', EnrollmentController.show);
routes.post('/enrollments', EnrollmentController.store);
routes.put('/enrollments', EnrollmentController.update);
routes.delete('/enrollments/:id', EnrollmentController.delete);

export default routes;
