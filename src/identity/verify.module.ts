import { HttpModule, Module } from '@nestjs/common';
import { VerifyService } from './verify.service';
import { VerifyController } from './verify.controller';
import { RoomsModule } from 'src/rooms/room.module';
import { ImagesModule } from 'src/image/image.module';
import { IdentityRecordModule } from 'src/identity_record/indetity-record.module';

@Module({
  imports: [RoomsModule, ImagesModule, HttpModule, IdentityRecordModule],
  controllers: [VerifyController],
  providers: [VerifyService],
})
export class VerifyModule {}
