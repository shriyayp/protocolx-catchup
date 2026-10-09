/**
 * sampleChats.js — Three sample WhatsApp-export chats as raw text strings.
 * Each goes through the same parser/analyzer as pasted chats (no hardcoded results).
 *
 * Each sample: { id, title, tagline, rawText, defaultUser, defaultSince (ISO string) }
 */

const chat1 = `08/10/26, 9:12 pm - Ananya: Has anyone looked at the problem statements yet?
08/10/26, 9:14 pm - Karthik: not yet 😅
08/10/26, 9:30 pm - Rahul: I'll check them tomorrow morning
08/10/26, 9:31 pm - Meera: 👍
09/10/26, 7:42 am - Ananya: good morning team
09/10/26, 7:43 am - Meera: gm!!
09/10/26, 7:50 am - Karthik: lol the WiFi at the venue is going to be a disaster
09/10/26, 8:05 am - Ananya: Update: registration is open until 10 am today only. Rahul please confirm our team name before that
09/10/26, 8:06 am - Meera: haha 😂
09/10/26, 8:12 am - Karthik: <Media omitted>
09/10/26, 8:20 am - Ananya: Also everyone bring your college ID and laptop charger
09/10/26, 8:31 am - Meera: ok
09/10/26, 8:44 am - Karthik: Rahul, can you set up the GitHub repo and add all of us as collaborators?
09/10/26, 8:45 am - Meera: Which problem statement are we taking?
09/10/26, 8:52 am - Ananya: We decided to go with the "What Did I Miss" chat problem. Final.
09/10/26, 8:53 am - Karthik: agreed
09/10/26, 9:03 am - Meera: Reporting time changed to 11:30 am at Block C, Seminar Hall 2
09/10/26, 9:04 am - Karthik: ok
09/10/26, 9:10 am - Ananya: And the final submission is due by 2 pm sharp. No extensions
09/10/26, 9:15 am - Meera: Rahul did you see the above? You need to send your GitHub username to the organizers by 11 am
09/10/26, 9:16 am - Karthik: 😂😂
09/10/26, 9:30 am - Ananya: Lunch is not provided so carry snacks
09/10/26, 9:32 am - Karthik: Can someone share the venue map?
09/10/26, 9:40 am - Meera: @Rahul urgent - mentor wants to see the repo link at 12 noon`

// Chat 2: CSE Sec B Class Group — 24h Android format, includes multi-line message
const chat2 = `08/10/26, 14:20 - Class Rep Divya: Good afternoon everyone, hope the mid-sems prep is going well
08/10/26, 14:25 - Arjun: lol DBMS is going to destroy me
08/10/26, 14:30 - Sneha: same 😭
08/10/26, 14:35 - Rahul: same here honestly
08/10/26, 14:40 - Class Rep Divya: Important update from ma'am:
The DBMS assignment is due by tomorrow 5 pm.
Everyone please submit on the portal before that.
Late submissions will not be accepted.
08/10/26, 14:42 - Arjun: ok
08/10/26, 14:45 - Sneha: thanks for the heads up
08/10/26, 15:00 - Prof Rao: Rahul, please collect the lab manuals from the department office by 4 pm today
08/10/26, 15:02 - Rahul: sure sir
08/10/26, 15:10 - Arjun: lol
08/10/26, 15:30 - Class Rep Divya: Also the quiz scheduled for Wednesday has been moved to Monday next week
08/10/26, 15:32 - Sneha: ok
08/10/26, 15:35 - Arjun: thanks
08/10/26, 16:00 - Sneha: Can someone share the notes for unit 3?
08/10/26, 16:05 - Arjun: I'll share them tonight
08/10/26, 16:10 - Class Rep Divya: We have decided that the study group will meet in the library from now on. Agreed by majority.
08/10/26, 16:15 - Sneha: ok
08/10/26, 16:20 - Arjun: 👍
08/10/26, 16:30 - Rahul: sounds good
08/10/26, 17:00 - Prof Rao: Don't forget to bring your lab records for the practical on Monday
08/10/26, 17:05 - Sneha: ok sir
08/10/26, 17:10 - Arjun: thanks`

// Chat 3: IEEE CIS Club — iOS bracket format
const chat3 = `[08/10/26, 6:00:00 PM] IEEE Chair Priya: Hi everyone, quick updates on the upcoming event
[08/10/26, 6:05:00 PM] Vikram: 👍
[08/10/26, 6:10:00 PM] Sonia: ok
[08/10/26, 6:15:00 PM] Rahul: looking forward to it
[08/10/26, 6:30:00 PM] IEEE Chair Priya: The guest lecture has been rescheduled to Friday 4 pm at Auditorium 1
[08/10/26, 6:35:00 PM] Vikram: ok
[08/10/26, 6:40:00 PM] Sonia: thanks
[08/10/26, 6:45:00 PM] IEEE Chair Priya: Unfortunately the workshop on Saturday has been cancelled due to speaker unavailability
[08/10/26, 6:50:00 PM] Vikram: oh no
[08/10/26, 7:00:00 PM] Sonia: sad
[08/10/26, 7:15:00 PM] IEEE Chair Priya: @Rahul can you share the event poster with the publicity team by 6 pm today? We need it urgently
[08/10/26, 7:16:00 PM] Vikram: lol
[08/10/26, 7:20:00 PM] Sonia: 👍
[08/10/26, 7:30:00 PM] IEEE Chair Priya: We agreed to go with the poster design proposal B. Final decision.
[08/10/26, 7:35:00 PM] Vikram: ok
[08/10/26, 7:40:00 PM] Sonia: nice
[08/10/26, 7:45:00 PM] IEEE Chair Priya: Everyone please confirm your attendance for the annual general meeting by 15 Oct
[08/10/26, 7:50:00 PM] Vikram: ok
[08/10/26, 7:55:00 PM] Sonia: will do
[08/10/26, 8:00:00 PM] IEEE Chair Priya: Last question - do we want to order custom t-shirts for the event team? Vote now please`

// defaultSince values chosen so ~1/3 of messages are "unread"
const samples = [
  {
    id: 'protocolx',
    title: 'ProtocolX Team',
    tagline: 'Hackathon team chat — deadlines, decisions and a missed mention',
    rawText: chat1,
    defaultUser: 'Rahul',
    defaultSince: '2026-10-09T07:00:00',
  },
  {
    id: 'cse-sec-b',
    title: 'CSE Sec B Class Group',
    tagline: 'Class group — assignments, a moved quiz and a multi-line notice',
    rawText: chat2,
    defaultUser: 'Rahul',
    defaultSince: '2026-10-08T15:00:00',
  },
  {
    id: 'ieee-cis',
    title: 'IEEE CIS Club',
    tagline: 'Club chat — rescheduled event, a cancelled workshop and a past deadline',
    rawText: chat3,
    defaultUser: 'Rahul',
    defaultSince: '2026-10-08T19:00:00',
  },
]

export default samples
