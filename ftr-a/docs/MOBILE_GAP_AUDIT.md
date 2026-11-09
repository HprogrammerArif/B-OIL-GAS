# Mobile gap audit — BOGCL OneOps (`ftr-a`)

Date: 9 November 2026. Updated the same day after the broken clusters were wired to real actions.

A button is **broken** when the tap shows success and the record does not change. It is **partial** when the change lives only in memory (gone after a refresh) or the screen that opens is the wrong record. **Deferred** means the work was left out on purpose and no button pretends it is done.

Counts from the tables below: **6 broken**, **24 partial**, **5 flow gaps**, **10 deferred**.

## Fixed on 9 November 2026

These taps now save, open a real channel, or open the system print dialog. A success message is shown only after that succeeds. A failure shows the error from the call.

| What | What the tap does now |
| :-- | :-- |
| Driver SOS (breakdown, medical, gate) | `POST /fleet/sos` with the chosen note, and the driver's trip when one is assigned. |
| Notify at Gate | Writes "Car is waiting at the gate." on that trip's chat. |
| Call Passenger | Opens `tel:` for the passenger's number. No number, or no dialler, is an error. |
| Log toll | Asks for the plaza and amount, then `POST /trips/:id/tolls`. Above ৳200 the trip still asks for a photo. |
| Seat swap (both buttons) | `POST /bus/routes/:id/swap` for the selected route and that seat. |
| Shift pass and monthly seat | Join that route's waitlist. Someone who already has a seat sees that error. |
| Broadcast | Sends the text already typed (at least a short sentence) on the selected route. |
| Inbound / outbound | The coach list keeps plant routes one way and the rest the other way. |
| Scan / mark boarded | `setSeat` with boarded true, then the seat is marked. A missing seat stays unmarked. |
| Swap bus | Assigns the next route's bus number onto the selected route. |
| WhatsApp, SMS, email | Opens `wa.me`, `sms:`, or `mailto:` with the pass text. The visit wire now includes the guest phone for this. |
| Barrier | Writes an observation on the visit: the plate was admitted at gate 1. |
| Return query | `returnForChanges` with that preset. The claim list now includes `workflowInstanceId`. |
| Approve & SAP voucher, and Mark paid | `claimRepository.pay`. The toast names the voucher that was written. |
| Print plate (list and asset) | System print dialog for an A6 QR plate of the tag. |
| Print memorandum | Same `printNoteSheet` path as the app-bar print. |

## Broken buttons

The toast or animation says the job is done. Nothing is saved.

### Home

| Button | File | What the person expects | What the tap does |
| :-- | :-- | :-- | :-- |
| Listen to Today's Summary | `lib/features/home/presentation/widgets/chairman_cockpit.dart` (`_togglePlay`, ~434) | The seeded briefing plays | A timer moves a waveform for a fixed length. There is no audio. |
| Record Voice Briefing | same file (`_startRecording` / `_stopRecording`, ~463) | A microphone recording for the chosen person | A timer types a canned script. Stop fills in that same script. |

### Parcels

| Button | File | What the person expects | What the tap does |
| :-- | :-- | :-- | :-- |
| Hand Over Entire Pouch at Destination Gate | `lib/features/parcels/presentation/parcels_screen.dart` (~232) | Every parcel in the pouch is handed over | A toast names `POUCH-DHAKA-KER-01`. The list is unchanged. |

### Workforce

| Button | File | What the person expects | What the tap does |
| :-- | :-- | :-- | :-- |
| Return to Store & Clear Desk | `lib/features/workforce/presentation/people_detail_screen.dart` (~435) | Held equipment is returned and the IT desk can clear | A toast says the return was registered. The holding alert stays. Clear Desk and Clear All Desks on the same screen do save. |
| Download PDF | same file (~230) | The exit certificate is saved | A toast says it was exported to downloads. The certificate number exists only inside that dialog. |

### Chat

| Button | File | What the person expects | What the tap does |
| :-- | :-- | :-- | :-- |
| Voice Call | `lib/features/chat/presentation/chat_screen.dart` (~140) and `chat_thread_screen.dart` (~251) | A phone call | A dialog stuck at "00:42 · Corporate Voice Line". End call toasts that the call ended. |

