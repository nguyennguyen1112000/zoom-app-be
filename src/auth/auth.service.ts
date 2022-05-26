import { forwardRef, Inject, Injectable } from '@nestjs/common';
import { UsersService } from '../users/users.service';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { User } from 'src/users/entities/user.entity';
import { UserStatus } from 'src/users/decorator/user-status.enum';
import { UpdateAccountStatusDto } from 'src/users/dto/update-account-status.dto';
import { ZoomsService } from 'src/zoom/zoom.service';
import { StudentsService } from 'src/student/student.service';
import { UserRole } from 'src/users/decorator/user.enum';
@Injectable()
export class AuthService {
  constructor(
    @Inject(forwardRef(() => UsersService))
    private usersService: UsersService,
    private jwtService: JwtService,
    private zoomsService: ZoomsService,
    private studentService: StudentsService,
  ) {}

  async validateUser(email: string, pass: string): Promise<any> {
    const user = await this.usersService.findOne(email);
    if (
      user &&
      (await bcrypt.compare(pass, user.password)) &&
      user.status == UserStatus.ACTIVE
    ) {
      const { password, ...result } = user;
      return result;
    }
    return null;
  }

  async validateZoomUser(code: string): Promise<any> {
    const res = await this.zoomsService.getAccessToken(code);
    if (res.access_token) {
      const user = await this.zoomsService.profile(res.access_token);
      const admin = await this.usersService.findOne(user.email);
      const student = await this.studentService.findOneWithNoError(
        user.email.split('@')[0],
      );
      if (admin) {
        const { password, ...result } = admin;
        return { ...user, ...admin };
      } else if (student) {
        return {
          ...user,
          role: UserRole.STUDENT,
          studentId: user.email.split('@')[0],
        };
      }
    }
    return null;
  }

  async login(user: any) {
    const payload = {
      email: user.email,
      sub: user.id,
      studentId: user.studentId,
      role: user.role,
      accessToken: user.access_token,
      refresh_token: user.refresh_token,
    };
    return {
      access_token: this.jwtService.sign(payload),
      user: user,
    };
  }

  async generateToken(user: any) {
    const payload = {
      email: user.email,
      sub: user.id,
      studentId: user.studentId,
      role: user.role,
    };
    return this.jwtService.sign(payload);
  }
}
