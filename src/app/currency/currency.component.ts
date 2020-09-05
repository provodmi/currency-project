import {Component, OnInit} from '@angular/core';
import {Currency, CurrencyService} from './currency.service';
import {iif, interval, Observable, throwError, timer} from 'rxjs';
import {catchError, map, repeatWhen, shareReplay, switchMap, switchMapTo} from 'rxjs/operators';
import {FormControl} from '@angular/forms';

interface source {
  id: number,
  name: string,
  value: Observable<{[key: string]: Currency}>
}

@Component({
  selector: 'app-currency',
  templateUrl: './currency.component.html',
  styleUrls: ['./currency.component.scss']
})
export class CurrencyComponent implements OnInit {

  sourceList: source[] = [
    {
      id: 0,
      name: 'Источник 1 (json)',
      value: this.currencyService.getExchangeRatesJson()// .pipe(switchMapTo(throwError('err')))
    },
    {
      id: 1,
      name: 'Источник 2 (xml)',
      value: this.currencyService.getExchangeRatesXml()
    }
  ];
  exchangeRates: Observable<{[key: string]: Currency}>;
  sourceControl = new FormControl();

  euroRate: Observable<number>;

  constructor(private currencyService: CurrencyService) { }

  ngOnInit(): void {
    this.exchangeRates = this.sourceControl.valueChanges.pipe(
      switchMap((id) => this.getSource(id, this.sourceList)
        .pipe(repeatWhen(() => interval(10e3)))
      ),
      shareReplay(1)
    )

    this.euroRate = this.exchangeRates.pipe(map(currencies => currencies.EUR.Value))
  }

  getSource(id: number, sourceList: source[], attempt?: number): Observable<{[key: string]: Currency}> {
    return sourceList[id].value.pipe(
      catchError(() => iif(() => !attempt || attempt && attempt < 5,
        timer(300).pipe(switchMapTo(this.getSource((id + 1) % sourceList.length, sourceList,
          attempt ? ++attempt : 1))),
        throwError('Превышено максимальное количество попыток сменить источник данных'))),
    );
  }
}
