export {};

declare global {
  interface Window {
    utm_pixel?:
      | {
          (action: string, eventName: string): void;
          queue?: any[];
        }
      | {
          track: (eventName: string, params?: { [key: string]: any }) => void;
          queue?: any[];
        };
    fbq?: (
      type: "track",
      eventName: string,
      params?: { [key: string]: any }
    ) => void;
    gtag?: (
      type: "event",
      eventName: string,
      params?: { [key: string]: any }
    ) => void;
  }
}
