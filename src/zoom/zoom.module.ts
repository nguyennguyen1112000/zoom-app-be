import { Module } from '@nestjs/common';

import { HttpModule } from '@nestjs/axios';
import { ZoomsController } from './zoom.controller';
import { ZoomsService } from './zoom.service';
@Module({
  imports: [HttpModule],
  controllers: [ZoomsController],
  providers: [ZoomsService],
  exports: [ZoomsService],
})
export class ZoomsModule {}
