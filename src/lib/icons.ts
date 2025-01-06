// lib/icons.ts
import { IconName } from '@/types/icons';
import * as LucideIcons from 'lucide-react';

export const ALL_ICON_NAMES: IconName[] = Object.keys(LucideIcons)
  .filter(name => !name.endsWith('Icon') && !name.startsWith('Lucide')) as IconName[];