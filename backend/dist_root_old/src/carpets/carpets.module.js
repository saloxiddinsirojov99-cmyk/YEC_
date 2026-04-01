"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CarpetsModule = void 0;
const common_1 = require("@nestjs/common");
const carpets_controller_1 = require("./carpets.controller");
const carpets_service_1 = require("./carpets.service");
let CarpetsModule = class CarpetsModule {
};
exports.CarpetsModule = CarpetsModule;
exports.CarpetsModule = CarpetsModule = __decorate([
    (0, common_1.Module)({
        controllers: [carpets_controller_1.CarpetsController],
        providers: [carpets_service_1.CarpetsService],
        exports: [carpets_service_1.CarpetsService],
    })
], CarpetsModule);
//# sourceMappingURL=carpets.module.js.map