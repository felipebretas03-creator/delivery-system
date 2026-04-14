import express from 'express';
import cors from 'cors';
import routes from './routes';
import bcrypt from 'bcryptjs';
import { prisma } from './prisma';

const app = express();

app.use(cors({
  origin: "https://delivery-system-puce.vercel.app",
  methods: ["GET", "POST", "PUT", "DELETE"],
  credentials: true
}));

app.use(express.json());
app.use('/api', routes);

const PORT = process.env.PORT || 3001;

async function createAdmin() {
  // 🔥 força recriação
  await prisma.user.deleteMany({
    where: { email: "admin@admin.com" }
  });

  const hashedPassword = await bcrypt.hash("123456", 10);

  await prisma.user.create({
    data: {
      name: "Admin",
      email: "admin@admin.com",
      password: hashedPassword,
      role: "ADMIN"
    }
  });

  console.log("🔥 Admin recriado");
}

app.listen(PORT, async () => {
  console.log(`Servidor rodando na porta ${PORT}`);
  await createAdmin();
});