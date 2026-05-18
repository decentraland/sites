// Runs once before Jest spawns its workers. Pins TZ to UTC so local-time formatters
// (Intl.DateTimeFormat, Date.prototype.getHours, `new Date('YYYY-MM-DDTHH:mm')`) produce
// deterministic output regardless of the host machine's timezone.
//
// Suites that depend on this pin (removing it will silently shift their assertions):
// - src/utils/whatsOnTime.spec.ts — asserts exact "10:00 AM" / "Tue, Apr 7" output.
// - src/components/whats-on/EventDetailModal/EventDetailModalHero.spec.tsx — exact local-time
//   strings in the schedule subtitle.
// - src/components/whats-on/EventDetailModal/EventDetailModalContent.spec.tsx — schedule range
//   formatting in the body.
// - src/components/whats-on/AllExperiences/FutureCard.spec.tsx — passes start/finish ISOs to the
//   tooltip mock; would be unaffected by TZ but inherits this setup for free.
// Without this pin macOS dev runners (UTC-3/-7) emit times that disagree with CI's UTC default and
// the suites fail nondeterministically depending on who runs them.
async function jestGlobalSetup(): Promise<void> {
  process.env.TZ = 'UTC'
}

// eslint-disable-next-line import/no-default-export
export default jestGlobalSetup
