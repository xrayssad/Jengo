# Test accounts

Do not put the service role key in this file.

## Accounts

| Role | Email | Password | Username | Full name | Admin |
| --- | --- | --- | --- | --- | --- |
| Seller | seller@jengo.app | TestSeller#2026 | jengo_seller | Jengo Seller | false |
| Buyer | buyer@jengo.app | TestBuyer#2026 | jengo_buyer | Jengo Buyer | false |

An extra admin account `admin@jengo.app` / `TestAdmin#2026` / `jengo_admin` was created only so step 2 can publish through the real admin API. Seller and buyer stay non-admin.

## Transaction path

- PASS: 1. Seller logs in and posts vifaa + chumba — c967b74d-4352-46ff-b408-92d50a99add4 e5400367-820a-42cd-a9e1-8b75ac2f8401
- PASS: 2. Admin publishes both
- PASS: 3. Buyer logs in, finds both, sends requests — 8a1ecda9-6dc6-43e6-a856-5b1eacb5ca47 30a7dbeb-31ae-43ae-805e-bc49489c0aaa
- PASS: 4. Seller accepts both
- PASS: 5. Buyer confirms move-in on chumba — moved_in
- PASS: 6. Buyer submits 5-star review — {'booking_id': '30a7dbeb-31ae-43ae-805e-bc49489c0aaa', 'rating': 5, 'comment': 'Nyumba nzuri'}
- PASS: 7. Category isolation — vifaa_on_nyumba=False chumba_on_vifaa=False
