import { Component, OnInit } from '@angular/core';
import {CurrencyService} from './currency.service';
import {forkJoin} from 'rxjs';

@Component({
  selector: 'app-currency',
  templateUrl: './currency.component.html',
  styleUrls: ['./currency.component.scss']
})
export class CurrencyComponent implements OnInit {


  constructor(private currencyService: CurrencyService) { }

  ngOnInit(): void {
    forkJoin([this.currencyService.getExchangeRatesJson(), this.currencyService.getExchangeRatesXml()]).subscribe(data => {
      console.log(data);
    });
  }
}
