// Add type definitions for global variables
declare global {
  interface Window {
    Echo: {
      channel(channel: string): {
        listen(event: string, callback: (data: any) => void): void;
        stopListening(event: string, callback?: (data: any) => void): void;
      };
      leaveChannel(channel: string): void;
    };
  }
}

export {}; // This file needs to be a module
