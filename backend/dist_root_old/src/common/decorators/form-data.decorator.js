"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.FormDataRequest = void 0;
const common_1 = require("@nestjs/common");
const platform_express_1 = require("@nestjs/platform-express");
const swagger_1 = require("@nestjs/swagger");
const FormDataRequest = () => (0, common_1.applyDecorators)((0, swagger_1.ApiConsumes)('multipart/form-data'), (0, common_1.UseInterceptors)((0, platform_express_1.AnyFilesInterceptor)()));
exports.FormDataRequest = FormDataRequest;
//# sourceMappingURL=form-data.decorator.js.map