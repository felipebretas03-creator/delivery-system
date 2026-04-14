import { Router } from 'express';
import { login, registerMotoboy } from './controllers/AuthController';
import { createOrder, getOrders, getMotoboyOrders, assignOrder, updateOrderStatus } from './controllers/OrderController';
import { getActiveMotoboys, updateMotoboyStatus, getDashboardMetrics } from './controllers/MotoboyController';
import { authMiddleware, requireAdmin, requireMotoboy } from './middlewares/auth';

const router = Router();

// Auth
router.post('/auth/login', login);
router.post('/auth/register', authMiddleware, requireAdmin, registerMotoboy);

// Orders
router.post('/orders', authMiddleware, requireAdmin, createOrder);
router.get('/orders', authMiddleware, requireAdmin, getOrders);
router.get('/motoboy/orders', authMiddleware, requireMotoboy, getMotoboyOrders);
router.post('/orders/assign', authMiddleware, requireAdmin, assignOrder);
router.put('/orders/:id/status', authMiddleware, requireMotoboy, updateOrderStatus);

// Motoboys
router.get('/motoboys/active', authMiddleware, requireAdmin, getActiveMotoboys);
router.put('/motoboy/status', authMiddleware, requireMotoboy, updateMotoboyStatus);
router.get('/metrics', authMiddleware, requireAdmin, getDashboardMetrics);

export default router;
