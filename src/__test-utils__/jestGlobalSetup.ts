// Runs once before Jest spawns its workers. Pins TZ to UTC so local-time formatters
// (Intl.DateTimeFormat, Date.prototype.getHours, `new Date('YYYY-MM-DDTHH:mm')`) produce
// deterministic output regardless of the host machine's timezone.
async function jestGlobalSetup(): Promise<void> {
  process.env.TZ = 'UTC'
}

// eslint-disable-next-line import/no-default-export
export default jestGlobalSetup
