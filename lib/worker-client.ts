
export interface WorkerMessage {
  id: string;
  result?: unknown;
  error?: string;
}

export class WorkerClient {
  private callbacks = new Map<string, (msg: WorkerMessage) => void>();
  private idCounter = 0;

  constructor(private worker: Worker) {
    this.worker.onmessage = (e: MessageEvent<WorkerMessage>) => {
      const { id } = e.data;
      const cb = this.callbacks.get(id);
      if (cb) {
        cb(e.data);
        this.callbacks.delete(id);
      }
    };
  }

  invoke<T = unknown>(type: string, data?: any): Promise<T> {
    return new Promise((resolve, reject) => {
      const id = `${this.idCounter++}`;
      this.callbacks.set(id, (msg) => {
        if (msg.error) reject(new Error(msg.error));
        else resolve(msg.result as T);
      });
      this.worker.postMessage({ id, type, data });
    });
  }
}

