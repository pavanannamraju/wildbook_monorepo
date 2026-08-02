import { ArrowLeftIcon, ArrowRightIcon, GlobeIcon } from "@phosphor-icons/react";
import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  createGuideProfile,
  fetchGuideProfileOptions,
  type GuideProfileOptions,
  type GuideRole,
} from "../api/guideProfiles";
import { ProfilePhotoUpload, type ProfilePhotoValue } from "../components/guide/ProfilePhotoUpload";
import { ReferenceMultiSelect } from "../components/guide/ReferenceMultiSelect";
import { TagSelector } from "../components/guide/TagSelector";
import { LanguageSelect } from "../components/guide/LanguageSelect";
import { StickyTopNavbar } from "../components/common/StickyTopNavbar";
import { WORLD_LANGUAGES } from "../data/languages";

type GuideProfileFormState = {
  fullName: string;
  email: string;
  role: GuideRole;
  baseLocation: string;
  yearsOfExperience: string;
  bio: string;
  languages: string[];
  specializations: string[];
  focusAreaIds: string[];
  certificationIds: string[];
  naturalistSummary: string;
};

const INITIAL_FORM: GuideProfileFormState = {
  fullName: "",
  email: "",
  role: "GUIDE",
  baseLocation: "",
  yearsOfExperience: "0",
  bio: "",
  languages: [],
  specializations: [],
  focusAreaIds: [],
  certificationIds: [],
  naturalistSummary: "",
};

const FALLBACK_OPTIONS: GuideProfileOptions = {
  roles: ["GUIDE", "NATURALIST"],
  language_presets: ["English", "Hindi", "Tamil", "Telugu", "Kannada", "Bengali", "Marathi"],
  specialization_presets: [
    "Birding",
    "Herping",
    "Mammals",
    "Botany",
    "Entomology",
    "Photography",
    "Trekking",
    "Night Safari",
    "Marine Life",
    "Big Cats",
  ],
  focus_areas: [],
  certifications: [],
  max_profile_photo_bytes: 5 * 1024 * 1024,
  allowed_profile_photo_content_types: ["image/jpeg", "image/png", "image/webp"],
};

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const inputClassName =
  "h-12 w-full rounded border border-black/8 bg-white px-4 text-[15px] text-[#2f2b28] outline-none focus:border-[#0b6e66]";

const labelClassName = "mb-2 block text-[15px] font-medium text-[#323232]";

