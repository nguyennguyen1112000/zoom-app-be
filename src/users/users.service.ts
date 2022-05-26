/* eslint-disable prefer-const */
import {
  BadRequestException,
  ForbiddenException,
  forwardRef,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Brackets, Repository } from 'typeorm';
import { CreateUserDto } from './dto/create-user.dto';
import { User } from './entities/user.entity';
import * as bcrypt from 'bcrypt';
import { AuthService } from 'src/auth/auth.service';
import { UserStatus } from './decorator/user-status.enum';
@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private usersRepository: Repository<User>,
    @Inject(forwardRef(() => AuthService))
    private authService: AuthService,
  ) {}
  async create(createUserDto: CreateUserDto) {
    try {
      const {
        email,
        firstName,
        lastName,
        password,
        role,
        gender,
        googleId,
        imageUrl,
        birthday,
      } = createUserDto;
      const account = await this.usersRepository.findOne({
        where: { email: email },
      });
      if (account) throw new BadRequestException('Email account existed');
      let user = new User();
      if (password) {
        const saltOrRounds = 10;
        const hash = await bcrypt.hash(password, saltOrRounds);
        user.password = hash;
      } else if (googleId) {
        user.googleId = googleId;
      }
      if (!googleId) user.status = UserStatus.PENDING;

      user.email = email;
      user.firstName = firstName;
      user.lastName = lastName;
      user.gender = gender;
      user.role = role;
      user.birthday = birthday;
      if (imageUrl) user.imageUrl = imageUrl;
      const saveUser = await this.usersRepository.save(user);
      return saveUser;
    } catch (err) {
      throw new BadRequestException(err.message);
    }
  }

  async findOne(email: string) {
    return await this.usersRepository.findOne({ where: { email: email } });
  }

  async updateMoodleAccount(id: number, username: string, password: string) {
    try {
      const user = await this.usersRepository.findOne(id);
      if (!user) throw new NotFoundException(`User not found. Id = ${id}`);
      user.moodleUsername = username;
      user.moodlePassword = password;
      return await this.usersRepository.save(user);
    } catch (error) {
      throw error;
    }
  }

  // async profile(id: number) {
  //   const user = await this.findById(id);
  //   if (!user) throw new NotFoundException(`User not found. Id = ${id}`);
  //   return user;
  // }

  // async canUpdateStudentId(userId: number, studentId: string) {
  //   const user = await this.usersRepository.findOne({ studentId });
  //   if (user && user.id != userId) return false;
  //   return true;
  // }
  // async updateStudentId(
  //   currentUser: User,
  //   updateStudentIdDto: UpdateStudentIdDto,
  // ) {
  //   try {
  //     const { studentId, userId } = updateStudentIdDto;

  //     let userToUpdate;
  //     if (currentUser.role == UserRole.ADMIN) {
  //       if (!(await this.canUpdateStudentId(userId, studentId)))
  //         throw new BadRequestException(`MSSV đã tồn tại`);
  //       userToUpdate = await this.findById(userId);
  //     } else {
  //       if (!(await this.canUpdateStudentId(currentUser.id, studentId)))
  //         throw new BadRequestException(`MSSV đã tồn tại`);
  //       userToUpdate = await this.findById(currentUser.id);
  //     }
  //     userToUpdate.studentId = studentId;
  //     await this.usersRepository.save(userToUpdate);
  //   } catch (error) {
  //     console.log(error.message);
  //     throw error;
  //   }
  // }

  // async updateAccountStatus(
  //   currentUser: User,
  //   updateAccountStatusDto: UpdateAccountStatusDto,
  // ) {
  //   try {
  //     const { userId, status } = updateAccountStatusDto;
  //     if (userId == currentUser.id && currentUser.role == UserRole.ADMIN)
  //       throw new ForbiddenException(
  //         'Admin không thể cập nhật trạng thái của mình',
  //       );
  //     const userToUpdate = await this.findById(userId);
  //     userToUpdate.status = status;
  //     await this.usersRepository.save(userToUpdate);
  //   } catch (error) {
  //     console.log(error.message);
  //     throw error;
  //   }
  // }
}
