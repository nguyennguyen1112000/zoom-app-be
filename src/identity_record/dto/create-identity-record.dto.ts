import { ImageData } from 'src/image/entities/image.entity';

export class CreateIdentityRecordDto {
  roomId: number;
  studentId: string;
  status: boolean;
  zoomEmail: string;
  faceImage?: ImageData;
  cardImage?: ImageData;
}
