import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  const skills = [
    { nombre: 'Desarrollo Web', categoria: 'Tecnología' },
    { nombre: 'Diseño Gráfico', categoria: 'Diseño' },
    { nombre: 'Asesoría Legal', categoria: 'Legal' },
    { nombre: 'Marketing Digital', categoria: 'Marketing' },
    { nombre: 'Traducción Inglés', categoria: 'Idiomas' },
    { nombre: 'Clases de Yoga', categoria: 'Bienestar' },
  ];

  for (const skill of skills) {
    await prisma.skill.upsert({
      where: { nombre: skill.nombre },
      update: {},
      create: skill,
    });
  }

  console.log('✅ Catálogo de habilidades sembrado con éxito');
}

main()
  .catch((e) => console.error(e))
  .finally(async () => await prisma.$disconnect());