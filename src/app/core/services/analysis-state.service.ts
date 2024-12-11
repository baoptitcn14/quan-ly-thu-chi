import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class AnalysisStateService {
  private isAnalyzing = new BehaviorSubject<boolean>(false);

  setAnalyzing(value: boolean) {
    this.isAnalyzing.next(value);
  }

  getAnalyzing(): Observable<boolean> {
    return this.isAnalyzing.asObservable();
  }
} 