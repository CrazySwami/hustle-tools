"use client";

import React from 'react';
import { Editor } from '@tinymce/tinymce-react';

// Define the result type directly to avoid import issues
interface EventResult {
  title: string | null;
  specialGuests: string[];
  venue: string | null;
  week: string | null;
  month: string | null;
  day: string | null;
  time: string | null;
}

const weekDayMap: { [key: string]: string } = {
  MON: 'Monday', TUE: 'Tuesday', WED: 'Wednesday', THU: 'Thursday', FRI: 'Friday', SAT: 'Saturday', SUN: 'Sunday',
};

export const EventEditor = ({ result }: { result: EventResult }) => {
  const fullWeekDay = result.week ? weekDayMap[result.week.toUpperCase()] || result.week : '';
  const dateStr = result.month && result.day ? `${fullWeekDay}, ${result.month}. ${result.day}` : '';
  const timeStr = result.time ? `&nbsp;| Doors: ${result.time}` : '';

  const specialGuestsHtml = result.specialGuests && result.specialGuests.length > 0
    ? `<p style="text-align: center;"><em><span style="font-size: 16px; color: #ffffff;">Special Guest: ${result.specialGuests.join(', ')}</span></em></p>`
    : '';

  const initialValue = `
    <h2 style="text-align: center; line-height: 125%;"><span style="font-size: 16px; color: #ffffff;">${result.title || 'Untitled'}</span></h2>
    ${specialGuestsHtml}
    <p style="font-weight: bold; line-height: 150%; text-align: center;"><span style="color: #5e42d2;">${result.venue || ''}</span></p>
    <p style="text-align: center; line-height: 150%;"><span style="color: #ffffff;">${dateStr}${timeStr}</span></p>
  `;

  return (
    <Editor
      apiKey={process.env.NEXT_PUBLIC_TINYMCE_API_KEY || 'YOUR_TINYMCE_API_KEY'} // Replace with your key
      init={{
        skin: 'oxide-dark',
        content_css: 'dark',
        height: 250,
        menubar: false,
        plugins: [
          'advlist', 'autolink', 'lists', 'link', 'image', 'charmap', 'preview',
          'anchor', 'searchreplace', 'visualblocks', 'code', 'fullscreen',
          'insertdatetime', 'media', 'table', 'code', 'help', 'wordcount'
        ],
        toolbar: 'undo redo | blocks | ' +
          'bold italic forecolor | alignleft aligncenter ' +
          'alignright alignjustify | bullist numlist outdent indent | ' +
          'removeformat | help',
        content_style: 'body { background-color: #18181b; color: #e4e4e7; font-family:Helvetica,Arial,sans-serif; font-size:14px }'
      }}
      initialValue={initialValue}
    />
  );
};
