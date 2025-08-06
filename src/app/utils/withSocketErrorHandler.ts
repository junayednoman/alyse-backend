export const withSocketErrorHandler = (handler: any) => {
  return async (data: any, ack?: any) => {
    try {
      await handler(data, ack);
    } catch (error: any) {
      // Send error back to client
      if (ack && typeof ack === "function") {
        return ack({ success: false, message: error?.message || "Something went wrong" });
      }

      // If no ack, emit error to socket manually
      if (this && (this as any)?.emit) {
        (this as any)?.emit("error", error?.message || "Unknown error");
      }
    }
  };
};
