import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ZoomRoom } from './entities/room.entity';
import { RoomsService } from './room.service';
import { RoomsController } from './room.controller';
import { SubjectsModule } from 'src/subject/subject.module';

@Module({
  imports: [TypeOrmModule.forFeature([ZoomRoom]), SubjectsModule],
  controllers: [RoomsController],
  providers: [RoomsService],
  exports: [RoomsService],
})
export class RoomsModule {}