## Partial buttons

Something moves on screen, or a message is stored, but the job the label names is not finished.

| Button | File | What the person expects | What the tap does |
| :-- | :-- | :-- | :-- |
| Issue & Sign Fuel Voucher | `lib/features/fleet/presentation/fleet_screen.dart` (~692) | A signed voucher kept with the fleet | Inserts a row into `_fuelVouchers` and toasts. Refresh drops it. |
| Confirm Test | same file (~502) | A fitness record for that driver | Writes `_breathalyzerLogs` and toasts. Refresh drops it. |
| Confirm & Start | `driver_cockpit.dart` (~74) | The trip and opening odometer are written, with GPS | Sets `_tripStarted` and toasts that GPS is active. Refresh returns the trip to assigned. |
| Complete Trip | same file (~129) | Closing kilometres are stored | Sets `_tripCompleted` and toasts a distance. The fleet trip is unchanged. |
| Authorize Commercial Dispatch | `plant_gm_cockpit.dart` (~336) | Batch B88 is released on record | Waits 600 ms, sets `_batchReleased`, and toasts. |
| Verify & Restore to Service / Re-apply Lockout | same file (~704) | The lock-out changes | Adds or removes the id in `_restored`. |
| Vacate My Seat for Today / Reclaim My Vacated Seat | `bus_screen.dart` (~334, ~351) | Today's allocation changes | Edits `_myVacatedSeats`, then toasts. |
| View Digital Boarding QR Pass | same file (~383) | A code a conductor can scan | Shows an `Icons.qr_code_2` graphic. |
| Assign to Seat 3B | same file (~1304) | That person is seated and told | Removes the first wait-list name and toasts that an SMS was sent. |
| Mark All Visitors Accounted For / Mark Safe | `visitors_screen.dart` (~540, ~772) | Each guest is recorded safe | Adds ids to `_demoMusterSafe` and toasts. Refresh clears it. |
| Verify & Forward | `claims_screen.dart` (~619) | The claim is verified and sent to finance | Approves when the card has a workflow id, and shows the error when it does not. The local flag still paints the card until the list reloads. |
| Fix & Resubmit Claim | same file (~571) | The returned claim opens for correction | Opens a new claim form with only the type filled in. The returned claim stays as it was. |
| Bank file | same file (~1188) | A transfer file for today's payables | Shows the lines and copies them. Nothing is paid. The status note already describes this as a copy. |
| Scan Tag | `assets_screen.dart` (~285) | The camera reads a tag | Opens a text field and searches the register for what was typed. |
| Depreciation Accounting Method (SLM / DDB) | same file (~1050) | The books switch method | Multiplies the on-screen totals (`accumulated × 1.35`, NBV `× 0.85`). Records are unchanged. |
| −1 Consume | `asset_detail_screen.dart` (~1154) | One spare is issued and stock falls | Decrements a hardcoded spare list and toasts. Refresh restores the quantities. |
| +5 Restock | same file (~1175) | Five units are received | Adds 5 to that same list and toasts. |
| E-Sign Certificate | `note_sheet_detail_screen.dart` (~229) | This file's signers, stamps, and hash | Fixed names (Ahmed Akbar Sobhan, Farida Begum, Engr. Harunur Rashid) and a stand-in hash when `finalHash` is empty. The real hash sits in Signed and verified. |
| Official Memo | same file (~232) | This file's date and sign-off | Title and paragraphs are the file's. The date is fixed at 07 November 2026 and the names are the same fixed people. |
| Mute and Speaker | `chat_screen.dart` and `chat_thread_screen.dart` (inside the call dialog) | Microphone and audio route | The icons flip in memory. |
| Play on a voice bubble | `chat_thread_screen.dart` (~1589) | Playback of a recording | A one-second timer and a waveform. The transcript is text already on the bubble. |
| Record Voice Note | same file (~1761) | A captured clip | A timer, then Send posts `VOICE:<seconds>\|<fixed transcript>`. A message is saved. The audio is not. |
| Attach Official Record | same file (~455) | A link to a live file | Four fixed tiles (a note-sheet, a lab batch, an incident, a licence). Each sends a canned sentence. |
| Submit Quick Hazard Alert Now / Submit Incident Report | `incidents_screen.dart` (~258, ~644) | A failed save is shown as a failure | On success the report is created. The review lines (witnesses, eye-wash, Form B-12) are fixed text and are not sent. If the call throws, the toast still says the report was logged. |

