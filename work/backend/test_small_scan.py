"""Regression checks for small-scan OCR and original-image evidence coordinates."""
import tempfile
import unittest
from pathlib import Path
from unittest.mock import patch

from PIL import Image
from . import ocr
from .intelligence import classify


class SmallScanTest(unittest.TestCase):
    def test_resized_ocr_maps_regions_back_to_original(self):
        with tempfile.TemporaryDirectory() as temporary:
            path = Path(temporary) / 'scan.png'
            Image.new('L', (381, 524), 'white').save(path)

            def recognized(enlarged, language, page, mode=6):
                with Image.open(enlarged) as image:
                    width, height = image.size
                self.assertEqual(mode, 11)
                self.assertEqual(height, 1500)
                return [dict(text='DEED OF GIFT', bbox=[0, 0, width, height],
                             confidence=.8, page=page)]

            with patch.object(ocr, '_recognize', side_effect=recognized):
                line = ocr.recognize(path, 'eng+hin', 2)[0]
            self.assertEqual(line['bbox'], [0, 0, 381, 524])
            self.assertEqual((line['pageWidth'], line['pageHeight'], line['page']), (381, 524, 2))
            with Image.open(path) as original:
                self.assertEqual(original.size, (381, 524))
            self.assertEqual(classify(line['text']), 'Registration Deed')

    def test_blank_small_scan_stays_empty(self):
        with tempfile.TemporaryDirectory() as temporary:
            path = Path(temporary) / 'blank.png'
            Image.new('L', (381, 524), 'white').save(path)
            self.assertEqual(ocr.recognize(path, 'eng', 1), [])
