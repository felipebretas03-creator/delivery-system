import { Router } from 'express';
import { login, registerMotoboy } from './controllers/AuthController';
import { createOrder, getOrders, getMotoboyOrders, assignOrder, updateOrderStatus } from './controllers/OrderController';
import { getActiveMotoboys, updateMotoboyStatus, getDashboardMetrics } from './controllers/MotoboyController';
import { authMiddleware, requireAdmin, requireMotoboy } from './middlewares/auth';

const router = Router();

// Auth
router.post('/api/auth/login', login);
router.post('/api/auth/register', authMiddleware, requireAdmin, registerMotoboy);

// Orders
router.post('/api/orders', authMiddleware, requireAdmin, createOrder);
router.get('/api/orders', authMiddleware, requireAdmin, getOrders);
router.get('/api/motoboy/orders', authMiddleware, requireMotoboy, getMotoboyOrders);
router.post('/api/orders/assign', authMiddleware, requireAdmin, assignOrder);
router.put('/api/orders/:id/status', authMiddleware, requireMotoboy, updateOrderStatus);

// Motoboys
router.get('/api/motoboys/active', authMiddleware, requireAdmin, getActiveMotoboys);
router.put('/api/motoboy/status', authMiddleware, requireMotoboy, updateMotoboyStatus);
router.get('/api/metrics', authMiddleware, requireAdmin, getDashboardMetrics);

export default router;
