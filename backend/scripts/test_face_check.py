"""The face comparison keeps only verdict codes, never a transcribed ID."""

import unittest

from app.face_check import parse_face_reply, prompt_for


class FaceCheckTests(unittest.TestCase):
    def test_prompt_names_nida_and_a_licence_without_asking_for_the_number(self):
        text = prompt_for("nida")
        self.assertIn("NIDA", text)
        self.assertIn("driving licence", text)
        self.assertIn("Do not transcribe", text)
        self.assertNotIn("document number", text.lower().split("do not")[0])

    def test_reply_drops_anything_that_is_not_a_reason_code(self):
        raw = '{"verdict":"mismatch","confidence":1.4,"document_seen":"nida","reasons":["different_face","1990123456789012","same_face"]}'
        parsed = parse_face_reply(raw)
        self.assertEqual(parsed["verdict"], "mismatch")
        self.assertEqual(parsed["confidence"], 1)
        self.assertEqual(parsed["reasons"], ["different_face", "same_face"])

    def test_broken_reply_stays_unsure(self):
        parsed = parse_face_reply("not json")
        self.assertEqual(parsed["verdict"], "unsure")
        self.assertEqual(parsed["reasons"], [])


if __name__ == "__main__":
    unittest.main()
