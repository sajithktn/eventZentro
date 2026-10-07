"use client";

import { AtSign, BadgeCheck, Building2, CalendarDays, Copy, ExternalLink, Globe2, Loader2, MapPin, Pencil, Save, Share2, Ticket, X } from "lucide-react";
import { EventSection } from "./OrganizerEventList";
import { EditField, ProfileDetail } from "./ProfileFields";
import { normalizeExternalLink } from "./utils";
import type { OrganizerProfileState } from "./useOrganizerProfileState";

interface OrganizerProfileViewProps {
  state: OrganizerProfileState;
}

export function OrganizerProfileView({ state }: OrganizerProfileViewProps) {
  const {
    aboutOrganizer,
    copied,
    editForm,
    eventsError,
    eventsLoading,
    handleCloseEdit,
    handleFieldChange,
    handleOpenEdit,
    handleSaveProfile,
    handleShareProfile,
    initials,
    isEditing,
    isSaving,
    location,
    organizerCategory,
    organizerName,
    pastEvents,
    socialLinks,
    upcomingEvents,
    user,
    website,
  } = state;

  if (!user) {
    return (
      <main className="flex min-h-[70vh] items-center justify-center bg-[#fffaf5] px-4">
        <div className="text-center">
          <div className="mx-auto h-11 w-11 animate-spin rounded-full border-4 border-orange-100 border-t-orange-500" />
          <p className="mt-4 text-sm font-medium text-slate-500">
            Loading organizer profile...
          </p>
        </div>
      </main>
    );
  }

  return (
    <>
        <main className="min-h-screen bg-[#fffaf5] px-4 pb-16 pt-6 sm:px-6">
          <div className="mx-auto max-w-7xl">
            <section className="relative overflow-hidden rounded-[30px] border border-orange-100 bg-gradient-to-br from-orange-50 via-white to-rose-50 p-6 shadow-sm sm:p-8">
              <div className="absolute -left-24 -top-24 h-72 w-72 rounded-full bg-orange-200/40 blur-[110px]"/>

              <div className="absolute -bottom-28 right-0 h-72 w-72 rounded-full bg-rose-200/40 blur-[110px]"/>

              <div className="relative z-10 flex flex-col justify-between gap-6 lg:flex-row lg:items-start">
                <div className="flex flex-col gap-6 sm:flex-row sm:items-center">
                  {user.profileImage ? (<img src={user.profileImage} alt={`${organizerName} logo`} className="h-32 w-32 shrink-0 rounded-[30px] border-4 border-white object-cover shadow-xl"/>) : (<div className="flex h-32 w-32 shrink-0 items-center justify-center rounded-[30px] border-4 border-white bg-gradient-to-br from-orange-500 via-red-500 to-pink-500 text-4xl font-black text-white shadow-xl shadow-orange-200">
                      {initials}
                    </div>)}

                  <div className="min-w-0">
                    <p className="text-xs font-bold uppercase tracking-[0.2em] text-orange-600">
                      Organizer Profile
                    </p>

                    <div className="mt-3 flex flex-wrap items-center gap-3">
                      <h1 className="break-words text-3xl font-black tracking-tight text-slate-950 sm:text-4xl">
                        {organizerName}
                      </h1>

                      {user.isVerified && (<span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-100 px-3 py-1.5 text-xs font-bold text-emerald-700">
                          <BadgeCheck size={15}/>

                          Verified
                        </span>)}
                    </div>

                    <div className="mt-4 flex flex-wrap gap-2">
                      <span className="inline-flex items-center gap-2 rounded-full border border-orange-200 bg-white px-4 py-2 text-xs font-bold text-orange-600 shadow-sm">
                        <Building2 size={15}/>

                        {organizerCategory}
                      </span>

                      <span className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2 text-xs font-bold text-slate-600 shadow-sm">
                        <MapPin size={15}/>

                        {location}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex flex-wrap gap-3">
                  <button type="button" onClick={handleOpenEdit} className="inline-flex items-center justify-center gap-2 rounded-xl border-2 border-orange-200 bg-white px-5 py-3 text-sm font-bold text-orange-600 shadow-sm transition hover:-translate-y-0.5 hover:bg-orange-50 hover:shadow-lg">
                    <Pencil size={17}/>

                    Edit Profile
                  </button>

                  <button type="button" onClick={handleShareProfile} className="inline-flex items-center justify-center gap-2 rounded-xl bg-slate-900 px-5 py-3 text-sm font-bold text-white shadow-sm transition hover:-translate-y-0.5 hover:bg-orange-600 hover:shadow-lg">
                    {copied ? (<Copy size={18}/>) : (<Share2 size={18}/>)}

                    {copied
          ? "Link Copied"
          : "Share Profile"}
                  </button>
                </div>
              </div>
            </section>

            <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_340px]">
              <div className="space-y-6">
                <section className="rounded-[24px] border border-orange-100 bg-white p-6 shadow-sm">
                  <div className="flex items-center gap-3">
                    <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-orange-100 text-orange-600">
                      <Building2 size={21}/>
                    </div>

                    <div>
                      <p className="text-xs font-bold uppercase tracking-[0.18em] text-orange-500">
                        Introduction
                      </p>

                      <h2 className="mt-1 text-xl font-black text-slate-900">
                        About Organizer
                      </h2>
                    </div>
                  </div>

                  <p className="mt-5 whitespace-pre-line text-sm leading-7 text-slate-600">
                    {aboutOrganizer}
                  </p>
                </section>

                <EventSection title="Upcoming Events" description="Events scheduled and available for attendees." events={upcomingEvents} loading={eventsLoading} emptyMessage="No upcoming events are available." showAllHref="/organizer/events"/>

                <EventSection title="Past Events" description="Previously organized events and experiences." events={pastEvents} loading={eventsLoading} emptyMessage="No past events are available." showAllHref="/organizer/events"/>

                {eventsError && (<div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-600">
                    {eventsError}
                  </div>)}
              </div>

              <aside className="space-y-6">
                <section className="rounded-[24px] border border-orange-100 bg-white p-6 shadow-sm">
                  <p className="text-xs font-bold uppercase tracking-[0.18em] text-orange-500">
                    Contact
                  </p>

                  <h2 className="mt-2 text-xl font-black text-slate-900">
                    Organizer Details
                  </h2>

                  <div className="mt-5 space-y-4">
                    <ProfileDetail icon={Building2} label="Organizer" value={organizerName}/>

                    <ProfileDetail icon={AtSign} label="Email" value={user.email}/>

                    <ProfileDetail icon={MapPin} label="Location" value={location}/>

                    <ProfileDetail icon={CalendarDays} label="Upcoming events" value={upcomingEvents.length.toString()}/>

                    <ProfileDetail icon={Ticket} label="Past events" value={pastEvents.length.toString()}/>
                  </div>
                </section>

                <section className="rounded-[24px] border border-orange-100 bg-white p-6 shadow-sm">
                  <p className="text-xs font-bold uppercase tracking-[0.18em] text-orange-500">
                    Online
                  </p>

                  <h2 className="mt-2 text-xl font-black text-slate-900">
                    Website & Social
                    Links
                  </h2>

                  <div className="mt-5 space-y-3">
                    {website && (<a href={normalizeExternalLink(website)} target="_blank" rel="noreferrer" className="flex items-center justify-between gap-3 rounded-xl border-2 border-slate-200 px-4 py-3 transition hover:border-orange-300 hover:bg-orange-50">
                        <span className="flex min-w-0 items-center gap-3">
                          <Globe2 size={19} className="shrink-0 text-orange-600"/>

                          <span className="truncate text-sm font-bold text-slate-700">
                            Website
                          </span>
                        </span>

                        <ExternalLink size={16} className="shrink-0 text-slate-400"/>
                      </a>)}

                    {socialLinks.map((social) => {
          const Icon = social.icon;
          return (<a key={social.name} href={normalizeExternalLink(social.value)} target="_blank" rel="noreferrer" className="flex items-center justify-between gap-3 rounded-xl border-2 border-slate-200 px-4 py-3 transition hover:border-orange-300 hover:bg-orange-50">
                            <span className="flex min-w-0 items-center gap-3">
                              <Icon size={19} className="shrink-0 text-orange-600"/>

                              <span className="truncate text-sm font-bold text-slate-700">
                                {social.name}
                              </span>
                            </span>

                            <ExternalLink size={16} className="shrink-0 text-slate-400"/>
                          </a>);
      })}

                    {!website &&
          socialLinks.length ===
              0 && (<div className="rounded-xl border-2 border-dashed border-slate-200 px-4 py-6 text-center">
                          <Globe2 size={25} className="mx-auto text-slate-300"/>

                          <p className="mt-3 text-sm font-semibold text-slate-500">
                            No website or
                            social links
                            added.
                          </p>
                        </div>)}
                  </div>
                </section>

                <button type="button" onClick={handleShareProfile} className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-orange-500 to-red-500 px-5 py-3.5 text-sm font-bold text-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-lg">
                  <Share2 size={18}/>

                  Share Organizer
                  Profile
                </button>
              </aside>
            </div>
          </div>
        </main>

        {isEditing && (<div role="dialog" aria-modal="true" className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-sm" onClick={handleCloseEdit}>
            <form onSubmit={handleSaveProfile} onClick={(event) => event.stopPropagation()} className="max-h-[92vh] w-full max-w-2xl overflow-hidden rounded-[28px] bg-white shadow-2xl">
              <div className="flex items-center justify-between border-b border-slate-200 px-6 py-5">
                <div>
                  <p className="text-xs font-bold uppercase tracking-[0.18em] text-orange-500">
                    Profile
                  </p>

                  <h2 className="mt-1 text-2xl font-black text-slate-900">
                    Edit Profile
                  </h2>
                </div>

                <button type="button" onClick={handleCloseEdit} disabled={isSaving} className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 text-slate-500 transition hover:bg-slate-100 disabled:opacity-50">
                  <X size={19}/>
                </button>
              </div>

              <div className="max-h-[calc(92vh-150px)] space-y-5 overflow-y-auto px-6 py-6">
                <div className="grid gap-4 sm:grid-cols-2">
                  <EditField label="First name" value={editForm.firstName} required onChange={(value) => handleFieldChange("firstName", value)}/>

                  <EditField label="Last name" value={editForm.lastName} onChange={(value) => handleFieldChange("lastName", value)}/>
                </div>

                <div>
                  <h3 className="text-base font-black text-slate-900">
                    Organizer Details
                  </h3>

                  <div className="mt-4 grid gap-4 sm:grid-cols-2">
                    <EditField label="Organizer name" value={editForm.organizerName} placeholder="Your public organizer name" onChange={(value) => handleFieldChange("organizerName", value)}/>

                    <EditField label="Company name" value={editForm.companyName} placeholder="Company or brand" onChange={(value) => handleFieldChange("companyName", value)}/>

                    <EditField label="Organizer category" value={editForm.organizerCategory} placeholder="Music, conferences, workshops" onChange={(value) => handleFieldChange("organizerCategory", value)}/>
                  </div>
                </div>

                <EditField label="Profile image URL" value={editForm.profileImage} placeholder="https://example.com/profile.jpg" onChange={(value) => handleFieldChange("profileImage", value)}/>

                <label className="block">
                  <span className="text-sm font-bold text-slate-700">
                    Bio
                  </span>

                  <textarea value={editForm.bio} rows={5} maxLength={1000} placeholder="Tell people about yourself and your events." onChange={(event) => handleFieldChange("bio", event.target.value)} className="mt-2 w-full resize-none rounded-xl border-2 border-slate-200 px-4 py-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-orange-400 focus:ring-4 focus:ring-orange-100"/>

                  <p className="mt-1 text-right text-xs text-slate-400">
                    {editForm.bio
              .length}
                    /1000
                  </p>
                </label>

                <div>
                  <h3 className="text-base font-black text-slate-900">
                    Website & Social Links
                  </h3>

                  <div className="mt-4 grid gap-4 sm:grid-cols-2">
                    <EditField label="Website" value={editForm.website} placeholder="https://yourwebsite.com" onChange={(value) => handleFieldChange("website", value)}/>

                    <EditField label="Instagram" value={editForm.instagram} placeholder="https://instagram.com/username" onChange={(value) => handleFieldChange("instagram", value)}/>

                    <EditField label="Facebook" value={editForm.facebook} placeholder="https://facebook.com/page" onChange={(value) => handleFieldChange("facebook", value)}/>

                    <EditField label="LinkedIn" value={editForm.linkedin} placeholder="https://linkedin.com/company/name" onChange={(value) => handleFieldChange("linkedin", value)}/>

                    <EditField label="X" value={editForm.twitter} placeholder="https://x.com/username" onChange={(value) => handleFieldChange("twitter", value)}/>
                  </div>
                </div>

                <div>
                  <h3 className="text-base font-black text-slate-900">
                    Location
                  </h3>

                  <div className="mt-4 grid gap-4 sm:grid-cols-2">
                    <EditField label="City" value={editForm.city} placeholder="Kochi" onChange={(value) => handleFieldChange("city", value)}/>

                    <EditField label="State" value={editForm.state} placeholder="Kerala" onChange={(value) => handleFieldChange("state", value)}/>

                    <EditField label="Country" value={editForm.country} placeholder="India" onChange={(value) => handleFieldChange("country", value)}/>

                    <EditField label="ZIP code" value={editForm.zipCode} placeholder="682001" onChange={(value) => handleFieldChange("zipCode", value)}/>
                  </div>
                </div>
              </div>

              <div className="flex flex-col-reverse gap-3 border-t border-slate-200 bg-slate-50 px-6 py-4 sm:flex-row sm:justify-end">
                <button type="button" onClick={handleCloseEdit} disabled={isSaving} className="inline-flex items-center justify-center rounded-xl border-2 border-slate-200 bg-white px-5 py-3 text-sm font-bold text-slate-700 transition hover:bg-slate-100 disabled:opacity-50">
                  Cancel
                </button>

                <button type="submit" disabled={isSaving} className="inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-orange-500 to-red-500 px-6 py-3 text-sm font-bold text-white transition hover:shadow-lg disabled:cursor-not-allowed disabled:opacity-60">
                  {isSaving ? (<Loader2 size={18} className="animate-spin"/>) : (<Save size={18}/>)}

                  {isSaving
              ? "Saving..."
              : "Save Changes"}
                </button>
              </div>
            </form>
          </div>)}
      </>
  );
}
