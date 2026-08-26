import {
  ArgumentMetadata,
  BadRequestException,
  Injectable,
  PipeTransform,
} from '@nestjs/common';

const FORBIDDEN = ['isDeleted', 'deletedAt', 'deletedBy'];

@Injectable()
export class ForbidDeletedFieldsPipe implements PipeTransform {
  transform(value: object, metadata: ArgumentMetadata) {
    // Only inspect the request body — allow query/param/custom metadata
    if (metadata?.type !== 'body') return value;

    if (value && typeof value === 'object') {
      const found = FORBIDDEN.filter((k) => k in value);
      if (found.length) {
        throw new BadRequestException(`Forbidden fields: ${found.join(', ')}`);
      }
    }
    return value;
  }
}
