import { Image, View } from 'react-native';
import { SvgXml } from 'react-native-svg';
import { serviceColors, type ServiceFamily } from '../../../theme';
import { AuriaIcon, type AuriaIconName } from '../../icons';
import { SERVICE_BRAND_SVGS, type BrandService } from './serviceBrandMarks';

const GOOGLE_DRIVE = require('../../../../assets/brand/google-drive.png');

/** Backend service ids that share another product's logo. */
const BRAND_ALIASES: Record<string, BrandService> = {
  'outlook-calendar': 'outlook',
  'outlook-contacts': 'outlook',
  'google-contacts': 'google-calendar',
};

const FAMILY_ICON: Record<ServiceFamily, AuriaIconName> = {
  mail: 'mail',
  calendar: 'calendar',
  contacts: 'users',
  tasks: 'listCheck',
  knowledge: 'folder',
  document: 'document',
  memory: 'database',
  web: 'globe',
  team: 'briefcase',
  roadmap: 'flag',
  workspace: 'grid',
  auria: 'sparkles',
};

const own = (map: object, key: string) => Object.prototype.hasOwnProperty.call(map, key);

type AuriaServiceMarkProps = {
  /** As the backend sends it in `tool.service` (`gmail`, `outlook`, `tasks`…). */
  service: string;
  size?: number;
};

/**
 * The mark of a service the Auria touched: the product's own logo (Gmail,
 * Outlook, Google Calendar…) or, when only the family is known, a neutral
 * glyph — saying "Gmail" when it may have been Outlook would claim a mailbox
 * that wasn't read. Decorative: the step label says what it is.
 */
export function AuriaServiceMark({ service, size = 16 }: AuriaServiceMarkProps) {
  const brand = (own(SERVICE_BRAND_SVGS, service) ? service : own(BRAND_ALIASES, service) ? BRAND_ALIASES[service] : undefined) as
    | BrandService
    | undefined;
  const family: ServiceFamily = own(FAMILY_ICON, service) ? (service as ServiceFamily) : 'auria';
  const kind = brand ?? (service === 'google-drive' ? 'google-drive' : family);

  return (
    <View
      style={{ width: size, height: size }}
      testID={`service-mark-${kind}`}
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
    >
      {brand ? (
        <SvgXml xml={SERVICE_BRAND_SVGS[brand]} width={size} height={size} />
      ) : kind === 'google-drive' ? (
        <Image source={GOOGLE_DRIVE} style={{ width: size, height: size }} resizeMode="contain" />
      ) : (
        <AuriaIcon name={FAMILY_ICON[family]} size={size} color={serviceColors[family]} strokeWidth={1.9} />
      )}
    </View>
  );
}
