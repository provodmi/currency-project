import {Injectable} from '@angular/core';
import {Observable} from 'rxjs';
import {HttpClient} from '@angular/common/http';
import {map} from 'rxjs/operators';

export interface Currency {
  CharCode: string,
  Id: string,
  Name: string,
  Nominal: number,
  NumCode: string,
  Previous?: number,
  Value: number
}

@Injectable({
  providedIn: 'root'
})
export class CurrencyService {

  constructor(private http: HttpClient) {
  }

  getExchangeRatesJson(): Observable<{ [key: string]: Currency }> {
    return this.http.get('/currency-api/daily_json.js').pipe(map((value) => value['Valute']));
  }

  getExchangeRatesXml(): Observable<{ [key: string]: Currency }> {
    const currencyReducer = (acc, oldVal) => {
      const newVal = Object.keys(oldVal).reduce((acc2, key) => {
        if (key === '@attributes') {
          acc2['Id'] = oldVal[key].ID;
        } else {
          acc2[key] = ['Nominal', 'Previous', 'Value'].includes(key)
            ? +oldVal[key]['#text'].replace(',', '.')
            : oldVal[key]['#text'];
        }
        return acc2;
      }, {}) as Currency;
      acc[newVal.CharCode] = newVal;
      return acc;
    };

    return this.http.get('/currency-api/daily_utf8.xml', {observe: 'response', responseType: 'text'})
      .pipe(
        map(res => {
          const parser = new DOMParser();
          return this.xmlToObject(parser.parseFromString(res.body, 'text/xml'));
        }),
        map((value) => {
          const Valute = value['ValCurs']['Valute'];
          return Valute.reduce(currencyReducer, {});
        })
      );
  }


  xmlToObject(xml): {} {
    let obj = {};
    if (xml.nodeType === 1) {
      // element
      // do attributes
      if (xml.attributes.length > 0) {
        obj['@attributes'] = {};
        for (let j = 0; j < xml.attributes.length; j++) {
          const attribute = xml.attributes.item(j);
          obj['@attributes'][attribute.nodeName] = attribute.nodeValue;
        }
      }
    } else if (xml.nodeType === 3) {
      // text
      obj = xml.nodeValue;
    }

    if (xml.hasChildNodes()) {
      for (let i = 0; i < xml.childNodes.length; i++) {
        const item = xml.childNodes.item(i);
        const nodeName = item.nodeName;
        if (typeof (obj[nodeName]) === 'undefined') {
          obj[nodeName] = this.xmlToObject(item);
        } else {
          if (typeof (obj[nodeName].push) === 'undefined') {
            const old = obj[nodeName];
            obj[nodeName] = [];
            obj[nodeName].push(old);
          }
          obj[nodeName].push(this.xmlToObject(item));
        }
      }
    }
    return obj;
  }
}
