import type { Messages } from "../vi";

export const notifications: Messages["notifications"] = {
  title: "Notifications",
  titleUnread: "Notifications ({count} unread)",
  empty: "You have no new notifications.",
  grammarShare: "{who} shared a grammar point with you.",
  grammarShareAccepted: "{who} accepted the grammar point you shared.",
  grammarShareRejected: "{who} declined the grammar point you shared.",
  vocabShare: "{who} shared {count, plural, one {# word} other {# words}} with you.",
  vocabShareAccepted: "{who} accepted {count, plural, one {# word} other {# words}} you shared.",
  vocabShareRejected: "{who} declined the words you shared.",
  viewAndAccept: "View & accept",
};
