import { Injectable, BadRequestException } from '@nestjs/common';
import { CreateTransactionDto } from './dto/create-transaction.dto';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class TransactionsService {
  constructor(private prisma: PrismaService) {}

  async create(createTransactionDto: CreateTransactionDto) {
    const { senderId, receiverId, cantidad, descripcion } = createTransactionDto;

    return this.prisma.$transaction(async (tx) => {
  // 1. Verificar emisor
  const sender = await tx.user.findUnique({ where: { id: senderId } });
  if (!sender) throw new BadRequestException('El emisor no existe');
  if (sender.saldoHoras < cantidad) throw new BadRequestException('Saldo insuficiente');

  // 2. Verificar receptor (¡Esto es lo que nos faltaba!)
  const receiver = await tx.user.findUnique({ where: { id: receiverId } });
  if (!receiver) throw new BadRequestException('El receptor no existe');

      // 3. Restamos saldo al emisor
      await tx.user.update({
        where: { id: senderId },
        data: { saldoHoras: { decrement: cantidad } },
      });

      // 4. Sumamos saldo al receptor
      await tx.user.update({
        where: { id: receiverId },
        data: { saldoHoras: { increment: cantidad } },
      });

      // 5. Creamos el registro histórico
      return tx.transaction.create({
        data: {
          cantidad,
          descripcion,
          senderId,
          receiverId,
        },
      });
    });
  }

  findAll() {
    return this.prisma.transaction.findMany({
      include: { sender: true, receiver: true },
    });
  }

  async findOne(id: string) {
    return this.prisma.transaction.findUnique({
      where: { id },
      include: { sender: true, receiver: true },
    });
  }

  // Las transacciones suelen ser históricas (no se editan ni borran),
  // pero las añadimos para que el controlador no de error:
  async update(id: string, updateTransactionDto: any) {
    return this.prisma.transaction.update({
      where: { id },
      data: updateTransactionDto,
    });
  }

  async remove(id: string) {
    return this.prisma.transaction.delete({ where: { id } });
  }

}

