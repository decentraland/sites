<!--
  Source of https://decentraland.org/llms.txt, built by scripts/build-llms-txt.mjs into dist/llms.txt.

  The prose is editorial text owned by marketing (Kim). Change wording with them, not in code review.
  That includes "every week there are also film screenings, live DJ sets and other community
  events": it is editorial copy, not derived from any data source.

  Links: a {{group.key}} placeholder is filled from src/config/publicLinks.json, the same file the
  site's download buttons and footer read, plus the llms.txt attribution rules in the generator.
  Literal URLs are not synced from anywhere. The decentraland.org ones served by this SPA (/events,
  /places, /blog, the Genesis Plaza place page, /download/creator-hub) are validated against the
  route manifest at build time, so a removed route fails the build, but their wording and choice are
  editorial. The ones served by other apps (/shop, /marketplace, /builder, /dao, /governance) are
  exact entries in OTHER_SITE_URLS in the generator: the build cannot verify them, so
  `npm run check:llms-links` fetches them live. The docs and API links have no source in the app.
  Anything the site itself renders from a shared constant belongs in publicLinks.json.
  HTML comments are stripped from the output.
-->

# Decentraland

> Decentraland is a free virtual world where you play games and hang out with other adults online, from your computer or phone.

Decentraland is free to use. You can sign in with a Google or Discord account, or with an email, and a crypto wallet is optional. It runs as a desktop app on Windows and Mac, available as a direct download or through the Epic Games Store, and as a mobile app on iOS and Android.

Decentraland is built by the community of creators, from the games to the music venues to the art galleries to the chill spaces. You never know what someone will create and deploy next. Every week there are also film screenings, live DJ sets and other community events. Anyone can create an event, so the calendar changes daily. For what is happening right now or this weekend, or for the full lineup of community events, check the events calendar below.

Decentraland is good for live music and DJ sets from home, watching a movie or documentary with other people online, free games to play with friends online, a place to hang out and chat online after work, and building a digital identity that is uniquely you.

## Find Something To Do

<!--
  Genesis Plaza: frozen editorial value, the plaza's base parcel. It is not fetched from Places at
  build time, so if the scene ever moves this link has to be updated by hand.
-->

- [Events calendar](https://decentraland.org/events): Live and upcoming events with dates, times and where to go in-world. Lists community events. The best source for "what's happening tonight" or "what is there to do this weekend."
- [Places](https://decentraland.org/places): Creator-built spaces to explore any time, including games, music venues, galleries and hangouts.
- [Genesis Plaza](https://decentraland.org/places/place/-3,-2): The central meeting spot and a good first stop for new visitors.

## Get Started

- [Download for Windows and Mac]({{download.desktop}}): Install the desktop app, sign in and jump in.
- [Get it on the Epic Games Store]({{download.epic}}): Prefer Epic? Install the desktop app from the Epic Games Store instead.
- [Get the iOS app]({{download.appStore}}): Decentraland on iPhone.
- [Get the Android app]({{download.googlePlay}}): Decentraland on Android phones.
- [Help and support]({{support.help}}): Account, sign-in and troubleshooting help.
- [Decentraland 101]({{support.faq}}): Common questions, including hardware requirements and whether a wallet is needed.

## Stay Up To Date

- [Blog](https://decentraland.org/blog): Announcements, guides and community stories, latest post first.
- [Weekly newsletter]({{newsletter.subscribe}}): Upcoming events and what's new each week.
- [X]({{social.x}}): News and event announcements.
- [Discord]({{social.discord}}): Chat with the community outside the world.

## Trade, Build And Govern

<!--
  Each of these is its own app under decentraland.org. Two pairs are easy for an agent to confuse
  (Shop vs Marketplace, and DAO vs Governance, both titled "Decentraland DAO"), so each side of a
  pair says what it is not. Descriptions follow each app's own page title and description.
-->

- [Shop](https://decentraland.org/shop): Browse and buy wearables and emotes for your avatar. Not the Marketplace, which also handles LAND, NAMEs and resales between users.
- [Marketplace](https://decentraland.org/marketplace): Buy and sell wearables, emotes, LAND and NAMEs, both new collection items and resales between users. LAND and NAMEs are traded here, not in the Shop.
- [Builder](https://decentraland.org/builder): Web tool to create scenes and Worlds with simple tools and ready-made 3D models, publish wearable and emote collections, and manage LAND and NAMEs. Scenes can also be built with the desktop [Creator Hub](https://decentraland.org/download/creator-hub).
- [DAO](https://decentraland.org/dao): What the Decentraland DAO is, what it decides and how to take part. Not where proposals are voted; that is Governance.
- [Governance](https://decentraland.org/governance): The governance hub where DAO proposals are created, discussed and voted on. Not the DAO overview page.

## For Builders And Developers

- [Developer docs index](https://docs.decentraland.org/llms.txt): Full documentation for creators, contributors and developers.
- [Events API](https://docs.decentraland.org/apis/apis/events.md): Programmatic access to events, schedules and categories.
- [Places API](https://docs.decentraland.org/apis/apis/places.md): Programmatic access to places, Worlds and the map.

## Optional

- [About Decentraland]({{support.about}}): History, the Decentraland Foundation and how community governance works.
