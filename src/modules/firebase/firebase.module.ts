import { Module } from '@nestjs/common';
import FirebaseService from './firebase.service';

@Module({
  imports : [],
  exports: [FirebaseService],
  providers: [FirebaseService],
  controllers: [],
})
export class FirebaseModule { }
