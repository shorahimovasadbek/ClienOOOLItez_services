import { Injectable } from "@angular/core";
import { HttpClient, HttpHeaders } from "@angular/common/http";
import { env } from "../../environments/environment";

@Injectable({
  providedIn: "root",
})
export class TicketService {
    constructor(
        private http: HttpClient
    ) {}

    getTickets() {
     return this.http.get(env.apiUrl + '/api/client/ticket')
    }
    getTicket(ticket_id) {
      return this.http.get(env.apiUrl + '/api/client/ticket/'+ticket_id)
     }
    postTicket(data) {
      return this.http.post(env.apiUrl + '/api/client/ticket',data)
    }
    putTicket(data) {
      return this.http.put(env.apiUrl + '/api/client/ticket/'+data.ticket_id,data)
    }
    deleteTicket(ticket_id) {
      return this.http.delete(env.apiUrl+ '/api/client/ticket/'+ticket_id);
    }
    closeTicket(ticket_id) {
      return this.http.put(env.apiUrl+ '/api/client/ticket-update-status/'+ticket_id,{status: 'closed'});
    }
    updateTicket(data) {
      return this.http.put(env.apiUrl+ '/api/client/ticket-update-data/'+data.id,data);
    }
    deleteMessage(message_id) {
      return this.http.delete(env.apiUrl + '/api/client/ticket-message/'+message_id);
    }
  }