export function CreateGuidePage() {
  const navigate = useNavigate();
  const [form, setForm] = useState<GuideProfileFormState>(INITIAL_FORM);
  const [options, setOptions] = useState<GuideProfileOptions>(FALLBACK_OPTIONS);
  const [optionsError, setOptionsError] = useState<string | null>(null);
  const [profilePhoto, setProfilePhoto] = useState<ProfilePhotoValue | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [photoError, setPhotoError] = useState<string | null>(null);
  const [createdProfileId, setCreatedProfileId] = useState<string | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    fetchGuideProfileOptions(controller.signal)
      .then((next) => {
        setOptions(next);
        setOptionsError(null);
      })
      .catch(() => {
        setOptionsError("Could not load reference data. Please refresh and try again.");
      });
    return () => controller.abort();
  }, []);

  const isNaturalist = form.role === "NATURALIST";

  function updateForm<K extends keyof GuideProfileFormState>(key: K, value: GuideProfileFormState[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  function validate(): string | null {
    if (form.fullName.trim().length < 2) return "Please enter your full name.";
    if (!EMAIL_REGEX.test(form.email.trim())) return "Please enter a valid email address.";
    if (!form.baseLocation.trim()) return "Please enter your base location.";
    if (form.languages.length === 0) return "Please add at least one language.";
    const years = Number(form.yearsOfExperience);
    if (!Number.isFinite(years) || years < 0 || years > 80) {
      return "Years of experience must be between 0 and 80.";
    }
    if (isNaturalist && form.focusAreaIds.length === 0) {
      return "Naturalists must select at least one focus area.";
    }
    if (photoError) return photoError;
    return null;
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const validationError = validate();
    if (validationError) {
      setError(validationError);
      return;
    }

    setError(null);
    setSubmitting(true);
    try {
      const created = await createGuideProfile({
        full_name: form.fullName.trim(),
        email: form.email.trim(),
        role: form.role,
        base_location: form.baseLocation.trim(),
        languages: form.languages,
        specializations: form.specializations,
        years_of_experience: Number(form.yearsOfExperience),
        bio: form.bio.trim() || undefined,
        naturalist_profile: isNaturalist
          ? {
              focus_area_ids: form.focusAreaIds,
              certification_ids: form.certificationIds,
              summary: form.naturalistSummary.trim() || undefined,
            }
          : undefined,
        profile_photo_content_type: profilePhoto?.contentType,
        profile_photo_base64: profilePhoto?.base64,
      });
      setCreatedProfileId(created.id);
    } catch {
      setError("Could not save your guide profile. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  if (createdProfileId) {
    return (
      <>
        <StickyTopNavbar />
        <div className="px-4 py-12">
          <div className="mx-auto max-w-[760px]">
            <div className="rounded-lg border border-[#b6decf] bg-[#d9efe4] p-8 text-[15px] leading-snug text-[#1e6757]">
              <p className="text-[18px] font-semibold sm:text-[20px] md:text-[22px]">Your guide profile has been published.</p>
              <p className="mt-3">
                Your profile is now live and discoverable in the experts directory.
              </p>
              <div className="mt-6 flex flex-wrap items-center gap-4">
                <Link
                  to={`/experts/${createdProfileId}`}
                  className="inline-flex items-center gap-2 rounded bg-(--color-wildbook-teal) px-5 py-2.5 font-semibold text-white hover:bg-[#074a46]"
                >
                  View my profile
                  <ArrowRightIcon size={16} />
                </Link>
                <Link to="/experts" className="font-semibold text-[#0b6e66] hover:underline">
                  Browse all experts
                </Link>
              </div>
            </div>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <StickyTopNavbar />
      <div className="px-4 py-10">
        <div className="mx-auto max-w-[760px]">
          <Link
            to="/"
            className="inline-flex items-center gap-2 text-[14px] font-medium text-[#4a4a4a] hover:text-[#121212]"
          >
            <ArrowLeftIcon size={16} />
            Back to home
          </Link>

          <header className="mt-6">
            <h1 className="text-[24px] leading-[1.05] font-bold text-[#121212] sm:text-[32px] md:text-[36px] lg:text-[40px]">Create Your Guide Profile</h1>
            <p className="mt-2 text-[14px] text-[#73706c] sm:text-[15px] md:text-[16px]">This is how travellers will see you on Wildbook.</p>
          </header>

          {optionsError ? (
            <p className="mt-4 rounded border border-red-200 bg-red-50 p-3 text-sm text-red-700">{optionsError}</p>
          ) : null}

          <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
            <section className="rounded-lg border border-black/6 bg-white p-6 shadow-sm">
              <h2 className="text-[16px] font-semibold text-[#121212] sm:text-[17px] md:text-[18px]">Basic Information</h2>

              <div className="mt-6 grid gap-5 md:grid-cols-2">
                <div>
                  <label className={labelClassName}>Full name *</label>
                  <input
                    className={inputClassName}
                    placeholder="Your full name"
                    value={form.fullName}
                    onChange={(event) => updateForm("fullName", event.target.value)}
                    required
                  />
                </div>
                <div>
                  <label className={labelClassName}>Email *</label>
                  <input
                    type="email"
                    className={inputClassName}
                    placeholder="you@example.com"
                    value={form.email}
                    onChange={(event) => updateForm("email", event.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="mt-5 grid gap-5 md:grid-cols-2">
                <div>
                  <label className={labelClassName}>Role *</label>
                  <select
                    className={inputClassName}
                    value={form.role}
                    onChange={(event) => updateForm("role", event.target.value as GuideRole)}
                  >
                    <option value="GUIDE">Forest Guide</option>
                    <option value="NATURALIST">Naturalist</option>
                  </select>
                </div>
                <div>
                  <label className={labelClassName}>Base location *</label>
                  <input
                    className={inputClassName}
                    placeholder="e.g. Kaziranga, Assam"
                    value={form.baseLocation}
                    onChange={(event) => updateForm("baseLocation", event.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="mt-5 grid gap-5 md:grid-cols-2">
                <div>
                  <label className={labelClassName}>Years of experience</label>
                  <input
                    type="number"
                    min={0}
                    max={80}
                    className={inputClassName}
                    value={form.yearsOfExperience}
                    onChange={(event) => updateForm("yearsOfExperience", event.target.value)}
                  />
                </div>
                <ProfilePhotoUpload value={profilePhoto} onChange={setProfilePhoto} onError={setPhotoError} />
              </div>

              <div className="mt-5">
                <label className={labelClassName}>Bio</label>
                <textarea
                  className="min-h-[120px] w-full rounded border border-black/8 bg-white px-4 py-3 text-[15px] text-[#2f2b28] outline-none focus:border-[#0b6e66]"
                  placeholder="Tell travellers about your background, expertise, and passion for wildlife..."
                  value={form.bio}
                  onChange={(event) => updateForm("bio", event.target.value)}
                />
              </div>
            </section>

            <LanguageSelect
              title="Languages Spoken"
              subtitle="Shown on your public profile and experience pages"
              presets={options.language_presets}
              options={WORLD_LANGUAGES}
              selected={form.languages}
              onChange={(languages) => updateForm("languages", languages)}
              placeholder="Add other language..."
              required
            />

            <TagSelector
              title="Expertise"
              subtitle="Shown as tags on your public profile"
              presets={options.specialization_presets}
              selected={form.specializations}
              onChange={(specializations) => updateForm("specializations", specializations)}
              customPlaceholder="Add custom expertise..."
            />

            {isNaturalist ? (
              <>
                <ReferenceMultiSelect
                  title="Focus Areas"
                  subtitle="Required for naturalists — your areas of specialised study"
                  options={options.focus_areas}
                  selectedIds={form.focusAreaIds}
                  onChange={(focusAreaIds) => updateForm("focusAreaIds", focusAreaIds)}
                  placeholder="Search focus areas..."
                  required
                />

                <ReferenceMultiSelect
                  title="Certifications"
                  subtitle="Optional — credentials that build traveller trust"
                  options={options.certifications}
                  selectedIds={form.certificationIds}
                  onChange={(certificationIds) => updateForm("certificationIds", certificationIds)}
                  placeholder="Search certifications..."
                />

                <section className="rounded-lg border border-black/6 bg-white p-6 shadow-sm">
                  <h2 className="text-[16px] font-semibold text-[#121212] sm:text-[17px] md:text-[18px]">Naturalist Summary</h2>
                  <p className="mt-1 text-[14px] text-[#73706c]">A short note about your field focus (optional).</p>
                  <textarea
                    className="mt-4 min-h-[100px] w-full rounded border border-black/8 bg-white px-4 py-3 text-[15px] text-[#2f2b28] outline-none focus:border-[#0b6e66]"
                    placeholder="e.g. I specialise in Himalayan avifauna and high-altitude ecosystems..."
                    value={form.naturalistSummary}
                    onChange={(event) => updateForm("naturalistSummary", event.target.value)}
                  />
                </section>
              </>
            ) : null}

            <section className="rounded-lg border border-[#cfe8df] bg-[#edf7f2] p-5">
              <div className="flex gap-3">
                <GlobeIcon size={22} className="mt-0.5 shrink-0 text-[#0b6e66]" />
                <div>
                  <h3 className="text-[15px] font-semibold text-[#1e6757]">What travellers see on your experience page</h3>
                  <ul className="mt-3 list-disc space-y-1.5 pl-5 text-[14px] leading-snug text-[#2f5f54]">
                    <li>Your photo, name, base location</li>
                    <li>Rating &amp; review count (auto-updated after bookings)</li>
                    <li>Years of experience, expertise, languages</li>
                    <li>Your bio</li>
                  </ul>
                </div>
              </div>
            </section>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => navigate("/")}
                className="h-12 rounded border border-black/12 bg-white px-6 text-[15px] font-medium text-[#2f2b28]"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="h-12 rounded bg-(--color-wildbook-teal) px-6 text-[15px] font-semibold text-white disabled:opacity-60"
              >
                {submitting ? "Saving..." : "Save Profile"}
              </button>
            </div>

            {error ? <p className="text-right text-sm text-red-700">{error}</p> : null}
            {photoError ? <p className="text-right text-sm text-red-700">{photoError}</p> : null}
          </form>
        </div>
      </div>
    </>
  );
}
