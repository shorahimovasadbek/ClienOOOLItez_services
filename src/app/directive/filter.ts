import { Pipe, PipeTransform } from '@angular/core';
import { DatePipe } from '@angular/common';
import { DomSanitizer } from '@angular/platform-browser';
import { LocalStorageService } from '../services/localstorage.service';

@Pipe({
  name: 'filter'
})
export class FilterPipe implements PipeTransform {

  transform(items: any, filter: any): any {
    if (filter && Array.isArray(items)) {
      let filterKeys = Object.keys(filter);
      return items.filter(item =>
        filterKeys.reduce((memo, keyName) =>
          (memo && (filter[keyName] === item[keyName])) || filter[keyName] === "", true));
    } else
      return items;
  }

}

@Pipe({
  name: 'groupBy'
})
export class GroupBy implements PipeTransform {
  transform(collection: any, property: any): any {
    if (!collection)
      return null;

    const groupedCollection = collection.reduce((previous: any, current: any) => {
      if (!previous[current[property]])
        previous[current[property]] = [current];
      else
        previous[current[property]].push(current);

      return previous;
    }, {});

    return Object.keys(groupedCollection).map(key => ({ key, value: groupedCollection[key] }));

  }
}

@Pipe({
  name: 'isEmpty'
})
export class IsEmptyPipe implements PipeTransform {

  transform(items: any): any {
    if (items.length > 0) {
      let data: any = [];
      items.filter((item: any) => {
        if (item.count > 0) {
          if (item.data[0].length != 0)
            data.push(item);
        }
      });
      return data;
    }
  }

}

@Pipe({
  name: 'total'
})
export class TotalPipe implements PipeTransform {

  transform(data: any, key: string): any {
    if (data) {
      var total = 0;
      for (var i = 0; i < data.length; i++) {
        total += Number(data[i][key]);
      }
      return total;
    }
  }

}

@Pipe({
  name: 'searching'
})
export class SearchPipe implements PipeTransform {

  transform(items: any, term: string): any {
    if (!term || !items) return items;

    return SearchPipe.filter(items, term);
  }

  static filter(items: Array<{ [key: string]: any }>, term: string): Array<{ [key: string]: any }> {

    const toCompare = term.toLowerCase();

    return items.filter(function (item: any) {
      for (let property in item) {
        if (item[property] === null) {
          continue;
        }
        if (item[property].toString().toLowerCase().includes(toCompare)) {
          return true;
        }
      }
      return false;
    });
  }
}

@Pipe({
  name: 'time'
})
export class TimePipe implements PipeTransform {
  transform(date: any, format: string): any {
    var datePipe = new DatePipe("en-US");
    var dateFormat = date.replace(' ', 'T');
    dateFormat = (new Date(dateFormat).getTime()) - new Date(dateFormat).getTimezoneOffset();
    return datePipe.transform(dateFormat, format);
  }
}

@Pipe({
  name: 'numformat'
})
export class NumformatPipe implements PipeTransform {

  transform(number: any): any {
    if (number) {
      var result;
      var res = number.split(".");
      if (res && res[1]) {
        if (res[1].length == 1)
          result = number + '0';
        if (res[1].length > 1)
          result = number;
      } else
        result = number;

      return result;
    }
  }

}

@Pipe({
  name: 'last_seen'
})
export class LastSeenPipe implements PipeTransform {
  transform(minutes: any): any {
    if (minutes) {
      var result;
      if (minutes < 2)
        result = '1 minute ago';
      if (minutes <= 59)
        result = minutes + ' minutes ago';
      if (minutes > 59 && minutes < 120)
        result = '1 hour ago';
      if (minutes > 119 && minutes < 1440) {
        var hour = Math.round(minutes / 60);
        result = hour + ' hours ago';
      }
      if (minutes > 1439 && minutes < 2880)
        result = '1 day ago';
      if (minutes > 2879 && minutes < 43200) {
        var day = Math.round(minutes / (60 * 24));
        result = day + ' days ago';
      }
      if (minutes >= 43200 && minutes < 86400)
        result = '1 month ago';
      if (minutes > 86399)
        result = 'Long time ago';

      return result;
    }
  }
}

@Pipe({
  name: 'safeUrl'
})
export class SafeUrlPipe implements PipeTransform {
  constructor(private domSanitizer: DomSanitizer) { }
  transform(url: any) {
    return this.domSanitizer.bypassSecurityTrustResourceUrl(url);
  }
}

@Pipe({
  name: 'orderBy'
})
export class OrderBy implements PipeTransform {
  transform(obj: any, orderFields: string): any {

    var orderType = 'ASC';

    if (orderFields[0] === '-') {
      orderFields = orderFields.substring(1);
      orderType = 'DESC';
    }

    obj.sort(function (a: any, b: any) {
      if (orderType === 'ASC') {
        if (a[orderFields] < b[orderFields]) return -1;
        if (a[orderFields] > b[orderFields]) return 1;
        return 0;
      } else {
        if (a[orderFields] < b[orderFields]) return 1;
        if (a[orderFields] > b[orderFields]) return -1;
        return 0;
      }
    });
    return obj;
  }
}

@Pipe({
  name: 'counts'
})
export class CountsPipe implements PipeTransform {

  constructor(private localStorage: LocalStorageService) { }

  transform(count: number, type: string): any {
    if (type) {
      let title;
      var lang = this.localStorage.getItem('curLang');

      if (type == 'new') {
        if (lang == 'uz')
          title = 'yangi';
        if (count == 1 && lang == 'ru')
          title = 'новый';
        else if (count > 1 && count < 5 && lang == 'ru')
          title = 'новых';
        else if (count >= 5 && lang == 'ru')
          title = 'новые';
      }

      if (type == 'contact') {
        if (lang == 'uz')
          title = 'kontakt';
        if (count == 1 && lang == 'ru')
          title = 'контакт';
        else if (count > 1 && count < 5 && lang == 'ru')
          title = 'контакта';
        else if (count >= 5 && lang == 'ru')
          title = 'контактов';
      }

      var result = count + ' ' + title;
      return result;
    }
  }

}