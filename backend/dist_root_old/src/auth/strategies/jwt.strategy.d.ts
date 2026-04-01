import { ConfigService } from '@nestjs/config';
import { UserRole } from '@prisma/client';
import { Strategy } from 'passport-jwt';
interface JwtPayload {
    sub: string;
    email: string;
    role: UserRole;
}
declare const JwtStrategy_base: new (...args: [opt: import("passport-jwt").StrategyOptionsWithRequest] | [opt: import("passport-jwt").StrategyOptionsWithoutRequest]) => Strategy & {
    validate(...args: any[]): unknown;
};
export declare class JwtStrategy extends JwtStrategy_base {
    constructor(configService: ConfigService);
    validate(payload: JwtPayload): JwtPayload;
}
export {};
