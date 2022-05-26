/* eslint-disable prefer-const */
import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { query } from 'express';
import { assignPartialsToThis } from 'src/helpers/ultils';
import { ImagesService } from 'src/image/image.service';
import { RoomsService } from 'src/rooms/room.service';
import { UserRole } from 'src/users/decorator/user.enum';

import { Repository } from 'typeorm';
import { CreateIdentityRecordDto } from './dto/create-identity-record.dto';
import { IdentityRecord } from './entities/indentity-record.entity';
@Injectable()
export class IdentityRecordService {
  constructor(
    @InjectRepository(IdentityRecord)
    private recordRepository: Repository<IdentityRecord>,
    private roomService: RoomsService,
    private imageService: ImagesService,
  ) {}
  async create(createRecordDto: CreateIdentityRecordDto) {
    try {
      const { roomId, faceImage } = createRecordDto;
      const room = await this.roomService.findOne(roomId);
      let record = new IdentityRecord();
      assignPartialsToThis(record, createRecordDto);
      record.room = room;
      record.faceImage = faceImage;
      // if (cardImageId) {
      //   const cardImage = await this.imageService.getFile(cardImageId);
      //   record.cardImage = cardImage;
      // }
      await this.recordRepository.save(record);
      return record;
    } catch (err) {
      throw new BadRequestException(err.message);
    }
  }

  async findAll() {
    return await this.recordRepository.find({
      relations: ['room'],
    });
  }
  async findOne(id: string) {
    const record = await this.recordRepository
      .createQueryBuilder('record')
      .leftJoinAndSelect('record.room', 'room')
      .leftJoinAndSelect('record.faceImage', 'faceImage')
      .leftJoinAndSelect('room.subject', 'subject')
      .where('record.id = :id', { id })
      .getOne();
    if (!record) throw new BadRequestException('Not found room zoom');
    return record;
  }

  async getMyAllRecords(user: any, roomId: number) {
    try {
      let query = await this.recordRepository
        .createQueryBuilder('identity')
        .leftJoinAndSelect('identity.room', 'room')
        .leftJoinAndSelect('identity.faceImage', 'image')
        .where('room.id = :roomId', { roomId: roomId })
        .orderBy('identity.created_at', 'ASC');

      if (user.role == UserRole.ADMIN)
        query = query.andWhere('identity.studentId = :studentId', {
          studentId: user.studentId,
        });
      return query.getMany();
    } catch (error) {
      console.log(error.message);
    }
  }

  async getMyAllInRoom(roomId: number) {
    try {
      return await this.recordRepository
        .createQueryBuilder('identity')
        .leftJoinAndSelect('identity.room', 'room')
        .leftJoinAndSelect('identity.faceImage', 'image')
        .where('room.id = :roomId', { roomId: roomId })
        .orderBy('identity.created_at', 'ASC')
        .getMany();
    } catch (error) {
      console.log(error.message);
    }
  }
}
