"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";

import { categoryStyles } from "./constants";
import type { HomeState } from "./useHomeState";

interface HomeCategoriesProps {
  state: HomeState;
}

export function HomeCategories({ state }: HomeCategoriesProps) {
  const { categories, loadingCategories } = state;

  return (
    <section className="relative bg-[#f7f5fa] px-6 py-24 text-[#14111a]">
      <div className="mx-auto max-w-7xl">
        <div className="flex flex-col justify-between gap-6 md:flex-row md:items-end">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.24em] text-pink-600">
              Choose your vibe
            </p>
            <h2 className="mt-4 max-w-2xl text-4xl font-black tracking-[-0.04em] sm:text-5xl">
              Experiences for every version of you.
            </h2>
          </div>
          <p className="max-w-md text-sm leading-7 text-neutral-500">
            From loud concert nights to calm creative workshops, find an
            experience that matches your mood.
          </p>
        </div>

        {loadingCategories ? (
          <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3].map((item) => (
              <div
                key={item}
                className="h-[230px] animate-pulse rounded-[28px] bg-white shadow-sm"
              />
            ))}
          </div>
        ) : categories.length === 0 ? (
          <div className="mt-12 rounded-[28px] border border-black/5 bg-white p-10 text-center text-neutral-500">
            No categories are available.
          </div>
        ) : (
          <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {categories.map((category, index) => {
              const style = categoryStyles[index % categoryStyles.length];
              const Icon = style.icon;

              return (
                <Link
                  key={category._id}
                  href={`/events?category=${encodeURIComponent(category.name)}`}
                  className="category-card group relative overflow-hidden rounded-[28px] border border-black/5 bg-white p-6 shadow-[0_15px_45px_rgba(27,20,40,0.07)] transition-all duration-300 hover:border-pink-500/25 hover:shadow-[0_25px_60px_rgba(244,63,94,0.12)]"
                >
                  <div
                    className={`absolute -right-16 -top-16 h-40 w-40 rounded-full bg-gradient-to-br ${style.color} opacity-15 blur-2xl transition duration-500 group-hover:scale-150 group-hover:opacity-30`}
                  />
                  <div className="relative flex items-start justify-between">
                    <div
                      className={`flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br ${style.color} text-white shadow-lg transition duration-500 group-hover:rotate-[-8deg] group-hover:scale-110`}
                    >
                      <Icon size={23} />
                    </div>
                    <div className="flex h-11 w-11 items-center justify-center rounded-full border border-black/10 transition duration-300 group-hover:rotate-[-20deg] group-hover:bg-black group-hover:text-white">
                      <ArrowRight size={17} />
                    </div>
                  </div>
                  <h3 className="relative mt-10 text-2xl font-black transition duration-300 group-hover:text-pink-600">
                    {category.name}
                  </h3>
                  <p className="relative mt-2 text-sm text-neutral-500">
                    Explore upcoming {category.name.toLowerCase()} events.
                  </p>
                  <div
                    className={`absolute bottom-0 left-0 h-1 w-0 bg-gradient-to-r ${style.color} transition-all duration-500 group-hover:w-full`}
                  />
                  {index === 0 && (
                    <span className="absolute right-6 top-[88px] rounded-full bg-pink-50 px-3 py-1 text-[10px] font-black uppercase tracking-wider text-pink-600 transition duration-300 group-hover:scale-105">
                      Popular
                    </span>
                  )}
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
}
