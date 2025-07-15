import { Injectable, Inject, Optional } from '@angular/core';
import { MomentDateAdapter, MAT_MOMENT_DATE_ADAPTER_OPTIONS, MatMomentDateAdapterOptions } from '@angular/material-moment-adapter';
import { MAT_DATE_LOCALE } from '@angular/material/core';
import * as moment from 'moment';
import 'moment/locale/bg';

@Injectable()
export class BulgarianMomentDateAdapter extends MomentDateAdapter {
  
  constructor(
    @Optional() @Inject(MAT_DATE_LOCALE) matDateLocale: string,
    @Optional() @Inject(MAT_MOMENT_DATE_ADAPTER_OPTIONS) options?: MatMomentDateAdapterOptions
  ) {
    super(matDateLocale, options);
    
    // Задаване на български locale
    moment.locale('bg');
    
    // Конфигуриране на седмицата да започва от понеделник
    moment.updateLocale('bg', {
      week: {
        dow: 1, // Понеделник като първи ден (0 = неделя, 1 = понеделник)
        doy: 4  // Първата седмица от годината съдържа 4-ти януари
      },
      weekdays: ['неделя', 'понеделник', 'вторник', 'сряда', 'четвъртък', 'петък', 'събота'],
      weekdaysShort: ['нед', 'пон', 'вт', 'ср', 'чет', 'пет', 'съб'],
      weekdaysMin: ['н', 'п', 'в', 'с', 'ч', 'п', 'с'],
      months: ['януари', 'февруари', 'март', 'април', 'май', 'юни', 'юли', 'август', 'септември', 'октомври', 'ноември', 'декември'],
      monthsShort: ['ян', 'фев', 'мар', 'апр', 'май', 'юни', 'юли', 'авг', 'сеп', 'окт', 'ное', 'дек']
    });
    
    // Задаване на локала за този адаптер
    this.setLocale('bg');
  }

  override getFirstDayOfWeek(): number {
    // Форсиране на понеделник като първи ден от седмицата
    return 1; // 0 = неделя, 1 = понеделник
  }

  override getDayOfWeekNames(style: 'long' | 'short' | 'narrow'): string[] {
    const dayNames = super.getDayOfWeekNames(style);
    // Преподреждане на дните да започват от понеделник
    return [dayNames[1], dayNames[2], dayNames[3], dayNames[4], dayNames[5], dayNames[6], dayNames[0]];
  }
}
