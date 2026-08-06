export const EVENT_ENDED_BOOKING_MESSAGE =
  "This event has already ended and is no longer available for booking.";

const timePattern = /^([01]\d|2[0-3]):([0-5]\d)$/;

export const getEventEndDateTime = (
  eventDate: Date | string,
  endTime: string
) => {
  const timeMatch = timePattern.exec(endTime);

  if (!timeMatch) {
    return null;
  }

  const eventEndDate =
    eventDate instanceof Date
      ? new Date(eventDate)
      : new Date(eventDate);

  if (Number.isNaN(eventEndDate.getTime())) {
    return null;
  }

  const hours = Number(timeMatch[1]);
  const minutes = Number(timeMatch[2]);

  eventEndDate.setHours(hours, minutes, 0, 0);

  return eventEndDate;
};

export const hasEventEnded = (
  eventDate: Date | string,
  endTime: string,
  now = new Date()
) => {
  const eventEndDateTime = getEventEndDateTime(
    eventDate,
    endTime
  );

  return Boolean(
    eventEndDateTime &&
      eventEndDateTime.getTime() <= now.getTime()
  );
};

export const getStartOfDay = (date: Date) => {
  const startOfDay = new Date(date);

  startOfDay.setHours(0, 0, 0, 0);

  return startOfDay;
};

export const getEndOfDay = (date: Date) => {
  const endOfDay = new Date(date);

  endOfDay.setHours(23, 59, 59, 999);

  return endOfDay;
};
