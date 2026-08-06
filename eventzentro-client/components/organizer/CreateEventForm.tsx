"use client";

import {
  type ChangeEvent,
  useEffect,
  useRef,
  useState,
} from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import {
  Controller,
  useForm,
} from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import DatePicker from "react-datepicker";
import axios from "axios";
import { toast } from "sonner";
import {
  CalendarPlus,
  ImagePlus,
  LoaderCircle,
  Trash2,
} from "lucide-react";

import api from "@/lib/axios";
import {
  createEventSchema,
  type CreateEventSchema,
} from "@/lib/validations/event";
import {
  createEvent,
  uploadEventImage,
} from "@/services/event.service";

interface Category {
  _id: string;
  name: string;
}

const inputClassName =
  "w-full rounded-lg border-2 border-slate-400 bg-white px-3 py-2.5 text-sm font-medium text-slate-900 outline-none transition placeholder:text-slate-400 hover:border-slate-500 focus:border-orange-500 focus:ring-2 focus:ring-orange-100";

const labelClassName =
  "mb-1.5 block text-sm font-bold text-slate-700";

const errorClassName =
  "mt-1 text-xs font-medium text-red-500";

const allowedImageTypes = [
  "image/jpeg",
  "image/png",
  "image/webp",
];

const maxImageSizeInBytes = 5 * 1024 * 1024;

const formatDateValue = (date: Date) => {
  const year = date.getFullYear();

  const month = String(
    date.getMonth() + 1
  ).padStart(2, "0");

  const day = String(
    date.getDate()
  ).padStart(2, "0");

  return `${year}-${month}-${day}`;
};

const parseDateValue = (
  value: string
) => {
  if (!value) {
    return null;
  }

  return new Date(
    `${value}T00:00:00`
  );
};

const formatTimeValue = (date: Date) => {
  const hours = String(
    date.getHours()
  ).padStart(2, "0");

  const minutes = String(
    date.getMinutes()
  ).padStart(2, "0");

  return `${hours}:${minutes}`;
};

const parseTimeValue = (
  value: string
) => {
  if (!value) {
    return null;
  }

  const [hours, minutes] = value
    .split(":")
    .map(Number);

  const date = new Date();

  date.setHours(
    hours,
    minutes,
    0,
    0
  );

  return date;
};

