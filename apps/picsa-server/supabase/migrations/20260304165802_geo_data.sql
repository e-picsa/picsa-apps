-- Countries

INSERT INTO geo.countries (code, name, local_name)
VALUES ('MW', 'Malawi', 'Malaŵi');

INSERT INTO geo.countries (code, name)
VALUES ('ZM', 'Zambia');

INSERT INTO geo.countries (code, name)
VALUES ('ZW', 'Zimbabwe');

INSERT INTO geo.countries (code, name, local_name)
VALUES ('TJ', 'Tajikistan', 'Tojikiston');

INSERT INTO geo.countries (code, name)
VALUES ('ZZ', 'Global');

INSERT INTO geo.countries (code, name)
VALUES ('XX', 'Test');

-- Locales

INSERT INTO geo.locales (language_code, name, local_name, country_code)
VALUES
  -- Default (non-localised)
  ('en', 'English', NULL, NULL),
  -- Malawi
  ('en', 'English', NULL, 'MW'),
  ('ny', 'Chichewa', 'Chichewa', 'MW'),
  ('tum', 'Tumbuka', 'chiTumbuka', 'MW'),
  -- Zambia
  ('en', 'English', NULL, 'ZM'),
  ('ny', 'Nyanja', 'Chinyanja', 'ZM'),
  ('bem', 'Bemba', 'Ichibemba', 'ZM'),
  ('toi', 'Tonga', 'ChiTonga', 'ZM'),
  ('loz', 'Lozi', 'Silozi', 'ZM'),
  ('lun', 'Lunda', 'ChiLunda', 'ZM'),
  ('kqn', 'Kaonde', 'ChiKaonde', 'ZM'),
  ('lue', 'Luvale', 'ChiLuvale', 'ZM'),
  -- Zimbabwe
  ('en', 'English', NULL, 'ZW'),
  ('sn', 'Shona', 'ChiShona', 'ZW'),
  ('nd', 'Ndebele', 'isiNdebele', 'ZW'),
  -- Tajikistan
  ('tg', 'Tajik', 'Тоҷикӣ', 'TJ');