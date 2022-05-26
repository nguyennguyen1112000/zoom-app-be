import {
  Controller,
  Get,
  Post,
  Body,
  UseGuards,
  Param,
  Query,
  Response,
  StreamableFile,
  UseInterceptors,
  UploadedFile,
  Delete,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiBody,
  ApiConsumes,
  ApiQuery,
  ApiTags,
} from '@nestjs/swagger';
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard';
import { CreateRoomDto } from './dto/create-room.dto';
import { RolesGuard } from 'src/auth/decorator/roles.guard';
import { RoomsService } from './room.service';
import { GetUser } from 'src/users/decorator/user.decorator';
import { createReadStream } from 'fs';
import { join } from 'path';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { editFileName } from 'src/identity/helper/generate-file-name';
import { excelFileFilter } from 'src/helpers/excel-file-filter';

@ApiTags('rooms')
@Controller('rooms')
export class RoomsController {
  constructor(private readonly roomsService: RoomsService) {}
  @Get('template')
  getStudentsTemplateFile(
    @Response({ passthrough: true }) res,
  ): StreamableFile {
    const url = '/public/files/template3.xlsx';
    const fileName = 'room_template.xlsx';
    const file = createReadStream(join(process.cwd(), url));

    res.set({
      'Content-Type':
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition': `attachment; filename="${fileName}"`,
    });
    return new StreamableFile(file);
  }
  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiBearerAuth('JWT-auth')
  @Post()
  create(@Body() createRoomDto: CreateRoomDto) {
    return this.roomsService.create(createRoomDto);
  }
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Get('me')
  getMyRoom(@GetUser() user: any) {
    return this.roomsService.getMyRooms(user.studentId);
  }
  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiBearerAuth('JWT-auth')
  @Get()
  findAll() {
    return this.roomsService.findAll();
  }

  @Get('currentRoom')
  getCurrentRoomInfo(
    @Query('studentId') studentId?: string,
    @Query('zoomId') zoomId?: string,
    @Query('passcode') passcode?: string,
    @Query('linkZoom') linkZoom?: string,
  ) {
    return this.roomsService.getCurrentRoom(
      studentId,
      zoomId,
      passcode,
      linkZoom,
    );
  }
  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiBearerAuth('JWT-auth')
  @Get(':id')
  findOne(@Param('id') id: number) {
    return this.roomsService.findOne(id);
  }

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @Post('upload')
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: {
          type: 'string',
          format: 'binary',
        },
      },
    },
  })
  @UseInterceptors(
    FileInterceptor('file', {
      storage: diskStorage({
        destination: './public/files',
        filename: editFileName,
      }),
      fileFilter: excelFileFilter,
    }),
  )
  async uploadRoomFile(@UploadedFile() file) {
    return await this.roomsService.uploadFile(file);
  }

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @Delete()
  delete(@Body() ids: number[]) {
    return this.roomsService.deletes(ids);
  }
}
