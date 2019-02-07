import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';

@Injectable({
  providedIn: 'root'  // TODO check if that's the best solution
})
export class DatastoreService {
  constructor(protected http: HttpClient) { }
}
