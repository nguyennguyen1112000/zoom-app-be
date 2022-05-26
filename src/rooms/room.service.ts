/* eslint-disable prefer-const */
import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { assignPartialsToThis } from 'src/helpers/ultils';
import { SubjectsService } from 'src/subject/subject.service';
import { Brackets, Repository } from 'typeorm';
import { CreateRoomDto } from './dto/create-room.dto';
import { ZoomRoom } from './entities/room.entity';
import * as reader from 'xlsx';
import * as fs from 'fs';
import { Connection } from 'typeorm';
@Injectable()
export class RoomsService {
  constructor(
    @InjectRepository(ZoomRoom)
    private roomsRepository: Repository<ZoomRoom>,
    private subjectService: SubjectsService,
    private connection: Connection,
  ) {}
  async create(createRoomDto: CreateRoomDto) {
    try {
      let room = new ZoomRoom();
      assignPartialsToThis(room, createRoomDto);
      const { subjectId } = createRoomDto;
      const subject = await this.subjectService.findOne(subjectId);
      room.subject = subject;
      await this.roomsRepository.save(room);
      return room;
    } catch (err) {
      throw new BadRequestException(err.message);
    }
  }

  async findAll() {
    return await this.roomsRepository.find({
      relations: ['subject', 'students'],
    });
  }
  async findOne(id: number) {
    // const room = await this.roomsRepository.findOne({
    //   where: { id },
    //   relations: ['subject', 'students', 'examinationStaffs'],
    // });
    const room = await this.roomsRepository
      .createQueryBuilder('room')
      .leftJoinAndSelect('room.examinationStaffs', 'user')
      .leftJoinAndSelect('room.subject', 'subject')
      .leftJoinAndSelect('room.students', 'student')

      .leftJoinAndSelect('student.images', 'imageData')
      .where('room.id = :id', { id })
      .getOne();
    if (!room) throw new BadRequestException('Not found room zoom');
    return room;
  }

  async findOneWithCondition(condition: any) {
    const room = await this.roomsRepository.findOne({
      where: condition,
      relations: ['subject', 'students'],
    });
    if (!room) throw new BadRequestException('Not found room zoom');
    return room;
  }

  async getCurrentRoom(
    studentId: string,
    zoomId?: string,
    passcode?: string,
    linkZoom?: string,
  ) {
    const room = await this.roomsRepository
      .createQueryBuilder('room')
      .leftJoinAndSelect('room.subject', 'subject')
      .leftJoinAndSelect('room.students', 'student')
      .leftJoinAndSelect('student.images', 'imageData')
      .where('student.studentId = :studentId', { studentId })
      .andWhere(
        new Brackets((qb) => {
          qb.where('room.zoomId = :zoomId AND room.passcode =:passcode', {
            zoomId,
            passcode,
          }).orWhere('room.url = :linkZoom', { linkZoom });
        }),
      )
      .andWhere(
        new Brackets((qb) => {
          qb.where(
            'room.checkInStartTime < :currentTime AND room.checkInEndTime > :currentTime',
            {
              currentTime: new Date(),
            },
          ).orWhere(
            'room.checkInStartTime < :currentTime AND room.checkInEndTime IS NULL',
            { currentTime: new Date() },
          );
        }),
      )
      .getOne();
    if (!room)
      throw new BadRequestException(
        'Thông tin phòng zoom không chính xác hoặc chưa đến giờ định danh',
      );
    return room;
  }

  async getMyRooms(studentId: string) {
    const rooms = await this.roomsRepository
      .createQueryBuilder('room')
      .leftJoinAndSelect('room.subject', 'subject')
      .leftJoinAndSelect('room.students', 'student')
      .leftJoinAndSelect('student.images', 'imageData')
      .where('student.studentId = :studentId', { studentId })
      .getMany();

    return rooms;
  }

  async uploadFile(fileLoad: any) {
    try {
      const file = reader.readFile(fileLoad.path);
      let data = [];
      const sheets = file.SheetNames;
      for (let i = 0; i < sheets.length; i++) {
        const temp = reader.utils.sheet_to_json(
          file.Sheets[file.SheetNames[i]],
        );
        temp.forEach((res) => {
          data.push({
            name: res['tenphongthi'],
            zoomId: res['zoomid'],
            passcode: res['matkhau'],
            url: res['linkzoom'],
            roomCode: res['phongthi'],
            subjectCode: res['mamh'],
          });
        });
      }
      fs.unlinkSync(fileLoad.path);
      await this.createMany(data);
    } catch (error) {
      console.log(error.message);

      throw error;
    }
  }
  async createMany(list) {
    const queryRunner = this.connection.createQueryRunner();

    try {
      await queryRunner.connect();
      await queryRunner.startTransaction();
      for (let i = 0; i < list.length; i++) {
        const room = new ZoomRoom();
        assignPartialsToThis(room, list[i]);
        if (list[i].subjectCode) {
          const subject = await this.subjectService.findOneWithCode(
            list[i].subjectCode,
          );
          if (subject) room.subject = subject;
        }
        await queryRunner.manager.save(room);
      }
      await queryRunner.commitTransaction();
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }
  async deletes(ids: number[]) {
    const queryRunner = this.connection.createQueryRunner();

    try {
      await queryRunner.connect();
      await queryRunner.startTransaction();
      await queryRunner.manager.delete(ZoomRoom, ids);
      await queryRunner.commitTransaction();
      return true;
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }
}
