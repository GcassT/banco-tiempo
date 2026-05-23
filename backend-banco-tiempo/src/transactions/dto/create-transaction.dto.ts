export class CreateTransactionDto {
  senderId: string;    // El que paga las horas
  receiverId: string;  // El que recibe las horas
  cantidad: number;    // Cuántas horas (ej: 1.5)
  descripcion: string; // ¿Qué servicio se prestó?
}