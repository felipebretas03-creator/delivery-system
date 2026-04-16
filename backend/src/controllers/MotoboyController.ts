import { Response } from 'express';
import { prisma } from '../prisma';
import { AuthRequest } from '../middlewares/auth';

export const getActiveMotoboys = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const motoboys = await prisma.user.findMany({
      where: { role: 'MOTOBOY' },
      select: { id: true, name: true, status: true }
    });
    res.json(motoboys);
  } catch (error) {
    res.status(500).json({ error: 'Erro ao listar motoboys' });
  }
};

export const updateMotoboyStatus = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { status } = req.body;
    if (req.user?.role !== 'MOTOBOY') {
        res.status(403).json({ error: 'Apenas motoboys podem alterar este status' });
        return;
    }
    const motoboy = await prisma.user.update({
      where: { id: req.user.id },
      data: { status }
    });
    res.json(motoboy);
  } catch (error) {
    res.status(500).json({ error: 'Erro ao atualizar status do motoboy' });
  }
};

export const getDashboardMetrics = async (req: AuthRequest, res: Response): Promise<void> => {
   try {
      const orders = await prisma.order.findMany({
         where: { status: 'DELIVERED', deliveredAt: { not: null }, startedAt: { not: null } }
      });
      
      let totalTime = 0;
      orders.forEach(o => {
         if (o.deliveredAt && o.startedAt) {
            totalTime += (o.deliveredAt.getTime() - o.startedAt.getTime());
         }
      });
      
      const avgTimeMs = orders.length > 0 ? totalTime / orders.length : 0;
      const avgTimeMinutes = Math.round(avgTimeMs / 60000);

      // Ranking
      const motoboyStats = await prisma.order.groupBy({
         by: ['motoboyId'],
         where: { status: 'DELIVERED' },
         _count: { id: true }
      });

      res.json({ avgTimeMinutes, totalDelivered: orders.length, motoboyStats });
   } catch(error) {
      res.status(500).json({ error: 'Erro de metricas' });
   }
}
