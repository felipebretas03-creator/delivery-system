import { Response } from 'express';
import { prisma } from '../prisma';
import { AuthRequest } from '../middlewares/auth';

export const getConfig = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const key = req.params.key as string;
    const config = await prisma.systemConfig.findUnique({ where: { key } });
    if (!config) {
      res.json({ value: '' });
      return;
    }
    res.json({ value: config.value });
  } catch (error) {
    res.status(500).json({ error: 'Erro ao buscar configuração' });
  }
};

export const setConfig = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { key, value } = req.body;
    const config = await prisma.systemConfig.upsert({
      where: { key },
      update: { value },
      create: { key, value }
    });
    res.json(config);
  } catch (error) {
    res.status(500).json({ error: 'Erro ao salvar configuração' });
  }
};
