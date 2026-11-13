/* Nur in admin.html (nicht im Spiel für Spieler). */
/* ======================= V69: Admin-Neuigkeiten ======================= */
/* Änderungen, die nur das Admin-Panel betreffen, stehen hier statt in NEWS. So sehen Spieler sie nie (nicht einmal im
   Code von index.html), und in admin.html erscheinen sie unter der passenden Version mit dem Etikett „Admin“.
   Neue Admin-Änderungen: hier unter der Versionsnummer eintragen, [Deutsch, Englisch]. */
const NEWS_ADM={
  69:[['Neue Karte „⏱️ Spielzeit“ im Server-Tab: Minuten pro Spieler und Tag, Sitzungslänge, erster Tag vor und ab Version 68, nach Herkunft (braucht docs/playtime-v21.sql).','New “⏱️ Play time” card in the Server tab: minutes per player per day, session length, first day before and from version 68, by source (needs docs/playtime-v21.sql).'],
      ['„Neuigkeiten“ ist jetzt getrennt: Admin-Änderungen siehst nur du hier, Spieler sehen nur ihre eigenen.','“What’s New” is split now: only you see admin changes here, players only see theirs.'],
      ['Die Schritte „Speicher behalten“ und „abgelehnt“ zeigen, ob Browser den Spielstand dauerhaft speichern.','The journey steps “keep” and “nokeep” show whether browsers agree to keep saves.']],
  68:[['Neue Karte „🚪 Neue Spieler“ im Server-Tab: Wie weit neue Spieler kommen, vor und ab Version 68, nach Herkunft (docs/funnel-v20.sql).','New “🚪 New players” card in the Server tab: how far new players get, before and from version 68, by source (docs/funnel-v20.sql).']],
  64:[['Tab „Zu erledigen“ und Tab „Spieler“ mit Spielerkarte, Verlauf, Verwarnungen mit Stufen und Sperr-Vorlagen. Jeder Name im Panel öffnet die Karte.','“To-do” and “Players” tabs with a player card, history, warnings with strikes and ban presets. Any name in the panel opens the card.'],
      ['Moderation und Server sind in Bereiche aufgeteilt (Spieler · Gemeinschaft, Server-Zustand · Einstellungen).','Moderation and Server are split into sections (Players · Community, Server health · Settings).']],
  58:[['Karte „Server-Zustand“: installierte Server-Teile, Server-Jobs, Alarme für Push, Abstürze und volle Datenbank, dazu ein Uptime-Check.','“Server health” card: installed server parts, server jobs, alarms for push, crashes and a full database, plus an uptime check.']],
  57:[['Live-Dashboard mit Diagrammen und ein Wochenbericht jeden Montag.','Live dashboard with charts and a weekly report every Monday.']],
  56:[['Datenbank-Füllstand, verdächtige Spielstände, Planer für Events und Ankündigungen und verschlüsselte Backups außerhalb von Supabase.','Database usage, suspicious saves, a planner for events and announcements, and encrypted backups outside Supabase.']],
  54:[['Spieler-Feedback im Server-Tab und Push-Alarme für Meldungen, Einsprüche, Feedback und neue Abstürze.','Player feedback in the Server tab and push alerts for reports, appeals, feedback and new crashes.']],
  53:[['Moderatoren-Zugänge, Einsprüche gegen Sperren, Zwei-Schritt-Anmeldung und eine Wochenübersicht.','Moderator accounts, ban appeals, two-step sign-in and a weekly summary.']],
  52:[['Das Admin-Panel gibt es nur noch in admin.html. Neu: Konten sperren (auch Geräte), mit Grund und Dauer.','The admin panel now lives only in admin.html. New: ban accounts (and devices), with a reason and duration.']],
  46:[['Backups der Server-Daten mit Wiederherstellung einzelner Konten.','Backups of the server data, with restoring single accounts.']],
  45:[['Tabs „Moderation“ und „Server“: Meldungen, Stummschalten, Wortfilter, Funktionsschalter, Wartungsmodus, Mindestversion und ein eigenes Server-Passwort.','“Moderation” and “Server” tabs: reports, mutes, word filter, feature switches, maintenance mode, minimum version and a separate server password.']],
  42:[['Tab „Online“: Server-Codes, Ankündigungen, globale Events und der Live-Zähler.','“Online” tab: server codes, announcements, global events and the live counter.']],
  40:[['Bestenliste verwalten: Plätze entfernen, sperren und zurücksetzen, Preise ansehen.','Manage the leaderboard: remove, ban and reset spots, see prizes.']],
  35:[['Spielstände, in denen das Admin-Panel benutzt wurde, können nicht in die Bestenliste. So bleibt sie fair.','Saves that used the admin panel can’t join the leaderboard. This keeps it fair.']],
  33:[['Das Admin-Panel ist jetzt mit einem Passwort geschützt.','The admin panel is now protected by a password.']],
  26:[['Admin-Panel neu: Bereiche, Suche, Live-Werte, Spieltempo, Auto-Klicker, Endgame-Werkzeuge und Fehler-Scanner.','New admin panel: sections, search, live values, game speed, auto clicker, endgame tools and error scanner.']],
  10:[['Das Zahnrad öffnet auch das Admin-Panel.','The gear also opens the admin panel.']],
  8:[['Ein Bereich „Welt“ im Admin-Panel.','A “World” section in the admin panel.']],
  7:[['Ein Bereich „Aufträge“ im Admin-Panel.','An “Orders” section in the admin panel.']],
  3:[['Admin-Panel: Hier kannst du fast alles ändern.','Admin panel: here you can change almost everything.']]
};
NEWS.forEach(n=>{(NEWS_ADM[n.v]||[]).forEach(([de,en])=>n.items.push(['adm',de,en]));});
