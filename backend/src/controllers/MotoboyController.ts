import { Response } from 'express';
import bcrypt from 'bcryptjs';
import { prisma } from '../prisma';
import { AuthRequest } from '../middlewares/auth';

export const getActiveMotoboys = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const motoboys = await prisma.user.findMany({
      where: { role: 'MOTOBOY' },
      select: { id: true, name: true, username: true, salary: true, status: true }
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

export const updateMotoboy = async (req: AuthRequest, res: Response): Promise<void> => {
   try {
      const { id } = req.params;
      const { name, username, password, salary } = req.body;
      
      const updateData: any = {
         name,
         username,
         salary: salary ? parseFloat(salary) : 0
      };

      if (password && password.trim() !== '') {
         updateData.password = await bcrypt.hash(password, 10);
      }

      const user = await prisma.user.update({
         where: { id: parseInt(id as string) },
         data: updateData
      });

      res.json({ message: 'Atualizado com sucesso!', id: user.id });
   } catch (error) {
      res.status(500).json({ error: 'Erro ao editar motoboy' });
   }
};

export const deleteMotoboy = async (req: AuthRequest, res: Response): Promise<void> => {
   try {
      const { id } = req.params;
      const motoboyId = parseInt(id as string);
      
      // Nullify references in orders to avoid FK errors and keep history
      await prisma.order.updateMany({
         where: { motoboyId },
         data: { motoboyId: null }
      });
      
      // Delete the motoboy account
      await prisma.user.delete({
         where: { id: motoboyId }
      });
      
      res.json({ message: 'Motoboy excluído permanentemente.' });
   } catch (error) {
      res.status(500).json({ error: 'Erro ao excluir motoboy' });
   }
};
