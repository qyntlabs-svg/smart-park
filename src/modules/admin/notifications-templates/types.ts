// A-12 Notification Templates — domain types.

export type Channel = "push" | "sms" | "email";
export type Audience = "consumer" | "vendor" | "mechanic" | "worker";

export interface NotificationTemplate {
  id: string;
  name: string;
  channel: Channel;
  audience: Audience;
  subject?: string; // for email
  body: string; // supports {{variables}}
  variables: string[];
  updatedAt: string;
  updatedBy?: string;
}
