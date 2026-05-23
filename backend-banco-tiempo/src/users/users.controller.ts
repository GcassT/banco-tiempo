import { Controller, Get, Post, Body, Patch, Param, Delete, Query } from '@nestjs/common';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Post()
  create(@Body() createUserDto: CreateUserDto) {
    return this.usersService.create(createUserDto);
  }

  @Get()
  findAll() {
    return this.usersService.findAll();
  }

  @Get('search')
  search(@Query('skill') skill: string) {
    // Si el usuario no escribe nada en el buscador, devolvemos a todos
    if (!skill) {
      return this.usersService.findAll();
    }
    return this.usersService.searchBySkill(skill);
  }

  @Post('missions')
  createMission(@Body() body: { autorId: string; titulo: string; descripcion: string; horas: number }) {
    return this.usersService.createMission(body.autorId, body);
  }

  @Get('missions/all')
  getAllMissions() {
    return this.usersService.findAllMissions();
  }

  @Post('messages')
  async sendNewMessage(@Body() body: { remitenteId: string; receptorId: string; contenido: string }) {
    return this.usersService.sendMessage(body.remitenteId, body.receptorId, body.contenido);
  }

  @Get('messages/chat')
  async getChat(@Query('userA') userA: string, @Query('userB') userB: string) {
    return this.usersService.getChatHistory(userA, userB);
  }

  @Patch('missions/:id/accept')
  async acceptWorker(@Param('id') id: string, @Body() body: { workerId: string }) {
    return this.usersService.acceptWorker(id, body.workerId);
  }

  @Patch('missions/:id/complete')
  async completeMission(@Param('id') id: string) {
    return this.usersService.completeMission(id);
  }

  @Post('missions/:id/apply')
  async apply(@Param('id') id: string, @Body() body: { applicantId: string }) {
    return this.usersService.applyToMission(id, body.applicantId);
  }

  @Delete('applications/:id')
  async reject(@Param('id') id: string) {
    return this.usersService.rejectApplicant(id);
  }

  @Get('skills/suggestions')
  async getSuggestions(@Query('q') q: string) {
    return this.usersService.getSkillSuggestions(q);
  }

  @Patch('messages/read')
  async markRead(@Body() body: { remitenteId: string; receptorId: string }) {
    return this.usersService.markAsRead(body.remitenteId, body.receptorId);
  }

  @Get('messages/unread-counts/:id')
  async getUnread(@Param('id') id: string) {
    return this.usersService.getUnreadCounts(id);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.usersService.findOne(id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateUserDto: UpdateUserDto) {
    return this.usersService.update(id, updateUserDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.usersService.remove(id);
  }
}
