import api from "../lib/api";

let cachedInterviews = null;
let listeners = new Set();
let pendingPromise = null;

export const interviewHistoryService = {
  async getHistory(forceRefresh = false) {
    if (cachedInterviews !== null && !forceRefresh) {
      return cachedInterviews;
    }
    if (pendingPromise) {
      return pendingPromise;
    }

    pendingPromise = (async () => {
      try {
        const response = await api.get("/interview/completed");
        cachedInterviews = response.data || [];
        this.notify();
        return cachedInterviews;
      } finally {
        pendingPromise = null;
      }
    })();

    return pendingPromise;
  },

  clearCache() {
    cachedInterviews = null;
    this.notify();
  },

  subscribe(listener) {
    listeners.add(listener);
    // If cache is loaded, trigger immediately for the subscriber
    if (cachedInterviews !== null) {
      listener(cachedInterviews);
    }
    return () => {
      listeners.delete(listener);
    };
  },

  notify() {
    for (const listener of listeners) {
      listener(cachedInterviews);
    }
  }
};
