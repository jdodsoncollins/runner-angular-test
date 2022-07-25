import { Injectable } from '@angular/core';
import { titles } from './data/titles';
import {  Observable, of } from 'rxjs';

export interface Title {
    id: string,
    name: string,
    level_1_title: string | null,
    full_name: string,
    external_id: number,
    season_number: string | null,
    episode_number: string | null,
    title_level: number | null
}

@Injectable({
    providedIn: 'root',
  })
  export class TagService {
    private titles: Observable<Title[]> = of(titles); // using of to pretend its an API response, which would return as an observable

    getTitles() {
      return this.titles // for a real API, this would return a httpClient.get 
    }

  }