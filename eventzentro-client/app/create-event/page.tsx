"use client";

import { useState } from "react";
import { createEvent } from "@/services/event.service";

export default function CreateEventPage() {
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    category: "",
    city: "",
    venue: "",
    eventDate: "",
    startTime: "",
    endTime: "",
    ticketPrice: 0,
    totalTickets: 0,
  });

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    setFormData({
      ...formData,
      [e.target.name]:
        e.target.type === "number"
          ? Number(e.target.value)
          : e.target.value,
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const response = await createEvent(formData);

      console.log(response);

      alert("Event Created Successfully!");

      setFormData({
        title: "",
        description: "",
        category: "",
        city: "",
        venue: "",
        eventDate: "",
        startTime: "",
        endTime: "",
        ticketPrice: 0,
        totalTickets: 0,
      });
    } catch (error) {
      console.error(error);
      alert("Failed to create event");
    }
  };

  return (
    <div className="mx-auto max-w-3xl p-6">
      <h1 className="mb-6 text-3xl font-bold">
        Create Event
      </h1>

      <form
        onSubmit={handleSubmit}
        className="space-y-4"
      >
        <input
          type="text"
          name="title"
          placeholder="Title"
          value={formData.title}
          onChange={handleChange}
          className="w-full rounded border p-3"
        />

        <textarea
          name="description"
          placeholder="Description"
          value={formData.description}
          onChange={handleChange}
          className="w-full rounded border p-3"
        />

        <input
          type="text"
          name="category"
          placeholder="Category"
          value={formData.category}
          onChange={handleChange}
          className="w-full rounded border p-3"
        />

        <input
          type="text"
          name="city"
          placeholder="City"
          value={formData.city}
          onChange={handleChange}
          className="w-full rounded border p-3"
        />

        <input
          type="text"
          name="venue"
          placeholder="Venue"
          value={formData.venue}
          onChange={handleChange}
          className="w-full rounded border p-3"
        />

        <input
          type="date"
          name="eventDate"
          value={formData.eventDate}
          onChange={handleChange}
          className="w-full rounded border p-3"
        />

        <input
          type="time"
          name="startTime"
          value={formData.startTime}
          onChange={handleChange}
          className="w-full rounded border p-3"
        />

        <input
          type="time"
          name="endTime"
          value={formData.endTime}
          onChange={handleChange}
          className="w-full rounded border p-3"
        />

        <input
          type="number"
          name="ticketPrice"
          placeholder="Ticket Price"
          value={formData.ticketPrice}
          onChange={handleChange}
          className="w-full rounded border p-3"
        />

        <input
          type="number"
          name="totalTickets"
          placeholder="Total Tickets"
          value={formData.totalTickets}
          onChange={handleChange}
          className="w-full rounded border p-3"
        />

        <button
          type="submit"
          className="rounded bg-blue-600 px-6 py-3 text-white"
        >
          Create Event
        </button>
      </form>
    </div>
  );
}
