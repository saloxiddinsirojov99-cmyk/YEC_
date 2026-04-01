import { ConfigService } from '@nestjs/config';
export declare class MailService {
    private readonly configService;
    private readonly logger;
    constructor(configService: ConfigService);
    sendOtpEmail(email: string, code: string): Promise<void>;
}