## Flow gaps

These controls do change data, or they open a screen. The path still skips the step the label promises.

| Gap | Where | What happens |
| :-- | :-- | :-- |
| Home **Approve** signs without the signature sheet | `chairman_cockpit.dart` (~1585) | Calls `approvalRepository.approve` and toasts "File e-signed and approved". **E-Sign Now** on the high-value card already opens the signature sheet. **Review** opens the approval. |
| Approvals quick sheet cannot reject | `approvals_screen.dart` (~967) | Every reason calls `returnForChanges`. Reject exists on the approval detail screen. |
| Due-soon chip can invent a count | same file (~117 and ~204) | If no item is danger or overdue, the chip count is forced to 4. If the inbox amounts sum to zero, the banner total falls back to ৳1,36,50,000. The filter itself uses real SLA, so the chip can promise 4 and then show an empty list. |
| Briefing notification opens Home | `dashboard_engine.dart` (~935) writes `route: /home/dashboards`. `router.dart` (~231) redirects that path to Home. | **Open** on that inbox row lands on Home, not the briefing. |
| Open Record and pinned search open a list | `chat_thread_screen.dart` (~1428) and `search_sheet.dart` (~411) | Note-sheet and incident cards open the module list, not the named id. A lab-report card does not match "Note-Sheet" or "HSE Incident", so it opens Licences. Pinned rows NS-2026-0041, INC-2026-0009, AST-PLT-001, and the licence row do the same. Search hits that carry their own route do open that route. |

## Deferred (named, and no fake button)

Taken from the Notes column of `ftr-a/docs/FEATURE_STATUS.md`. These are left out. They are not the toast buttons above.

| Module | Left out |
| :-- | :-- |
| Approvals | Delegation rules admin |
| Notices | Drafts, scheduling, POLICY approval |
| Bus | A separate shift-pass product. The button joins the waitlist. |
| Note-sheets | Public verify, and confidentiality that actually hides the file |
| Incidents | Form B-12 (the wizard mentions it as fixed text) |
| Assets | Requisition workflow, FI-AA export |
| Compliance | Fund workflow, certificate files, regulator sync |
| Workforce | Set-password mail, session revoke |
| Dashboards | A live SCADA feed and the ROI PDF stay off the phone |
| Chat | A live call stays `tel:` on fleet trips. The in-app voice dialog above is a separate fake. |

One Notes line is stale. Fleet says vehicle and driver CRUD is deferred. Register a car and enrol a driver already call `registerVehicle` and `enrolDriver` from `fleet_screen.dart` (~2025).

Phase 8 (tests once, and an APK) is still Todo in the same status file. That is a release gap, not a button.

## Checked, and the main actions persist

These were opened while hunting the buttons above. Their primary actions call a repository or a real print/call path.

- Leave: apply, attachment, cancel.
- Attendance: punch, regularise, the team roster. Home **E-Sign Now** opens the signature sheet.
- Notices: publish, acknowledge, receipts.
- Licences: renew, checklist, fund, inspection, certificate, revert, DO letter.
- Approvals detail: approve, reject, return, delegate, comment, withdraw, batch approve.
- Note-sheet: sign, return, reject, withdraw, app-bar PDF.
- Fleet: ask, assign, gate, tolls on the trip, SOS list, trip chat, `tel:` call, register car, enrol driver. The fuel voucher and the breathalyser test are the two partial rows above.
- Parcels: create, detail actions, OTP.
- Visitors: register, the detail workflow, the printed guest pass, the muster screen.
- Workforce: onboard, clear desk, finalise. The two buttons in the broken table are the exceptions.
- Claims detail: submit and **Mark as paid**.
- More: photo, modules, outbox, activity, sign-out, theme. Activity verify and copy proof run.
