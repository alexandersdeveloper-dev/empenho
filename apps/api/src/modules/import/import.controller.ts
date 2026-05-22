import {
  Controller,
  Post,
  UploadedFile,
  UseGuards,
  UseInterceptors,
  BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiBearerAuth, ApiConsumes, ApiTags } from '@nestjs/swagger';
import { ImportService } from './import.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';

const xlsxFilter = (_req: unknown, file: Express.Multer.File, cb: (err: Error | null, accept: boolean) => void) => {
  const allowed = [
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  ];
  if (!allowed.includes(file.mimetype)) {
    return cb(new BadRequestException('Apenas arquivos Excel (.xls, .xlsx) são aceitos'), false);
  }
  cb(null, true);
};

const uploadOpts = {
  storage: undefined, // memória (buffer)
  fileFilter: xlsxFilter,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
};

@ApiTags('import')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('superadmin', 'admin')
@Controller('import')
export class ImportController {
  constructor(private readonly service: ImportService) {}

  @Post('classificacao')
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(FileInterceptor('file', uploadOpts))
  classificacao(@UploadedFile() file: Express.Multer.File) {
    if (!file) throw new BadRequestException('Arquivo é obrigatório');
    return this.service.importarClassificacao(file.buffer);
  }

  @Post('credores')
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(FileInterceptor('file', uploadOpts))
  credores(@UploadedFile() file: Express.Multer.File) {
    if (!file) throw new BadRequestException('Arquivo é obrigatório');
    return this.service.importarCredores(file.buffer);
  }

  @Post('subelementos')
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(FileInterceptor('file', uploadOpts))
  subelementos(@UploadedFile() file: Express.Multer.File) {
    if (!file) throw new BadRequestException('Arquivo é obrigatório');
    return this.service.importarSubelementos(file.buffer);
  }

  @Post('retencoes')
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(FileInterceptor('file', uploadOpts))
  retencoes(@UploadedFile() file: Express.Multer.File) {
    if (!file) throw new BadRequestException('Arquivo é obrigatório');
    return this.service.importarRetencoes(file.buffer);
  }

  @Post('formas-pagamento')
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(FileInterceptor('file', uploadOpts))
  formasPagamento(@UploadedFile() file: Express.Multer.File) {
    if (!file) throw new BadRequestException('Arquivo é obrigatório');
    return this.service.importarFormasPagamento(file.buffer);
  }

  @Post('efd')
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(FileInterceptor('file', uploadOpts))
  efd(@UploadedFile() file: Express.Multer.File) {
    if (!file) throw new BadRequestException('Arquivo é obrigatório');
    return this.service.importarEfd(file.buffer);
  }
}
