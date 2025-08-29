import { PrismaClient } from './generated/prisma';
const prisma = new PrismaClient();
// Crear usuario admin si no existe 
//TODO:ESTO MUERE DESPUES
async function ensureAdminUser() {
  const adminEmail = 'nico@nico.com';
  const adminPassword = '$2b$10$5bEqbStSTL7lJw/rQiHkjef.oxzkYD/EFNV2h7474aubTTgyNyg1u';
  const existing = await prisma.user.findUnique({ where: { email: adminEmail } });
  if (!existing) {
    await prisma.user.create({
      data: {
        email: adminEmail,
        password: adminPassword,
        name: 'Administrador',
        role: 'ADMIN',
        isActive: true
      }
    });
    console.log('Usuario admin creado');
  }
}
ensureAdminUser();
import express from 'express';
import cors from 'cors';
import productRoutes from './routes/productRoutes';
import catalogRoutes from './routes/catalogRoutes';
import authRoutes from './routes/authRoutes';
import salesRoutes from './routes/salesRoutes';
import logRoutes from './routes/logRoutes';

const app = express();
const PORT = process.env.PORT || 4000;

app.use(cors());
app.use(express.json());

// Rutas de autenticación
app.use('/api/auth', authRoutes);

// Rutas de productos
app.use('/api/products', productRoutes);

// Rutas de catálogo
app.use('/api/catalog', catalogRoutes);

// Rutas de ventas
app.use('/api/sales', salesRoutes);

// Rutas de logs (solo admin)
app.use('/api/logs', logRoutes);

app.get('/', (req, res) => {
  res.send('API FEMENINE funcionando');
});

app.listen(PORT, () => {
  console.log(`Servidor backend escuchando en puerto ${PORT}`);
});
