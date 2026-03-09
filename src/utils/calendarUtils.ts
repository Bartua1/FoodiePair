export function generateGoogleCalendarUrl(
    title: string,
    date: string, // YYYY-MM-DD
    location: string,
    description: string
): string {
    // Google Calendar expects dates in YYYYMMDDTHHmmssZ format for UTC
    // Defaulting to an evening event 20:00 to 22:00 UTC
    const startStr = date.replace(/-/g, '') + 'T200000Z';
    const endStr = date.replace(/-/g, '') + 'T220000Z';
    
    const params = new URLSearchParams({
        action: 'TEMPLATE',
        text: title,
        dates: `${startStr}/${endStr}`,
        details: description,
        location: location
    });

    return `https://calendar.google.com/calendar/render?${params.toString()}`;
}

export function generateICS(
    title: string,
    date: string, // YYYY-MM-DD
    location: string,
    description: string
): string {
    const startStr = date.replace(/-/g, '') + 'T200000Z';
    const endStr = date.replace(/-/g, '') + 'T220000Z';
    const cleanLocation = location.replace(/,/g, '\\,');
    const cleanDescription = description.replace(/\n/g, '\\n');

    return `BEGIN:VCALENDAR
VERSION:2.0
BEGIN:VEVENT
DTSTART:${startStr}
DTEND:${endStr}
SUMMARY:${title}
DESCRIPTION:${cleanDescription}
LOCATION:${cleanLocation}
END:VEVENT
END:VCALENDAR`;
}

export function downloadICS(icsContent: string, filename: string) {
    const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
    const link = document.createElement('a');
    link.href = window.URL.createObjectURL(blob);
    link.setAttribute('download', `${filename}.ics`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}
