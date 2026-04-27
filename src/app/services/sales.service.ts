import { Injectable } from '@angular/core';
import { HttpClient, HttpParams, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, retry } from 'rxjs/operators';
import { environment } from '../../environments/environment';

export interface HistoricalPoint {
  date: string; quantity: number; revenue: number; fitted: number;
}
export interface ForecastPoint {
  date: string; predicted_qty: number;
}
export interface ModelStats {
  slope: number; intercept: number; r_squared: number;
}
export interface PredictionResponse {
  product: string;
  historical: HistoricalPoint[];
  forecast: ForecastPoint[];
  model_stats: ModelStats;
}
export interface ProductsResponse {
  products: string[];
}

@Injectable({ providedIn: 'root' })
export class SalesService {
  private readonly baseUrl = environment.apiUrl;
  constructor(private http: HttpClient) {}

  getProducts(): Observable<ProductsResponse> {
    return this.http.get<ProductsResponse>(`${this.baseUrl}/products`)
      .pipe(retry(1), catchError(this.handleError));
  }

  getPrediction(product: string, months = 3): Observable<PredictionResponse> {
    const params = new HttpParams().set('product', product).set('months', months.toString());
    return this.http.get<PredictionResponse>(`${this.baseUrl}/predict`, { params })
      .pipe(retry(1), catchError(this.handleError));
  }

  private handleError(error: HttpErrorResponse): Observable<never> {
    let message = 'An unexpected error occurred.';
    if (error.status === 0) message = 'Cannot reach the server. Is Flask running on port 5000?';
    else if (error.error?.error) message = error.error.error;
    return throwError(() => new Error(message));
  }
}
