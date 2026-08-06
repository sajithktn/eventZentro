import { IEvent } from "../interfaces/event.interface";
import Event from "../models/event.model";
import {
  getEndOfDay,
  hasEventEnded,
} from "../utils/eventLifecycle";
import {
  syncFeaturedEventRequestStates,
} from "./featuredEvent.service";

let lifecycleInterval: NodeJS.Timeout | null = null;
let isLifecycleSyncRunning = false;

export const completePublishedEventIfEnded =
  async (event: IEvent, now = new Date()) => {
    if (
      event.status !== "published" ||
      !hasEventEnded(
        event.eventDate,
        event.endTime,
        now
      )
    ) {
      return false;
    }

    event.status = "completed";
    await event.save();
    await syncFeaturedEventRequestStates(now);

    return true;
  };

export const markEndedEventsAsCompleted =
  async (now = new Date()) => {
    const candidateEvents = await Event.find({
      status: "published",
      eventDate: {
        $lte: getEndOfDay(now),
      },
    }).select("_id eventDate endTime");

    const endedEventIds = candidateEvents
      .filter((event) =>
        hasEventEnded(
          event.eventDate,
          event.endTime,
          now
        )
      )
      .map((event) => event._id);

    if (endedEventIds.length === 0) {
      return {
        matchedCount: 0,
        modifiedCount: 0,
      };
    }

    const result = await Event.updateMany(
      {
        _id: {
          $in: endedEventIds,
        },
        status: "published",
      },
      {
        $set: {
          status: "completed",
        },
      }
    );

    await syncFeaturedEventRequestStates(now);

    return {
      matchedCount: result.matchedCount,
      modifiedCount: result.modifiedCount,
    };
  };

const syncEventLifecycle = async () => {
  if (isLifecycleSyncRunning) {
    return;
  }

  isLifecycleSyncRunning = true;

  try {
    await markEndedEventsAsCompleted();
    await syncFeaturedEventRequestStates();
  } catch (error) {
    console.error(
      "Failed to update completed events:",
      error
    );
  } finally {
    isLifecycleSyncRunning = false;
  }
};

export const startEventLifecycleScheduler = () => {
  if (lifecycleInterval) {
    return;
  }

  void syncEventLifecycle();

  lifecycleInterval = setInterval(() => {
    void syncEventLifecycle();
  }, 60_000);
};
