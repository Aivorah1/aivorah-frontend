// AI Teacher greeting from the current time in India (Asia/Kolkata), whatever
// the device's own time zone: morning before noon, afternoon until 5:59 pm,
// evening from 6 pm.
export function indiaHour(date: Date = new Date()): number {
  try {
    const h = new Intl.DateTimeFormat('en-GB', { timeZone: 'Asia/Kolkata', hour: '2-digit', hour12: false }).format(date);
    const n = parseInt(h, 10);
    if (Number.isFinite(n)) return n % 24;
  } catch {
    // Older engines without time-zone data: India is UTC+5:30 all year.
  }
  const ist = new Date(date.getTime() + (5 * 60 + 30) * 60000);
  return ist.getUTCHours();
}

export function greetingFor(date: Date = new Date()): 'Good morning' | 'Good afternoon' | 'Good evening' {
  const h = indiaHour(date);
  if (h < 12) return 'Good morning';
  if (h < 18) return 'Good afternoon';
  return 'Good evening';
}

export function greetingLine(firstName: string, buddyName: string, date: Date = new Date()): string {
  const name = (firstName || '').trim() || 'there';
  return `${greetingFor(date)}, ${name}! I'm ${buddyName}, your AI Teacher. Ask me about any topic from your lessons.`;
}
