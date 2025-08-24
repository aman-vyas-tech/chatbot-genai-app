import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../environments/environment';
import { Observable, map } from 'rxjs';
import type { Message, ChatResponse } from './chat.model';

@Injectable({ providedIn: 'root' })
export class ChatService {
  private http = inject(HttpClient);
  private base = environment.apiBaseUrl;

  send(messages: Message[], model?: string, temperature = 0.4): Observable<ChatResponse> {
    return this.http.post<ChatResponse>(`${this.base}/api/chat`, {
      messages,
      model,
      temperature
    });
  }

  // Streaming via SSE
  stream(messages: Message[], model?: string, temperature = 0.4): Observable<string> {
    return new Observable<string>((subscriber) => {
      const controller = new AbortController();

      fetch(`${this.base}/api/chat/stream`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages, model, temperature, stream: true }),
        signal: controller.signal
      })
        .then(async (res) => {
          if (!res.body) throw new Error('No stream body');
          const reader = res.body.getReader();
          const decoder = new TextDecoder();

          while (true) {
            const { value, done } = await reader.read();
            if (done) break;
            const chunk = decoder.decode(value, { stream: true });

            // SSE frames separated by \n\n
            const events = chunk.split('\n\n').filter(Boolean);
            for (const evt of events) {
              if (evt.startsWith('data:')) {
                const data = evt.slice(5).trim();
                try {
                  const json = JSON.parse(data);
                  if (json.delta) subscriber.next(json.delta as string);
                  if (json.done) subscriber.complete();
                } catch {
                  // ignore non-JSON keepalives
                }
              }
            }
          }
          subscriber.complete();
        })
        .catch((err) => subscriber.error(err));

      return () => controller.abort();
    }).pipe(map((delta) => delta));
  }
}