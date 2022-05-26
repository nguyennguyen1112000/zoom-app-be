import { Controller, Get, UseGuards, Param } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard';
import { RolesGuard } from 'src/auth/decorator/roles.guard';
import { IdentityRecordService } from './identity-record.service';
import { GetUser } from 'src/users/decorator/user.decorator';
import { Roles } from 'src/auth/decorator/roles.decorator';
import { UserRole } from 'src/users/decorator/user.enum';

@ApiTags('identity-record')
@Controller('identity-record')
export class IdentityRecordController {
  constructor(private readonly recordService: IdentityRecordService) {}

  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiBearerAuth('JWT-auth')
  @Get()
  findAll() {
    return this.recordService.findAll();
  }

  @Get(':id')
  getCurrentRoomInfo(@Param('id') id: string) {
    return this.recordService.findOne(id);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiBearerAuth('JWT-auth')
  @Get('room/:roomId')
  findMyAllRecords(@GetUser() user, @Param('roomId') roomId: number) {
    return this.recordService.getMyAllRecords(user, roomId);
  }
}
