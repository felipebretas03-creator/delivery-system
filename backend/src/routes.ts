import { Router } from 'express';
import { login, registerMotoboy } from './controllers/AuthController';
import { createOrder, getOrders, getMotoboyOrders, assignOrder, updateOrderStatus } from './controllers/OrderController';
import { getActiveMotoboys, updateMotoboyStatus, getDashboardMetrics } from './controllers/MotoboyController';
import { authMiddleware } from './middlewares/auth';

const router = Router();

// Auth
router.post('/auth/login', login);
router.post('/auth/register', authMiddleware, registerMotoboy); // Protegido apenas para Admin

// Orders
router.post('/orders', authMiddleware, createOrder);
router.get('/orders', authMiddleware, getOrders);
router.get('/motoboy/orders', authMiddleware, getMotoboyOrders);
router.post('/orders/assign', authMiddleware, assignOrder);
router.put('/orders/:id/status', authMiddleware, updateOrderStatus);

// Motoboys
router.get('/motoboys/active', authMiddleware, getActiveMotoboys);
router.put('/motoboy/status', authMiddleware, updateMotoboyStatus);
router.get('/metrics', authMiddleware, getDashboardMetrics);

export default router;
