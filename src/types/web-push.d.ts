declare module "web-push" {
  interface VapidDetails {
    subject: string;
    publicKey: string;
    privateKey: string;
  }

  interface PushSubscription {
    endpoint: string;
    keys?: {
      p256dh?: string;
      auth?: string;
    };
  }

  interface NotificationOptions {
    title: string;
    body?: string;
    icon?: string;
    badge?: string;
    image?: string;
    tag?: string;
    renotify?: boolean;
    silent?: boolean;
    timestamp?: number;
    data?: unknown;
  }

  interface WebPushResult {
    statusCode: number;
    body: string;
    headers: Record<string, string>;
  }

  function setVapidDetails(subject: string, publicKey: string, privateKey: string): void;
  function sendNotification(subscription: PushSubscription, payload: string | Buffer): Promise<WebPushResult>;
  function generateVapidKeys(): { publicKey: string; privateKey: string };

  export { setVapidDetails, sendNotification, generateVapidKeys };
  export type { VapidDetails, PushSubscription, NotificationOptions, WebPushResult };
}
