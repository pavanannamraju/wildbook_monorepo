import {
  CalendarDotsIcon,
  CaretDownIcon,
  ChatCircleTextIcon,
} from "@phosphor-icons/react";
import { useEffect, useState } from "react";

import { createInquiry, type InquiryDatesPreference } from "../../api/inquiries";
import { track } from "../../lib/analytics";

function dayAfterIso(isoDate: string): string {
  const parts = isoDate.split("-").map(Number);
  const year = parts[0];
  const month = parts[1];
  const day = parts[2];
  if (year == null || month == null || day == null) return isoDate;
  const date = new Date(year, month - 1, day);
  date.setDate(date.getDate() + 1);
  const yyyy = date.getFullYear();
  const mm = String(date.getMonth() + 1).padStart(2, "0");
  const dd = String(date.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

const inputClass =
  "h-11 w-full rounded-sm border border-[#E3DDD8] bg-white px-3 font-['Nunito'] text-sm text-[#3B372F] outline-none placeholder:text-[#9AA59D] focus:ring-2 focus:ring-[#0B6E66]/25";
const labelClass = "mb-1 block font-['Nunito'] text-sm font-semibold text-[#3B372F]";

export function ExpertInquiryForm({
  expertId,
  expertName,
  firstName,
  defaultName = "",
  defaultEmail = "",
  cardClassName,
}: {
  expertId: string;
  expertName: string;
  firstName: string;
  defaultName?: string;
  defaultEmail?: string;
  cardClassName: string;
}) {
  const [customerName, setCustomerName] = useState(defaultName);
  const [customerEmail, setCustomerEmail] = useState(defaultEmail);
  const [datesPreference, setDatesPreference] = useState<InquiryDatesPreference>("flexible");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [groupSize, setGroupSize] = useState("2");
  const [customGroupSize, setCustomGroupSize] = useState("");
  const [enquiryMessage, setEnquiryMessage] = useState("");
  const [submitStatus, setSubmitStatus] = useState<"idle" | "submitting" | "success" | "error">("idle");
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitAttempted, setSubmitAttempted] = useState(false);

  useEffect(() => {
    if (defaultName) setCustomerName((current) => current || defaultName);
  }, [defaultName]);

  useEffect(() => {
    if (defaultEmail) setCustomerEmail((current) => current || defaultEmail);
  }, [defaultEmail]);

  const groupSizeValue = groupSize === "custom" ? customGroupSize.trim() : groupSize;

  const validationErrors = (() => {
    const errors: Record<string, string> = {};
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!customerName.trim()) errors.customerName = "Name is required.";
    if (!customerEmail.trim()) errors.customerEmail = "Email is required.";
    else if (!emailRegex.test(customerEmail.trim())) errors.customerEmail = "Enter a valid email.";
    if (datesPreference === "fixed") {
      if (!startDate) errors.startDate = "Start date is required.";
      if (!endDate) errors.endDate = "End date is required.";
      if (startDate && endDate && endDate <= startDate) {
        errors.endDate = "End date must be after start date.";
      }
    }
    if (!groupSizeValue) errors.groupSize = "Group size is required.";
    if (groupSize === "custom" && !/^\d+$/.test(groupSizeValue)) {
      errors.groupSize = "Enter a valid number.";
    }
    if (groupSize === "custom" && /^\d+$/.test(groupSizeValue) && Number(groupSizeValue) <= 0) {
      errors.groupSize = "Must be greater than zero.";
    }
    if (!enquiryMessage.trim()) errors.enquiryMessage = "Enquiry is required.";
    return errors;
  })();

  const isFormValid = Object.keys(validationErrors).length === 0;

  async function handleSubmitInquiry() {
    setSubmitAttempted(true);
    if (!isFormValid) {
      setSubmitStatus("error");
      setSubmitError("Please fix form errors.");
      track("expert_enquiry_submit", {
        expert_id: expertId,
        ok: false,
        reason: "validation",
      });
      return;
    }
    setSubmitStatus("submitting");
    setSubmitError(null);
    try {
      await createInquiry({
        expert_id: expertId,
        expert_name: expertName,
        customer_name: customerName.trim(),
        customer_email: customerEmail.trim(),
        dates_preference: datesPreference,
        ...(datesPreference === "fixed"
          ? { travel_start_date: startDate, travel_end_date: endDate }
          : {}),
        group_size: groupSizeValue,
        enquiry_message: enquiryMessage.trim(),
        source: "expert_detail_form",
      });
      setSubmitStatus("success");
      track("expert_enquiry_submit", {
        expert_id: expertId,
        ok: true,
        dates_preference: datesPreference,
        group_size: groupSizeValue,
      });
      setCustomerName(defaultName);
      setCustomerEmail(defaultEmail);
      setDatesPreference("flexible");
      setStartDate("");
      setEndDate("");
      setGroupSize("2");
      setCustomGroupSize("");
      setEnquiryMessage("");
      setSubmitAttempted(false);
    } catch (err: unknown) {
      setSubmitStatus("error");
      setSubmitError(err instanceof Error ? err.message : "Failed to submit enquiry.");
      track("expert_enquiry_submit", { expert_id: expertId, ok: false });
    }
  }

  return (
    <section id="expert-enquiry" className={`${cardClassName} shadow-sm`}>
      <h2 className="mb-6 flex items-center gap-2 font-['Montserrat'] text-2xl font-bold text-[#3B372F]">
        <ChatCircleTextIcon size={28} className="text-[#0B6E66]" />
        Send an Enquiry
      </h2>

      <div className="space-y-4 font-['Nunito']">
        <div>
          <label className={labelClass} htmlFor="enquiry-name">
            Your Name
          </label>
          <input
            id="enquiry-name"
            type="text"
            placeholder="John Doe"
            value={customerName}
            onChange={(e) => setCustomerName(e.target.value)}
            className={inputClass}
            required
          />
          {submitAttempted && validationErrors.customerName ? (
            <p className="mt-1 text-xs text-red-600">{validationErrors.customerName}</p>
          ) : null}
        </div>

        <div>
          <label className={labelClass} htmlFor="enquiry-email">
            Email
          </label>
          <input
            id="enquiry-email"
            type="email"
            placeholder="john@example.com"
            value={customerEmail}
            onChange={(e) => setCustomerEmail(e.target.value)}
            className={inputClass}
            required
          />
          {submitAttempted && validationErrors.customerEmail ? (
            <p className="mt-1 text-xs text-red-600">{validationErrors.customerEmail}</p>
          ) : null}
        </div>

        <div>
          <label className={labelClass} htmlFor="enquiry-group">
            Number of People
          </label>
          <div className="relative">
            <select
              id="enquiry-group"
              value={groupSize}
              onChange={(e) => setGroupSize(e.target.value)}
              className={`${inputClass} appearance-none pr-8`}
            >
              <option value="1">1</option>
              <option value="2">2</option>
              <option value="3">3</option>
              <option value="4">4</option>
              <option value="5">5</option>
              <option value="6+">6+</option>
              <option value="custom">Custom</option>
            </select>
            <CaretDownIcon size={16} className="pointer-events-none absolute top-1/2 right-3 -translate-y-1/2 text-[#73706C]" />
          </div>
          {submitAttempted && validationErrors.groupSize ? (
            <p className="mt-1 text-xs text-red-600">{validationErrors.groupSize}</p>
          ) : null}
        </div>

        {groupSize === "custom" ? (
          <div>
            <label className={labelClass} htmlFor="enquiry-custom-group">
              Custom Count
            </label>
            <input
              id="enquiry-custom-group"
              type="number"
              min={1}
              value={customGroupSize}
              onChange={(e) => setCustomGroupSize(e.target.value)}
              className={inputClass}
            />
          </div>
        ) : null}

        <div>
          <span className={labelClass}>Travel dates</span>
          <div className="mb-2 flex flex-wrap gap-4">
            <label className="flex cursor-pointer items-center gap-2 text-sm text-[#3B372F]">
              <input
                type="radio"
                name="dates-pref"
                checked={datesPreference === "fixed"}
                onChange={() => setDatesPreference("fixed")}
                className="accent-[#0B6E66]"
              />
              Fixed dates
            </label>
            <label className="flex cursor-pointer items-center gap-2 text-sm text-[#3B372F]">
              <input
                type="radio"
                name="dates-pref"
                checked={datesPreference === "flexible"}
                onChange={() => {
                  setDatesPreference("flexible");
                  setStartDate("");
                  setEndDate("");
                }}
                className="accent-[#0B6E66]"
              />
              I&apos;m flexible
            </label>
          </div>
          {datesPreference === "fixed" ? (
            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <label className={labelClass} htmlFor="enquiry-start">
                  Start
                </label>
                <div className="relative">
                  <input
                    id="enquiry-start"
                    type="date"
                    value={startDate}
                    onChange={(e) => {
                      const next = e.target.value;
                      setStartDate(next);
                      if (endDate && next && endDate <= next) setEndDate("");
                    }}
                    className={`${inputClass} pr-8`}
                  />
                  <CalendarDotsIcon size={16} className="pointer-events-none absolute top-1/2 right-3 -translate-y-1/2 text-[#73706C]" />
                </div>
                {submitAttempted && validationErrors.startDate ? (
                  <p className="mt-1 text-xs text-red-600">{validationErrors.startDate}</p>
                ) : null}
              </div>
              <div>
                <label className={labelClass} htmlFor="enquiry-end">
                  End
                </label>
                <div className="relative">
                  <input
                    id="enquiry-end"
                    type="date"
                    value={endDate}
                    min={startDate ? dayAfterIso(startDate) : undefined}
                    onChange={(e) => setEndDate(e.target.value)}
                    className={`${inputClass} pr-8`}
                  />
                  <CalendarDotsIcon size={16} className="pointer-events-none absolute top-1/2 right-3 -translate-y-1/2 text-[#73706C]" />
                </div>
                {submitAttempted && validationErrors.endDate ? (
                  <p className="mt-1 text-xs text-red-600">{validationErrors.endDate}</p>
                ) : null}
              </div>
            </div>
          ) : (
            <p className="text-xs text-[#73706C]">We&apos;ll help find a window that works.</p>
          )}
        </div>

        <div>
          <label className={labelClass} htmlFor="enquiry-message">
            Message
          </label>
          <textarea
            id="enquiry-message"
            rows={4}
            placeholder={`Hi ${firstName}, I am planning a trip to...`}
            value={enquiryMessage}
            onChange={(e) => setEnquiryMessage(e.target.value)}
            className={`${inputClass} h-auto py-2.5`}
            required
          />
          {submitAttempted && validationErrors.enquiryMessage ? (
            <p className="mt-1 text-xs text-red-600">{validationErrors.enquiryMessage}</p>
          ) : null}
        </div>

        <button
          type="button"
          onClick={() => void handleSubmitInquiry()}
          disabled={submitStatus === "submitting" || !isFormValid}
          className="mt-2 h-12 w-full rounded-sm bg-[#0B6E66] font-['Nunito'] text-lg font-semibold text-white transition-colors hover:bg-[#095B54] disabled:cursor-not-allowed disabled:opacity-50"
        >
          {submitStatus === "submitting" ? "Sending..." : "Send Message"}
        </button>
        {submitStatus === "success" ? (
          <p className="text-center text-sm text-[#0B6E66]">Enquiry sent. We&apos;ll get back shortly.</p>
        ) : null}
        {submitStatus === "error" && submitError ? (
          <p className="text-center text-sm text-red-600">{submitError}</p>
        ) : null}
      </div>
    </section>
  );
}
