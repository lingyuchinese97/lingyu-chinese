import type { Messages } from "../vi";

export const pages: Messages["pages"] = {
  error500: "Error 500",
  errorTitle: "Something went wrong",
  errorDesc: "Sorry, something went wrong while showing this page. Please try again.",
  errorCode: "Error code: {code}",
  retry: "Try again",
  globalErrorDesc: "Something went wrong. Please reload the page.",
  error404: "Error 404",
  notFoundTitle: "Page not found",
  notFoundDesc: "The page you're looking for doesn't exist or has moved.",
  goHome: "Go to home page",
  offlineTitle: "You're offline",
  offlineDesc:
    "No internet connection. Check your Wi-Fi or mobile data and try again — your data is still safe on the server.",
};
