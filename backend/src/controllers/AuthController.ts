import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { prisma } from '../prisma';
import { AuthRequest } from '../middlewares/auth';

const SECRET_KEY = process.env.JWT_SECRET || 'secret-delivery-key';

export const login = async (req: Request, res: Response): Promise<void> => {
  try {
    const { username, password } = req.body;
    
    // First setup auto-admin if db empty
    const count = await prisma.user.count();
    if (count === 0) {
       const hashed = await bcrypt.hash('admin', 10);
       await prisma.user.create({
          data: { name: 'Admin Root', username: 'admin', password: hashed, role: 'ADMIN' }
       });
    }

    const user = await prisma.user.findUnique({ where: { username } });
    if (!user) {
      res.status(401).json({ error: 'Credenciais inválidas' });
      return;
    }

    const isValid = await bcrypt.compare(password, user.password);
    if (!isValid) {
      res.status(401).json({ error: 'Credenciais inválidas' });
      return;
    }

    if (user.role === 'MOTOBOY') {
       await prisma.user.update({
          where: { id: user.id },
          data: { status: 'ONLINE' }
       });
    }

    const token = jwt.sign({ id: user.id, role: user.role, name: user.name }, SECRET_KEY, { expiresIn: '12h' });
    
    res.json({ token, role: user.role, name: user.name });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Erro no servidor' });
  }
};

export const registerMotoboy = async (req: AuthRequest, res: Response): Promise<void> => {
   try {
      if (req.user?.role !== 'ADMIN') {
         res.status(403).json({ error: 'Apenas administradores podem cadastrar motoboys' });
         return;
      }

      const { name, username, password } = req.body;
      if (!name || !username || !password) {
         res.status(400).json({ error: 'Todos os campos são obrigatórios' });
         return;
      }

      const existingUser = await prisma.user.findUnique({ where: { username } });
      if (existingUser) {
         res.status(409).json({ error: 'Usuário já está em uso' });
         return;
      }

      const hashed = await bcrypt.hash(password, 10);
      const user = await prisma.user.create({
         data: { name, username, password: hashed, role: 'MOTOBOY' }
      });
      res.json({ message: 'Motoboy registrado com sucesso', id: user.id });
   } catch(error) {
      res.status(500).json({ error: 'Erro ao registrar motoboy' });
   }
};
