import { SetMetadata } from '@nestjs/common';

export const IGNORE_TRANSLATION = 'IGNORE_TRANSLATION';

export const IgnoreTranslation = () => SetMetadata(IGNORE_TRANSLATION, true);
