// types/web-push.d.ts
declare module 'web-push' {
  interface PushSubscription {
    endpoint: string
    keys: {
      p256dh: string
      auth: string
    }
  }

  interface RequestDetails {
    endpoint: string
    keys: {
      p256dh: string
      auth: string
    }
  }

  interface WebPushError extends Error {
    statusCode?: number
    body?: string
  }

  function setVapidDetails(
    subject: string,
    publicKey: string,
    privateKey: string,
  ): void

  function sendNotification(
    subscription: PushSubscription | RequestDetails,
    payload?: string,
    options?: any,
  ): Promise<void>

  const webPush: {
    setVapidDetails: typeof setVapidDetails
    sendNotification: typeof sendNotification
  }

  export default webPush
}