export default function CreateEventForm() {
  const router = useRouter();
  const fileInputRef =
    useRef<HTMLInputElement>(null);

  const [categories, setCategories] =
    useState<Category[]>([]);

  const [
    loadingCategories,
    setLoadingCategories,
  ] = useState(true);

  const [selectedImage, setSelectedImage] =
    useState<File | null>(null);

  const [imagePreview, setImagePreview] =
    useState<string | null>(null);

  const [isUploading, setIsUploading] =
    useState(false);

  useEffect(() => {
    const loadCategories = async () => {
      try {
        const response =
          await api.get("/categories");

        const result = response.data;

        const categoryList = Array.isArray(result)
          ? result
          : Array.isArray(result.data)
            ? result.data
            : Array.isArray(result.categories)
              ? result.categories
              : [];

        setCategories(categoryList);
      } catch {
        toast.error(
          "Failed to load categories"
        );
      } finally {
        setLoadingCategories(false);
      }
    };

    void loadCategories();
  }, []);

  useEffect(() => {
    return () => {
      if (imagePreview) {
        URL.revokeObjectURL(imagePreview);
      }
    };
  }, [imagePreview]);

  const {
    register,
    control,
    handleSubmit,
    formState: {
      errors,
      isSubmitting,
    },
  } = useForm<CreateEventSchema>({
    resolver: zodResolver(
      createEventSchema
    ),
    defaultValues: {
      title: "",
      description: "",
      category: "",
      city: "",
      venue: "",
      eventDate: "",
      startTime: "",
      endTime: "",
      ticketPrice: 0,
      totalTickets: 1,
      bannerImage: "",
      bannerImagePublicId: "",
    },
  });

  const resetImageInput = () => {
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const openImageSelector = () => {
    resetImageInput();
    fileInputRef.current?.click();
  };

  const handleImageChange = (
    event: ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];

    if (!file) {
      return;
    }

    if (!allowedImageTypes.includes(file.type)) {
      toast.error(
        "Only JPG, PNG, and WEBP images are allowed."
      );
      resetImageInput();
      return;
    }

    if (file.size > maxImageSizeInBytes) {
      toast.error(
        "Banner image must be 5 MB or smaller."
      );
      resetImageInput();
      return;
    }

    const previewUrl =
      URL.createObjectURL(file);

    setSelectedImage(file);
    setImagePreview(previewUrl);
  };

  const handleRemoveImage = () => {
    setSelectedImage(null);
    setImagePreview(null);
    resetImageInput();
  };

  const onSubmit = async (
    data: CreateEventSchema
  ) => {
    try {
      let eventData = data;

      if (selectedImage) {
        setIsUploading(true);

        const uploadResponse =
          await uploadEventImage(selectedImage);

        eventData = {
          ...data,
          bannerImage:
            uploadResponse.image.url,
          bannerImagePublicId:
            uploadResponse.image.publicId,
        };

        setIsUploading(false);
      }

      const response =
        await createEvent(eventData);

      toast.success(
        response.message ||
          "Event created successfully",
        response.event?._id
          ? {
              action: {
                label:
                  "Create discount offer",
                onClick: () =>
                  router.push(
                    `/organizer/coupons/create?eventId=${response.event._id}`
                  ),
              },
            }
          : undefined
      );

      router.push(
        "/organizer/events"
      );
    } catch (error: unknown) {
      if (axios.isAxiosError(error)) {
        toast.error(
          error.response?.data
            ?.message ||
            "Failed to create event"
        );

        return;
      }

      toast.error(
        error instanceof Error
          ? error.message
          : "Something went wrong"
      );
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      className="rounded-xl border-2 border-orange-300 bg-white p-4 shadow-sm sm:p-5"
    >
      <div className="grid grid-cols-1 gap-x-4 gap-y-3 md:grid-cols-12">
        <div className="md:col-span-8">
          <label
            htmlFor="title"
            className={labelClassName}
          >
            Event title
          </label>

          <input
            id="title"
            type="text"
            {...register("title")}
            placeholder="Enter event title"
            className={inputClassName}
          />

          {errors.title && (
            <p className={errorClassName}>
              {errors.title.message}
            </p>
          )}
        </div>

        <div className="md:col-span-4">
          <label
            htmlFor="category"
            className={labelClassName}
          >
            Category
          </label>

          <select
            id="category"
            {...register("category")}
            disabled={
              loadingCategories ||
              categories.length === 0
            }
            className={inputClassName}
          >
            <option value="">
              {loadingCategories
                ? "Loading categories..."
                : categories.length === 0
                  ? "No categories available"
                  : "Select category"}
            </option>

            {categories.map(
              (category) => (
                <option
                  key={category._id}
                  value={category.name}
                >
                  {category.name}
                </option>
              )
            )}
          </select>

          {errors.category && (
            <p className={errorClassName}>
              {errors.category.message}
            </p>
          )}
        </div>

        <div className="md:col-span-6">
          <label
            htmlFor="description"
            className={labelClassName}
          >
            Description
          </label>

          <textarea
            id="description"
            {...register("description")}
            rows={3}
            placeholder="Describe your event"
            className={`${inputClassName} h-[82px] resize-none`}
          />

          {errors.description && (
            <p className={errorClassName}>
              {errors.description.message}
            </p>
          )}
        </div>

        <div className="md:col-span-3">
          <label
            htmlFor="city"
            className={labelClassName}
          >
            City
          </label>

          <input
            id="city"
            type="text"
            {...register("city")}
            placeholder="Kochi"
            className={inputClassName}
          />

          {errors.city && (
            <p className={errorClassName}>
              {errors.city.message}
            </p>
          )}
        </div>

        <div className="md:col-span-3">
          <label
            htmlFor="venue"
            className={labelClassName}
          >
            Venue
          </label>

          <textarea
            id="venue"
            {...register("venue")}
            rows={3}
            placeholder="Enter exact venue"
            className={`${inputClassName} h-[82px] resize-none`}
          />

          {errors.venue && (
            <p className={errorClassName}>
              {errors.venue.message}
            </p>
          )}
        </div>

        <div className="md:col-span-4">
          <label className={labelClassName}>
            Event date
          </label>

          <Controller
            name="eventDate"
            control={control}
            render={({ field }) => (
              <DatePicker
                selected={parseDateValue(
                  field.value
                )}
                onChange={(
                  date: Date | null
                ) => {
                  field.onChange(
                    date
                      ? formatDateValue(date)
                      : ""
                  );
                }}
                onCalendarClose={
                  field.onBlur
                }
                dateFormat="dd MMM yyyy"
                minDate={new Date()}
                placeholderText="Select event date"
                className={
                  inputClassName
                }
                wrapperClassName="w-full"
                showPopperArrow={false}
                calendarStartDay={1}
              />
            )}
          />

          {errors.eventDate && (
            <p className={errorClassName}>
              {errors.eventDate.message}
            </p>
          )}
        </div>

        <div className="md:col-span-4">
          <label className={labelClassName}>
            Start time
          </label>

          <Controller
            name="startTime"
            control={control}
            render={({ field }) => (
              <DatePicker
                selected={parseTimeValue(
                  field.value
                )}
                onChange={(
                  time: Date | null
                ) => {
                  field.onChange(
                    time
                      ? formatTimeValue(time)
                      : ""
                  );
                }}
                onCalendarClose={
                  field.onBlur
                }
                showTimeSelect
                showTimeSelectOnly
                timeIntervals={15}
                timeCaption="Start time"
                timeFormat="h:mm aa"
                dateFormat="h:mm aa"
                placeholderText="Select start time"
                className={
                  inputClassName
                }
                wrapperClassName="w-full"
                showPopperArrow={false}
              />
            )}
          />

          {errors.startTime && (
            <p className={errorClassName}>
              {errors.startTime.message}
            </p>
          )}
        </div>

        <div className="md:col-span-4">
          <label className={labelClassName}>
            End time
          </label>

          <Controller
            name="endTime"
            control={control}
            render={({ field }) => (
              <DatePicker
                selected={parseTimeValue(
                  field.value
                )}
                onChange={(
                  time: Date | null
                ) => {
                  field.onChange(
                    time
                      ? formatTimeValue(time)
                      : ""
                  );
                }}
                onCalendarClose={
                  field.onBlur
                }
                showTimeSelect
                showTimeSelectOnly
                timeIntervals={15}
                timeCaption="End time"
                timeFormat="h:mm aa"
                dateFormat="h:mm aa"
                placeholderText="Select end time"
                className={
                  inputClassName
                }
                wrapperClassName="w-full"
                showPopperArrow={false}
              />
            )}
          />

          {errors.endTime && (
            <p className={errorClassName}>
              {errors.endTime.message}
            </p>
          )}
        </div>

        <div className="md:col-span-3">
          <label
            htmlFor="ticketPrice"
            className={labelClassName}
          >
            Ticket price
          </label>

          <input
            id="ticketPrice"
            type="number"
            min="0"
            step="0.01"
            {...register(
              "ticketPrice",
              {
                valueAsNumber: true,
              }
            )}
            placeholder="0"
            className={inputClassName}
          />

          {errors.ticketPrice && (
            <p className={errorClassName}>
              {
                errors.ticketPrice
                  .message
              }
            </p>
          )}
        </div>

        <div className="md:col-span-3">
          <label
            htmlFor="totalTickets"
            className={labelClassName}
          >
            Total tickets
          </label>

          <input
            id="totalTickets"
            type="number"
            min="1"
            {...register(
              "totalTickets",
              {
                valueAsNumber: true,
              }
            )}
            placeholder="1"
            className={inputClassName}
          />

          {errors.totalTickets && (
            <p className={errorClassName}>
              {
                errors.totalTickets
                  .message
              }
            </p>
          )}
        </div>

        <div className="md:col-span-6">
          <label
            className={labelClassName}
          >
            Banner image
          </label>

          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            disabled={
              isSubmitting || isUploading
            }
            onChange={handleImageChange}
            className="hidden"
          />

          <div className="rounded-lg border-2 border-dashed border-slate-300 bg-slate-50 p-3 transition hover:border-orange-300">
            {imagePreview ? (
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                <Image
                  src={imagePreview}
                  alt="Selected event banner preview"
                  width={160}
                  height={112}
                  unoptimized
                  className="h-28 w-full rounded-lg border border-slate-200 object-cover sm:w-40"
                />

                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-bold text-slate-800">
                    {selectedImage?.name}
                  </p>

                  <p className="mt-1 text-xs font-medium text-slate-500">
                    JPG, PNG, or WEBP up to 5 MB
                  </p>

                  <div className="mt-3 flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={openImageSelector}
                      disabled={
                        isSubmitting ||
                        isUploading
                      }
                      className="inline-flex items-center gap-2 rounded-lg border-2 border-slate-300 bg-white px-3 py-2 text-xs font-bold text-slate-700 transition hover:border-orange-400 hover:text-orange-600 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      <ImagePlus size={15} />
                      Choose another
                    </button>

                    <button
                      type="button"
                      onClick={handleRemoveImage}
                      disabled={
                        isSubmitting ||
                        isUploading
                      }
                      className="inline-flex items-center gap-2 rounded-lg border-2 border-red-200 bg-white px-3 py-2 text-xs font-bold text-red-600 transition hover:border-red-300 hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      <Trash2 size={15} />
                      Remove
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <button
                type="button"
                onClick={openImageSelector}
                disabled={
                  isSubmitting ||
                  isUploading
                }
                className="flex w-full flex-col items-center justify-center rounded-lg border border-slate-200 bg-white px-4 py-4 text-center transition hover:border-orange-400 hover:bg-orange-50 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <ImagePlus
                  size={24}
                  className="text-orange-500"
                />

                <span className="mt-2 text-sm font-bold text-slate-800">
                  Select banner image
                </span>

                <span className="mt-1 text-xs font-medium text-slate-500">
                  JPG, PNG, or WEBP up to 5 MB
                </span>
              </button>
            )}
          </div>

          {(errors.bannerImage ||
            errors.bannerImagePublicId) && (
            <p className={errorClassName}>
              {errors.bannerImage?.message ||
                errors.bannerImagePublicId
                  ?.message}
            </p>
          )}
        </div>

        <div className="flex flex-col-reverse gap-3 border-t-2 border-slate-200 pt-3 md:col-span-12 sm:flex-row sm:justify-end">
          <button
            type="button"
            onClick={() =>
              router.push(
                "/organizer/events"
              )
            }
            disabled={
              isSubmitting || isUploading
            }
            className="rounded-lg border-2 border-slate-400 bg-white px-6 py-2.5 text-sm font-bold text-slate-700 transition hover:border-slate-500 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Cancel
          </button>

          <button
            type="submit"
            disabled={
              isSubmitting ||
              isUploading ||
              loadingCategories ||
              categories.length === 0
            }
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-gradient-to-r from-orange-500 to-red-500 px-6 py-2.5 text-sm font-bold text-white shadow-sm transition hover:shadow-md disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isUploading ? (
              <>
                <LoaderCircle
                  size={17}
                  className="animate-spin"
                />
                Uploading image...
              </>
            ) : isSubmitting ? (
              <>
                <LoaderCircle
                  size={17}
                  className="animate-spin"
                />
                Creating...
              </>
            ) : (
              <>
                <CalendarPlus
                  size={17}
                />
                Create Event
              </>
            )}
          </button>
        </div>
      </div>
    </form>
  );
}
