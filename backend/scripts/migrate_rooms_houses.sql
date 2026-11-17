-- Map old Rooms / Houses category ids onto rooms-houses.
-- Keeps the room-or-house choice in attributes.property_type.
-- Run once against the listings table. Safe to re-run.

update listings
set
  category = 'rooms-houses',
  attributes = jsonb_set(
    coalesce(attributes, '{}'::jsonb),
    '{property_type}',
    to_jsonb(
      case coalesce(attributes->>'property_type', attributes->>'room_type', '')
        when 'self-contained' then 'self'
        when 'whole' then 'house'
        when 'whole_house' then 'house'
        when 'single_room' then 'single'
        when 'single' then 'single'
        when 'master' then 'master'
        when 'self' then 'self'
        when 'house' then 'house'
        else coalesce(nullif(attributes->>'room_type', ''), 'single')
      end
    ),
    true
  )
where category in (
  'chumba_nyumba',
  'rooms',
  'room',
  'houses',
  'house',
  'nyumba',
  'chumba',
  'vyumba',
  'vyumba_na_nyumba'
);
