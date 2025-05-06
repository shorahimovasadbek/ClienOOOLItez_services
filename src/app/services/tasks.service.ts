
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { env } from '../../environments/environment';

@Injectable({
    providedIn: 'root'
})
export class TasksService {

    constructor(
        private http: HttpClient
    ) { }

    getTasks(data) {
        return this.http.get(env.apiUrl + `/api/client/task?page=${data.page}&per_page=${data.per_page}&status_list=${data.status_list}&search=${data.search}`);
    }
    getTaskCounts(data) {
        return this.http.get(env.apiUrl + `/api/client/task-count?status_list=${data.status_list}&search=${data.search}`);
    }
    getTask(id) {
        return this.http.get(env.apiUrl + `/api/client/task/${id}`);
    }
    postTask(data) {
        return this.http.post(env.apiUrl + '/api/client/task', data)
    }
    putTask(data) {
        return this.http.put(env.apiUrl + '/api/client/task/' + data.id, data)
    }
    patchTask(data) {
        return this.http.post(env.apiUrl + '/api/client/task-edit/' + data.id, data)
    }
    findInvoice(num) {
        return this.http.get(env.apiUrl + '/api/client/invoices-find?num=' + num)
    }
    getTaskCollegues() {
        return this.http.get(env.apiUrl + '/api/client/task-collegues')
    }
    addMessage(data) {
        return this.http.post(env.apiUrl + '/api/client/task-message/' + data.id, data)
    }
}