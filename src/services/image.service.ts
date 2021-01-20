import { Injectable, Logger } from '@nestjs/common';
import { UploadApiResponse, v2 } from 'cloudinary';
import { Config } from 'src/services/config.service';

@Injectable()
export class ImageService {
    private readonly logger = new Logger(ImageService.name);
    constructor(private config: Config) {
        v2.config(this.config.p.cloudinary);
    }

    async uploadCustomerIdImage(idImage: string): Promise<string> {
        this.logger.debug('Uploading Customer Image to cloudinary');
        const response: UploadApiResponse = await v2.uploader.upload(idImage);
        return response.secure_url;
    }
}
