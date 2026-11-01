/** Tab badge counts; module hooks feed these as modules land (inbox pending, unread notifications). */
export function useTabBadges(): { inbox: number } {
  return { inbox: 0 };
}
