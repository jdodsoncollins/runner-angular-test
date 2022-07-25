import { TagService, Title } from './tag.service';
import { Component, OnDestroy, OnInit } from '@angular/core';
import {FormControl} from '@angular/forms';
import {MatSnackBar} from '@angular/material/snack-bar';
import { LocalService } from './local.service';
import { combineLatestWith, debounce, distinctUntilChanged, filter, map, mergeMap, mergeWith, takeUntil } from 'rxjs/operators';
import { Subject, Observable, timer } from 'rxjs';

@Component({
  selector: 'tag',
  template: `
    <form class="search-form flex flex-col align-center" (ngSubmit)="saveTags()">
      <mat-form-field class="flex flex-fill">
        <input type="text" placeholder="Start Typing" matInput [formControl]="searchControl" [matAutocomplete]="auto">
        <mat-autocomplete #auto="matAutocomplete" [panelWidth]="400">
          <mat-option *ngFor="let option of filteredTags" [value]="option['name']" (onSelectionChange)="selectOption(option)">
            {{option['name']}}
          </mat-option>
        </mat-autocomplete>
      </mat-form-field>
      <mat-form-field class="flex flex-fill" appearance="fill">
        <mat-label>Tags</mat-label>
        <mat-chip-list #chipList aria-label="Fruit selection">
          <mat-chip *ngFor="let option of selectedTags" (removed)="removeTag(option)">
            {{option['name']}}
            <button matChipRemove>
              <mat-icon>cancel</mat-icon>
            </button>
          </mat-chip>
        </mat-chip-list>
      </mat-form-field>
      <div >
        <button mat-button color="primary" [disabled]="!selectedTags.length" type="submit">Save</button>
        <button mat-button color="accent" [disabled]="!selectedTags.length" (click)="clear()">Clear All</button>
      </div>
    </form> 
  `,
  styles: [`
  /* copying some tailwind-style css classes  */
    .flex {
      display: flex
    }  
    .flex-col {
      flex-direction: column
    }
    .flex-row {
      flex-direction: row
    }
    .flex-fill {
      flex: 0 0 100%; 
    }
    .align-center {
      align-items: center
    }
  `],
})
export class TagComponent implements OnInit, OnDestroy {

  constructor(private tagService: TagService, private localService: LocalService, private snackBar: MatSnackBar) {
  }

  searchControl = new FormControl();
  filteredTags?: Record<string, any>[];
  selectedTags: Record<string, any>[] = [];
  private unsubscribe$: Subject<void> = new Subject();
  valueChange$: Observable<string> = this.searchControl.valueChanges
  titles$: Observable<Title[]> = this.tagService.getTitles()

  ngOnInit() {
    this.loadDataFromStorage();
    this.valueChange$.pipe(
      filter(val => val.length >= 3),
      takeUntil(this.unsubscribe$),
      debounce(() => timer(300)),
      distinctUntilChanged(),
      combineLatestWith(this.titles$),
      map(([term, titles]: [string, Title[]]) => {
        this.filteredTags = titles.filter(item => item.name.toLocaleLowerCase().includes(term.toLowerCase()) && !this.selectedTags.find(selectedOption => selectedOption['id'] === item.id));
        return titles
      })).subscribe()
  }

  loadDataFromStorage() {
    try {
      const lsData = this.localService.getData('savedTags');
      this.selectedTags = JSON.parse(lsData!) || []
    } catch (e) {
      console.log('Failed to load from localstorage');
    }
  }

  selectOption(option: Record<string, any>) {
    this.selectedTags.push(option);
  }

  removeTag(tag: Record<string, any>) {
    this.selectedTags = this.selectedTags.filter(filteredTag => tag['id'] !== filteredTag['id'])
  }

  saveTags() {
    this.localService.saveData('savedTags', JSON.stringify(this.selectedTags));
    this.snackBar.open('Saved tags to browser local storage');
  }

  clear() {
    this.selectedTags = [];
    this.localService.removeItem('savedTags');
    this.snackBar.open('Cleared tags and browser local storage');
  }

  ngOnDestroy() {
    this.unsubscribe$.next();
    this.unsubscribe$.complete();
  }
}