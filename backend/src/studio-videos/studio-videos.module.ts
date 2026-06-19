import { Module } from '@nestjs/common';
import { StudioVideosController } from './studio-videos.controller';
import { StudioVideosService } from './studio-videos.service';

@Module({
  controllers: [StudioVideosController],
  providers:   [StudioVideosService],
})
export class StudioVideosModule {}
