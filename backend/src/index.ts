import express from 'express';
import cors from 'cors';
import routes from './routes';
import bcrypt from 'bcryptjs';
import { prisma } from './prisma';

const app = express();
app.use(cors({
  origin: ["https://delivery-system-puce.vercel.app"],
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
  credentials: true
}));

// 👇 MUITO IMPORTANTE
app.options('*', cors());
app.use(express.json());
app.use('/api', routes);

const PORT = process.env.PORT || 3001;

async function createAdminIfNotExists() {
  const adminExists = await prisma.user.findFirst({
    where: { email: "admin@admin.com" }
  });

  if (!adminExists) {
    const hashedPassword = await bcrypt.hash("123456", 10);

    await prisma.user.create({
      data: {
        name: "Admin",
        email: "admin@admin.com",
        password: hashedPassword,
        role: "ADMIN"
      }
    });

    console.log("✅ Admin criado automaticamente");
  } else {
    console.log("ℹ️ Admin já existe");
  }
}

// 🚀 inicia tudo corretamente
app.listen(PORT, async () => {
  console.log(`Servidor rodando na porta ${PORT}`);
  await createAdminIfNotExists();
});