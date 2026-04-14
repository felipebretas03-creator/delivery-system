import { Response } from 'express';
import { prisma } from '../prisma';
import { AuthRequest } from '../middlewares/auth';

export const createOrder = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { customerName, address, phone } = req.body;
    const order = await prisma.order.create({
      data: { customerName, address, phone }
    });
    res.json(order);
  } catch (error) {
    res.status(500).json({ error: 'Erro ao criar pedido' });
  }
};

export const getOrders = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const orders = await prisma.order.findMany({
      include: { motoboy: { select: { name: true } } },
      orderBy: { createdAt: 'desc' }
    });
    res.json(orders);
  } catch (error) {
    res.status(500).json({ error: 'Erro ao listar pedidos' });
  }
};

export const getMotoboyOrders = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const orders = await prisma.order.findMany({
      where: { motoboyId: req.user?.id },
      orderBy: { createdAt: 'desc' }
    });
    res.json(orders);
  } catch (error) {
    res.status(500).json({ error: 'Erro ao listar pedidos do motoboy' });
  }
};

export const assignOrder = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { orderId, motoboyId } = req.body;
    const order = await prisma.order.update({
      where: { id: parseInt(orderId) },
      data: { motoboyId: parseInt(motoboyId) }
    });
    res.json(order);
  } catch (error) {
    res.status(500).json({ error: 'Erro ao atribuir pedido' });
  }
};

export const updateOrderStatus = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const id = req.params.id as string;
    const { status } = req.body;

    const updateData: any = { status };
    if (status === 'ACCEPTED') updateData.acceptedAt = new Date();
    if (status === 'IN_TRANSIT') updateData.startedAt = new Date();
    if (status === 'DELIVERED') updateData.deliveredAt = new Date();

    const order = await prisma.order.update({
      where: { id: parseInt(id) },
      data: updateData
    });
    res.json(order);
  } catch (error) {
    res.status(500).json({ error: 'Erro ao atualizar status' });
  }
};
