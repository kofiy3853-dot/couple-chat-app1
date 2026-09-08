export type CallStatus =
  | "idle"
  | "outgoing"
  | "incoming"
  | "connecting"
  | "active"
  | "ended";

export interface CallState {
  status: CallStatus;
  conversationId: string | null;
  partnerUserId: string | null;
  partnerName: string | null;
  partnerImage: string | null;
  startedAt: number | null;
}

export interface CallOfferPayload {
  conversationId: string;
  callerId: string;
  callerName: string;
  callerImage: string | null;
  offer: RTCSessionDescriptionInit;
}

export interface CallAnswerPayload {
  conversationId: string;
  answer: RTCSessionDescriptionInit;
}

export interface CallIceCandidatePayload {
  conversationId: string;
  candidate: RTCIceCandidateInit;
}

export interface CallRejectPayload {
  conversationId: string;
}

export interface CallEndPayload {
  conversationId: string;
  userId: string;
}
