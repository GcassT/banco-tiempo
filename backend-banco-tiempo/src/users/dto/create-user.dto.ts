export class CreateUserDto {
  nombre: string;
  email: string;
  password: string;
  bio?: string;
  portfolioUrl?: string;
  // Añadimos esto: una lista de IDs de las habilidades que el usuario posee
  skillsIds?: string[]; 
}