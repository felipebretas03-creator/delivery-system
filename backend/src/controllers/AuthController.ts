import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { prisma } from '../prisma';

const SECRET_KEY = process.env.JWT_SECRET || 'secret-delivery-key';

export const login = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password } = req.body;
    
    // First setup auto-admin if db empty
    const count = await prisma.user.count();
    if (count === 0) {
       const hashed = await bcrypt.hash('admin', 10);
       await prisma.user.create({
          data: { name: 'Admin Root', email: 'admin@admin.com', password: hashed, role: 'ADMIN' }
       });
    }

    const user = await prisma.user.findUnique({ where: { email } });
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

export const registerMotoboy = async (req: Request, res: Response): Promise<void> => {
   try {
      const { name, email, password } = req.body;
      const hashed = await bcrypt.hash(password, 10);
      const user = await prisma.user.create({
         data: { name, email, password: hashed, role: 'MOTOBOY' }
      });
      res.json({ message: 'Motoboy registrado com sucesso', id: user.id });
   } catch(error) {
      res.status(500).json({ error: 'Erro ao registrar motoboy' });
   }
};
