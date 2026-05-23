import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import * as bcrypt from 'bcrypt';

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  async create(createUserDto: CreateUserDto) {
    const hashedPassword = await bcrypt.hash(createUserDto.password, 10);
    return this.prisma.user.create({
      data: {
        nombre: createUserDto.nombre,
        email: createUserDto.email,
        password: hashedPassword,
      },
    });
  }

  findAll() {
    return this.prisma.user.findMany({
      include: { habilidades: true },
    });
  }

  findOne(id: string) {
    return this.prisma.user.findUnique({
      where: { id },
      include: {
        habilidades: true,
        enviados: true,
        recibidos: true,
      },
    });
  }

  // 👇 EL MÉTODO QUE HABÍAMOS PERDIDO (Necesario para el Login)
  async findOneByEmail(email: string) {
    return this.prisma.user.findUnique({
      where: { email },
    });
  }

// 🔍 BUSCADOR UNIVERSAL: Filtra por Nombre, Título/Categoría o Habilidades
  async searchBySkill(searchTerm: string) {
    return this.prisma.user.findMany({
      where: {
        OR: [
          {
            nombre: {
              contains: searchTerm,
              mode: 'insensitive', // Ignora mayúsculas y minúsculas
            },
          },
          {
            titulo: {
              contains: searchTerm,
              mode: 'insensitive', // Permite buscar por rol/categoría (Ej: "Developer")
            },
          },
          {
            habilidades: {
              some: {
                nombre: {
                  contains: searchTerm,
                  mode: 'insensitive', // Permite buscar por tags técnicos (Ej: "React")
                },
              },
            },
          },
        ],
      },
      include: {
        habilidades: true,
      },
    });
  }

  //  SUGERENCIAS EN TIEMPO REAL: Trae habilidades que empiecen o contengan el texto
  async getSkillSuggestions(text: string) {
    if (!text || text.trim().length < 2) return []; // No sugerir hasta tener al menos 2 letras
    
    return this.prisma.skill.findMany({
      where: {
        nombre: {
          contains: text,
          mode: 'insensitive',
        },
      },
      take: 5, // Limitar a las 5 mejores sugerencias para no saturar la pantalla
      select: { nombre: true }, // Solo nos interesa el texto para sugerir
    });
  }

  // Método para actualizar el perfil (Nombre y Biografía)
  async update(id: string, updateUserDto: any) {
    return this.prisma.user.update({
      where: { id },
      data: {
        nombre: updateUserDto.nombre,
        bio: updateUserDto.bio,
      },
      include: { habilidades: true },
    });
  }

  remove(id: string) {
    return this.prisma.user.delete({
      where: { id },
    });
  }

  // Publicar una nueva misión en el tablón
  async createMission(autorId: string, data: { titulo: string; descripcion: string; horas: number }) {
    return this.prisma.mission.create({
      data: {
        titulo: data.titulo,
        descripcion: data.descripcion,
        horas: data.horas,
        autorId: autorId,
      },
    });
  }

  // Obtener todas las misiones abiertas del tablón
// Ahora incluye los postulantes y sus perfiles de usuario al listar misiones
  async findAllMissions() {
    return this.prisma.mission.findMany({
      include: { 
        autor: true,
        postulantes: {
          include: {
            applicant: {
              include: { habilidades: true }
            }
          }
        }
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  //  Crear una postulación formal a una misión
  async applyToMission(missionId: string, applicantId: string) {
    return this.prisma.application.create({
      data: { missionId, applicantId }
    });
  }

  // NUEVO: Rechazar a un postulante (elimina la aplicación)
  async rejectApplicant(applicationId: string) {
    return this.prisma.application.delete({
      where: { id: applicationId }
    });
  }

  // Guardar un nuevo mensaje enviado
  async sendMessage(remitenteId: string, receptorId: string, contenido: string) {
    return this.prisma.message.create({
      data: { remitenteId, receptorId, contenido },
    });
  }

// Trae el historial completo (incluyendo si fue leído o no)
  async getChatHistory(userA: string, userB: string) {
    return this.prisma.message.findMany({
      where: {
        OR: [
          { remitenteId: userA, receptorId: userB },
          { remitenteId: userB, receptorId: userA },
        ],
      },
      orderBy: { createdAt: 'asc' },
    });
  }

  // 👁️ NUEVO: Marcar mensajes recibidos de un usuario específico como LEÍDOS
  async markAsRead(remitenteId: string, receptorId: string) {
    return this.prisma.message.updateMany({
      where: {
        remitenteId: remitenteId,
        receptorId: receptorId,
        leido: false,
      },
      data: { leido: true },
    });
  }

  // Obtener el conteo general de cuántos mensajes no leídos tiene un usuario agrupado por remitente
  async getUnreadCounts(receptorId: string) {
    return this.prisma.message.findMany({
      where: {
        receptorId: receptorId,
        leido: false,
      },
      select: {
        remitenteId: true,
      },
    });
  }

  //  Aceptar candidato: Congela el saldo del creador y pasa la misión a PROGRESO
  async acceptWorker(missionId: string, workerId: string) {
    const mission = await this.prisma.mission.findUnique({ where: { id: missionId }, include: { autor: true } });
    if (!mission) throw new Error('Misión no encontrada');
    
    // Validamos si el creador tiene suficientes horas para asegurar el contrato
    if (mission.autor.saldoHoras < mission.horas) {
      throw new Error('Saldo insuficiente para respaldar esta garantía.');
    }

    // Usamos una transacción para restar las horas al autor y asignar al trabajador
    return this.prisma.$transaction(async (tx) => {
      await tx.user.update({
        where: { id: mission.autorId },
        data: { saldoHoras: { decrement: mission.horas } }, // Descontamos las horas de inmediato
      });

      return tx.mission.update({
        where: { id: missionId },
        data: { workerId, estado: 'PROGRESO' },
      });
    });
  }

async completeMission(missionId: string) {
    const mission = await this.prisma.mission.findUnique({ where: { id: missionId } });
    
    // 🛡️ Filtro de seguridad: Si no hay misión o no hay trabajador, cancelamos.
    if (!mission || !mission.workerId) throw new Error('Operación inválida');

    // Extraemos el ID asegurando a TypeScript que es un string real usando el operador '!'
    const trabajadorId: string = mission.workerId; 

    return this.prisma.$transaction(async (tx) => {
      // 1. Le pagamos las horas guardadas en garantía al trabajador
      await tx.user.update({
        where: { id: trabajadorId }, // 👈 Usamos la constante limpia
        data: { saldoHoras: { increment: mission.horas } },
      });

      // 2. Registramos la transacción en el histórico general
      await tx.transaction.create({
        data: {
          cantidad: mission.horas,
          senderId: mission.autorId,
          receiverId: trabajadorId, // 👈 Usamos la constante limpia
          descripcion: `Misión Cumplida: ${mission.titulo}`,
        }
      });

      // 3. Cerramos el contrato pasando el estado a COMPLETADA
      return tx.mission.update({
        where: { id: missionId },
        data: { estado: 'COMPLETADA' },
      });
    });
  }
}