import { Pipe, PipeTransform } from '@angular/core';

const TRANSLATIONS: Record<string, Record<string, string>> = {
  LOOKING_FOR_SERVICE: {
    bg: 'Търся услуга',
    en: 'Looking for service',
    de: 'Suche Dienstleistung'
  },
  SHARE_SERVICE: {
    bg: 'Предлагам услуга',
    en: 'Offering service',
    de: 'Biete Dienstleistung'
  },
  BUY: {
    bg: 'Купувам',
    en: 'Buy',
    de: 'Kaufe'
  },
  SELL: {
    bg: 'Продавам',
    en: 'Sell',
    de: 'Verkaufe'
  },
  OTHER: {
    bg: 'Друго',
    en: 'Other',
    de: 'Andere'
  }
};

@Pipe({
  name: 'requestTypeTranslate',
  standalone: true
})
export class RequestTypeTranslatePipe implements PipeTransform {
  transform(value: string, lang: 'bg' | 'en' | 'de' = 'bg'): string {
    return TRANSLATIONS[value]?.[lang] || value;
  }
}
