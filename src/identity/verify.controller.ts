import {
  Controller,
  Post,
  UseInterceptors,
  UploadedFile,
  Param,
  Body,
  Get,
  Response,
  StreamableFile,
} from '@nestjs/common';
import { VerifyService } from './verify.service';
import { ApiBody, ApiConsumes, ApiTags } from '@nestjs/swagger';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { editFileName } from './helper/generate-file-name';
import { imageFileFilter } from './helper/excel-file-filter';
import { VerifyStudentDto } from './dto/verify-student.dto';
import { createWriteStream } from 'fs';
import { join } from 'path';
import { ImagesService } from 'src/image/image.service';
@ApiTags('identity')
@Controller('identity')
export class VerifyController {
  constructor(
    private readonly verifyService: VerifyService,
    private imagesService: ImagesService,
  ) {}

  @Post()
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: {
          type: 'string',
          format: 'binary',
        },
        studentId: {
          type: 'string',
        },
        zoomId: {
          type: 'string',
        },
        passCode: {
          type: 'string',
        },
        linkZoom: {
          type: 'string',
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
      fileFilter: imageFileFilter,
    }),
  )
  async verifyStudent(
    @Body() verifyStudentDto: VerifyStudentDto,
    @UploadedFile() file,
  ) {
    const images = await this.imagesService.getAllByStudentId(
      verifyStudentDto.studentId,
    );
    await Promise.all(
      images.map(async (img) => {
        const file = await this.imagesService.getFile(img.imageId);
        const target = createWriteStream(`./public/images/${img.imageId}.jpg`);
        file.pipe(target);
      }),
    );
    return await this.verifyService.verify(file, verifyStudentDto, images);
  }

  // @Get(':studentId/:index')
  // async getImage(
  //   @Response({ passthrough: true }) res,
  //   @Param('studentId') studentId: string,
  //   @Param('index') index: string,
  // ): Promise<StreamableFile> {
  //   const file = createReadStream(
  //     join(process.cwd(), `./data/${studentId}/${index}.jpg`),
  //   );
  //   res.set({
  //     'Content-Type': 'image/jpg',
  //     'Content-Disposition': 'attachment; filename="image.jpg"',
  //   });
  //   return new StreamableFile(file);
  // }
}
