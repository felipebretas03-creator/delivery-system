import { Response } from 'express';
import { prisma } from '../prisma';
import { AuthRequest } from '../middlewares/auth';

export const getAdminFinances = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const orders = await prisma.order.findMany({
      where: {
        status: 'DELIVERED',
        motoboyPaid: false
      },
      include: {
        motoboy: { select: { id: true, name: true, username: true, salary: true } }
      }
    });

    const isDelayed = (o: any) => {
      if (!o.startedAt || !o.deliveredAt) return false;
      return Math.floor((new Date(o.deliveredAt).getTime() - new Date(o.startedAt).getTime()) / 60000) > 20;
    };

    const totalSystemValue = orders.reduce((acc, o) => acc + (o.orderValue || 0), 0);
    const totalPendingToMotoboys = orders.reduce((acc, o) => acc + (isDelayed(o) ? 0 : (o.deliveryFee || 0)), 0);

    const motoboyBalances: Record<number, any> = {};
    
    orders.forEach(o => {
      if (o.motoboyId && o.motoboy) {
        if (!motoboyBalances[o.motoboyId]) {
          motoboyBalances[o.motoboyId] = {
            id: o.motoboyId,
            name: o.motoboy.name,
            salary: o.motoboy.salary || 0,
            pendingBalance: 0,
            pendingOrdersCount: 0
          };
        }
        if (!isDelayed(o)) {
          motoboyBalances[o.motoboyId].pendingBalance += (o.deliveryFee || 0);
        }
        motoboyBalances[o.motoboyId].pendingOrdersCount += 1;
      }
    });

    res.json({
      totalSystemValue,
      totalPendingToMotoboys,
      motoboys: Object.values(motoboyBalances)
    });
  } catch (error) {
    res.status(500).json({ error: 'Erro ao carregar dados financeiros' });
  }
};

export const payMotoboy = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const motoboyId = parseInt(req.params.id as string);
    if (!motoboyId) {
      res.status(400).json({ error: 'Motoboy ID inválido' });
      return;
    }

    const { count } = await prisma.order.updateMany({
      where: {
        motoboyId: motoboyId,
        status: 'DELIVERED',
        motoboyPaid: false
      },
      data: {
        motoboyPaid: true
      }
    });

    res.json({ message: `Pagamento concluído para ${count} corridas.`, count });
  } catch (error) {
    res.status(500).json({ error: 'Erro ao efetuar pagamento' });
  }
};

export const getMotoboyFinances = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const motoboyId = req.user?.id;
    if (!motoboyId) {
      res.status(401).json({ error: 'Não autorizado' });
      return;
    }

    const user = await prisma.user.findUnique({ where: { id: motoboyId }, select: { salary: true }});
    
    const orders = await prisma.order.findMany({
      where: {
        motoboyId: motoboyId,
        status: 'DELIVERED'
      },
      orderBy: { deliveredAt: 'desc' },
      take: 50 // limit history for performace reasons
    });

    const isDelayed = (o: any) => {
      if (!o.startedAt || !o.deliveredAt) return false;
      return Math.floor((new Date(o.deliveredAt).getTime() - new Date(o.startedAt).getTime()) / 60000) > 20;
    };

    const pendingBalance = orders
      .filter(o => !o.motoboyPaid && !isDelayed(o))
      .reduce((acc, o) => acc + (o.deliveryFee || 0), 0);
      
    const totalReceived = orders
      .filter(o => o.motoboyPaid && !isDelayed(o))
      .reduce((acc, o) => acc + (o.deliveryFee || 0), 0);
      
    const onTimeCount = orders.filter(o => !isDelayed(o)).length;
    const delayedCount = orders.filter(o => isDelayed(o)).length;

    res.json({
      pendingBalance,
      totalReceived,
      salary: user?.salary || 0,
      onTimeCount,
      delayedCount,
      recentHistory: orders.map(o => ({ ...o, isDelayed: isDelayed(o) }))
    });

  } catch (error) {
    res.status(500).json({ error: 'Erro ao carregar seu financeiro' });
  }
};
