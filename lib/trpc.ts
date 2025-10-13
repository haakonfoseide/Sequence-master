import { createTRPCReact } from "@trpc/react-query";
import { httpLink } from "@trpc/client";
import type { AppRouter } from "@/backend/trpc/app-router";
import superjson from "superjson";
import { Platform } from "react-native";

export const trpc = createTRPCReact<AppRouter>();

const getBaseUrl = () => {
  try {
    const envUrl = process.env.EXPO_PUBLIC_RORK_API_BASE_URL;
    if (envUrl && typeof envUrl === "string" && envUrl.length > 0) {
      return envUrl;
    }
  } catch (e) {
    console.log("Env read failed:", e);
  }

  if (Platform.OS === "web" && typeof window !== "undefined") {
    return window.location.origin;
  }

  console.warn(
    "EXPO_PUBLIC_RORK_API_BASE_URL is not set. Falling back to default http://localhost:3000."
  );
  return "http://localhost:3000";
};

export const trpcClient = trpc.createClient({
  links: [
    httpLink({
      url: `${getBaseUrl()}/api/trpc`,
      transformer: superjson,
    }),
  ],
});
