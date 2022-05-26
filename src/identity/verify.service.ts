/* eslint-disable @typescript-eslint/no-empty-function */
import { BadRequestException, Injectable } from '@nestjs/common';
import * as faceapi from '@vladmandic/face-api';
import fetch from 'node-fetch';
import * as canvas from 'canvas';
import { VerifyStudentDto } from './dto/verify-student.dto';
import { RoomsService } from 'src/rooms/room.service';
import * as fs from 'fs';
import { IdentityRecordService } from 'src/identity_record/identity-record.service';
import { CreateIdentityRecordDto } from 'src/identity_record/dto/create-identity-record.dto';
import { ImagesService } from 'src/image/image.service';
import { ImageType } from 'src/image/decorator/image-type.enum';
//import { join } from 'path';
const { Canvas, Image, ImageData } = canvas;
//import * as streamToBlob from 'stream-to-blob';

//import '@tensorflow/tfjs-node';
// Make face-api.js use that fetch implementation
faceapi.env.monkeyPatch({ Canvas, Image, ImageData, fetch } as any);
@Injectable()
export class VerifyService {
  constructor(
    private roomsService: RoomsService,
    private identiyRecordService: IdentityRecordService,
    private imageService: ImagesService,
  ) {}
  async verify(file: any, verifyStudentDto: VerifyStudentDto, images) {
    const { roomId, studentId } = verifyStudentDto;
    const MODEL_URL = './models';
    await faceapi.nets.tinyFaceDetector.loadFromDisk(MODEL_URL);
    await faceapi.nets.faceLandmark68Net.loadFromDisk(MODEL_URL);
    await faceapi.nets.faceRecognitionNet.loadFromDisk(MODEL_URL);
    await faceapi.nets.faceExpressionNet.loadFromDisk(MODEL_URL);
    await faceapi.nets.ssdMobilenetv1.loadFromDisk(MODEL_URL);
    //Fetch images

    const labeledFaceDescriptors = await Promise.all(
      [studentId].map(async (label) => {
        const descriptions = [];
        await Promise.all(
          images.map(async (image) => {
            const img = await canvas.loadImage(
              `./public/images/${image.imageId}.jpg`,
            );

            const detections = await faceapi
              .detectSingleFace(img as any)
              .withFaceLandmarks()
              .withFaceDescriptor();
            descriptions.push(detections.descriptor);
          }),
        );

        return new faceapi.LabeledFaceDescriptors(label, descriptions);
      }),
    );

    const faceMatcher = new faceapi.FaceMatcher(labeledFaceDescriptors, 0.6);
    const currentImage = await canvas.loadImage(file.path);

    const displaySize = { width: 640, height: 480 };
    const detections = await faceapi
      .detectAllFaces(currentImage as any)
      .withFaceLandmarks()
      .withFaceDescriptors();
    const resizedDetections = faceapi.resizeResults(detections, displaySize);
    const results = resizedDetections.map((d) =>
      faceMatcher.findBestMatch(d.descriptor),
    );
    //fs.unlinkSync(file.path);

    const imageResult = await this.imageService.createIdentiyResultImage(
      file,
      ImageType.FACE_RESULT,
    );

    images.forEach((img) => {
      fs.unlinkSync(`./public/images/${img.imageId}.jpg`);
    });
    const verifiedStatus =
      results.length == 0 ? false : results[0].label == studentId;
    const createRecordDto = new CreateIdentityRecordDto();
    const room = await this.roomsService.findOne(roomId);
    createRecordDto.roomId = room.id;
    createRecordDto.studentId = studentId;
    createRecordDto.zoomEmail = '18120486@student.hcmus.edu.vn';
    createRecordDto.status = verifiedStatus;
    createRecordDto.faceImage = imageResult;
    const res = await this.identiyRecordService.create(createRecordDto);
    return res;
  }
}
