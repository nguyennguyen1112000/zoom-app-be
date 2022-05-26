import { ImageData } from 'src/image/entities/image.entity';
import { ZoomRoom } from 'src/rooms/entities/room.entity';
import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  ManyToOne,
  OneToMany,
  OneToOne,
  JoinColumn,
} from 'typeorm';

@Entity()
export class IdentityRecord {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  studentId: string;

  @Column()
  zoomEmail: string;

  @Column()
  status: boolean;

  @CreateDateColumn({
    type: 'timestamp',
    default: () => 'CURRENT_TIMESTAMP(6)',
  })
  public created_at: Date;

  @ManyToOne((type) => ZoomRoom, (room) => room.identityRecords)
  room: ZoomRoom;

  @OneToOne(() => ImageData)
  @JoinColumn()
  faceImage: ImageData;

  @OneToOne(() => ImageData)
  @JoinColumn()
  cardImage: ImageData;
}
