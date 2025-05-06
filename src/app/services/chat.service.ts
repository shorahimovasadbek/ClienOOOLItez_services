import { HttpClient } from "@angular/common/http";
import { Injectable } from "@angular/core";
import { env } from "../../environments/environment";

@Injectable({
    providedIn: 'root'
})

export class ChatService {

    constructor(private http: HttpClient) { }

    getChatUsers() {
        return this.http.get(`${env.apiUrl}/api/client/chat-users`);
    }
    getChatList(data) {
        return this.http.get(`${env.apiUrl}/api/client/chat?page=${data.page}&per_page=${data.per_page}&type=${data.type}&search=${data.search}`);
    }
    getChatById(id) {
        return this.http.get(`${env.apiUrl}/api/client/chat/${id}`);
    }
    postChat(data) {
        return this.http.post(`${env.apiUrl}/api/client/chat`,data);
    }
    postMessage(data) {
        return this.http.post(`${env.apiUrl}/api/client/chat-message`,data);
    }
    deleteChat(id) {
        return this.http.delete(`${env.apiUrl}/api/client/chat/${id}`);
    }
    deleteMessage(uuid) {
        return this.http.delete(`${env.apiUrl}/api/client/chat-message/${uuid}`);
    }
    getUsers() {
        return this.http.get(`${env.apiUrl}/api/client/chat-users`);
        
    }
}