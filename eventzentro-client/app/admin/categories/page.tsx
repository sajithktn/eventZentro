"use client";

import {
  useCallback,
  useEffect,
  useState,
} from "react";
import axios from "axios";
import { toast } from "sonner";
import {
  Check,
  LoaderCircle,
  Pencil,
  Plus,
  RefreshCw,
  Tags,
  Trash2,
  X,
} from "lucide-react";

import {
  createAdminCategory,
  deleteAdminCategory,
  getAdminCategories,
  updateAdminCategory,
  updateAdminCategoryStatus,
  type AdminCategory,
} from "@/services/admin.service";

const getErrorMessage = (
  error: unknown,
  fallback: string
) => {
  if (axios.isAxiosError(error)) {
    return (
      error.response?.data?.message ||
      fallback
    );
  }

  return error instanceof Error
    ? error.message
    : fallback;
};

export default function AdminCategoriesPage() {
  const [categories, setCategories] =
    useState<AdminCategory[]>([]);

  const [name, setName] = useState("");
  const [editingId, setEditingId] =
    useState<string | null>(null);

  const [editingName, setEditingName] =
    useState("");

  const [loading, setLoading] =
    useState(true);

  const [creating, setCreating] =
    useState(false);

  const [actionId, setActionId] =
    useState<string | null>(null);

  const loadCategories = useCallback(
    async () => {
      try {
        setLoading(true);

        const response =
          await getAdminCategories();

        setCategories(
          response.categories ||
            response.data ||
            []
        );
      } catch (error) {
        toast.error(
          getErrorMessage(
            error,
            "Unable to load categories."
          )
        );
      } finally {
        setLoading(false);
      }
    },
    []
  );

  useEffect(() => {
    void loadCategories();
  }, [loadCategories]);

  const handleCreate = async () => {
    const categoryName = name.trim();

    if (!categoryName) {
      toast.error(
        "Enter a category name."
      );
      return;
    }

    try {
      setCreating(true);

      const response =
        await createAdminCategory(
          categoryName
        );

      toast.success(response.message);
      setName("");

      await loadCategories();
    } catch (error) {
      toast.error(
        getErrorMessage(
          error,
          "Unable to create category."
        )
      );
    } finally {
      setCreating(false);
    }
  };

  const handleUpdate = async (
    categoryId: string
  ) => {
    const categoryName =
      editingName.trim();

    if (!categoryName) {
      toast.error(
        "Enter a category name."
      );
      return;
    }

    try {
      setActionId(categoryId);

      const response =
        await updateAdminCategory(
          categoryId,
          categoryName
        );

      toast.success(response.message);

      setEditingId(null);
      setEditingName("");

      await loadCategories();
    } catch (error) {
      toast.error(
        getErrorMessage(
          error,
          "Unable to update category."
        )
      );
    } finally {
      setActionId(null);
    }
  };

  const handleStatus = async (
    category: AdminCategory
  ) => {
    try {
      setActionId(category._id);

      const response =
        await updateAdminCategoryStatus(
          category._id,
          !category.isActive
        );

      toast.success(response.message);

      await loadCategories();
    } catch (error) {
      toast.error(
        getErrorMessage(
          error,
          "Unable to update category status."
        )
      );
    } finally {
      setActionId(null);
    }
  };

  const handleDelete = async (
    category: AdminCategory
  ) => {
    const confirmed = window.confirm(
      `Delete "${category.name}"?`
    );

    if (!confirmed) return;

    try {
      setActionId(category._id);

      const response =
        await deleteAdminCategory(
          category._id
        );

      toast.success(response.message);

      await loadCategories();
    } catch (error) {
      toast.error(
        getErrorMessage(
          error,
          "Unable to delete category."
        )
      );
    } finally {
      setActionId(null);
    }
  };

  return (
    <div className="mx-auto max-w-7xl">
      <section className="rounded-[24px] border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
        <div className="flex flex-col justify-between gap-5 md:flex-row md:items-center">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.18em] text-orange-500">
              Event settings
            </p>

            <h2 className="mt-2 text-2xl font-black text-slate-950">
              Category Management
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              Manage the event categories
              available across the website.
            </p>
          </div>

          <button
            type="button"
            onClick={() =>
              void loadCategories()
            }
            disabled={loading}
            className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-slate-950 px-4 text-sm font-bold text-white transition hover:bg-orange-600 disabled:opacity-60"
          >
            <RefreshCw
              size={17}
              className={
                loading
                  ? "animate-spin"
                  : ""
              }
            />
            Refresh
          </button>
        </div>

        <div className="mt-6 flex flex-col gap-3 sm:flex-row">
          <input
            type="text"
            value={name}
            onChange={(event) =>
              setName(event.target.value)
            }
            onKeyDown={(event) => {
              if (event.key === "Enter") {
                void handleCreate();
              }
            }}
            placeholder="Enter category name"
            className="h-12 flex-1 rounded-xl border-2 border-slate-200 px-4 text-sm font-bold text-slate-900 outline-none transition focus:border-orange-400 focus:ring-4 focus:ring-orange-100"
          />

          <button
            type="button"
            onClick={() =>
              void handleCreate()
            }
            disabled={creating}
            className="inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-orange-500 to-red-500 px-5 text-sm font-black text-white disabled:opacity-60"
          >
            {creating ? (
              <LoaderCircle
                size={17}
                className="animate-spin"
              />
            ) : (
              <Plus size={17} />
            )}

            Add Category
          </button>
        </div>
      </section>

      <section className="mt-5 overflow-hidden rounded-[24px] border border-slate-200 bg-white shadow-sm">
        {loading ? (
          <div className="flex min-h-72 items-center justify-center gap-3 text-sm font-bold text-slate-500">
            <LoaderCircle
              size={22}
              className="animate-spin text-orange-500"
            />
            Loading categories...
          </div>
        ) : categories.length === 0 ? (
          <div className="px-6 py-20 text-center">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-orange-50 text-orange-500">
              <Tags size={30} />
            </div>

            <h3 className="mt-5 text-lg font-black text-slate-950">
              No categories found
            </h3>

            <p className="mt-2 text-sm text-slate-500">
              Create your first event
              category.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[760px] text-left">
              <thead className="border-b border-slate-200 bg-slate-50 text-xs font-black uppercase tracking-[0.14em] text-slate-500">
                <tr>
                  <th className="px-5 py-4">
                    Category
                  </th>

                  <th className="px-5 py-4">
                    Status
                  </th>

                  <th className="px-5 py-4">
                    Events
                  </th>

                  <th className="px-5 py-4 text-right">
                    Actions
                  </th>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-100">
                {categories.map(
                  (category) => {
                    const editing =
                      editingId ===
                      category._id;

                    const processing =
                      actionId ===
                      category._id;

                    return (
                      <tr
                        key={category._id}
                        className="transition hover:bg-orange-50/40"
                      >
                        <td className="px-5 py-4">
                          {editing ? (
                            <input
                              value={
                                editingName
                              }
                              onChange={(
                                event
                              ) =>
                                setEditingName(
                                  event
                                    .target
                                    .value
                                )
                              }
                              className="h-10 rounded-xl border-2 border-orange-300 px-3 text-sm font-bold outline-none"
                            />
                          ) : (
                            <p className="font-black text-slate-950">
                              {
                                category.name
                              }
                            </p>
                          )}
                        </td>

                        <td className="px-5 py-4">
                          <span
                            className={`inline-flex rounded-full px-3 py-1.5 text-xs font-black ${
                              category.isActive
                                ? "bg-emerald-50 text-emerald-600"
                                : "bg-slate-100 text-slate-600"
                            }`}
                          >
                            {category.isActive
                              ? "Active"
                              : "Inactive"}
                          </span>
                        </td>

                        <td className="px-5 py-4 text-sm font-bold text-slate-600">
                          {category.eventCount ??
                            0}
                        </td>

                        <td className="px-5 py-4">
                          <div className="flex justify-end gap-2">
                            {editing ? (
                              <>
                                <button
                                  type="button"
                                  onClick={() =>
                                    void handleUpdate(
                                      category._id
                                    )
                                  }
                                  disabled={
                                    processing
                                  }
                                  className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600"
                                >
                                  {processing ? (
                                    <LoaderCircle
                                      size={
                                        16
                                      }
                                      className="animate-spin"
                                    />
                                  ) : (
                                    <Check
                                      size={
                                        16
                                      }
                                    />
                                  )}
                                </button>

                                <button
                                  type="button"
                                  onClick={() => {
                                    setEditingId(
                                      null
                                    );
                                    setEditingName(
                                      ""
                                    );
                                  }}
                                  className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-100 text-slate-600"
                                >
                                  <X
                                    size={16}
                                  />
                                </button>
                              </>
                            ) : (
                              <>
                                <button
                                  type="button"
                                  onClick={() => {
                                    setEditingId(
                                      category._id
                                    );
                                    setEditingName(
                                      category.name
                                    );
                                  }}
                                  className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-50 text-blue-600"
                                >
                                  <Pencil
                                    size={16}
                                  />
                                </button>

                                <button
                                  type="button"
                                  disabled={
                                    processing
                                  }
                                  onClick={() =>
                                    void handleStatus(
                                      category
                                    )
                                  }
                                  className="h-9 rounded-xl bg-orange-50 px-3 text-xs font-black text-orange-600 disabled:opacity-50"
                                >
                                  {category.isActive
                                    ? "Disable"
                                    : "Enable"}
                                </button>

                                <button
                                  type="button"
                                  disabled={
                                    processing
                                  }
                                  onClick={() =>
                                    void handleDelete(
                                      category
                                    )
                                  }
                                  className="flex h-9 w-9 items-center justify-center rounded-xl bg-red-50 text-red-500 disabled:opacity-50"
                                >
                                  {processing ? (
                                    <LoaderCircle
                                      size={
                                        16
                                      }
                                      className="animate-spin"
                                    />
                                  ) : (
                                    <Trash2
                                      size={
                                        16
                                      }
                                    />
                                  )}
                                </button>
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  }
                )}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}