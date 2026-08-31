#!/usr/bin/env python3
"""
Prepare a "finish the lyric" karaoke track: the full song plays normally
until the cut point, then the vocals fade out over half a second and the
backing track carries on alone.

Pipeline: Demucs splits the song into vocals + backing, FFmpeg trims the
vocal stem at the cut point and mixes it back over the full-length backing.

Setup (once):
    pip install demucs        # AI stem separation, runs fine on CPU
    ffmpeg on PATH            # you already have this from Auto Video

Usage:
    python tools/prepare_lyric_track.py song.mp3 --cut 1:04
    python tools/prepare_lyric_track.py song.mp3 --cut 64.5 --fade 0.8 -o dancing-queen.mp3

Then:
  1. Put the output mp3 in the folder you'll load on the display laptop.
  2. In src/lib/rounds.js give the round:  audio: 'dancing-queen.mp3', cutAt: 64
     (the script prints the exact line to paste)

First run downloads the Demucs model (~80 MB); separation takes a few
minutes per song on CPU.
"""

import argparse
import shutil
import subprocess
import sys
import tempfile
from pathlib import Path


def parse_time(value: str) -> float:
    """Accept seconds ('64.5') or mm:ss ('1:04.5')."""
    if ':' in value:
        minutes, seconds = value.split(':', 1)
        return int(minutes) * 60 + float(seconds)
    return float(value)


def die(message: str) -> None:
    print(f'ERROR: {message}', file=sys.stderr)
    sys.exit(1)


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__.strip().splitlines()[0])
    parser.add_argument('song', type=Path, help='input audio file (mp3/wav/m4a/flac)')
    parser.add_argument('--cut', required=True,
                        help='where the vocals stop, as seconds or mm:ss (e.g. 1:04)')
    parser.add_argument('--fade', type=float, default=0.5,
                        help='vocal fade-out length in seconds (default 0.5)')
    parser.add_argument('-o', '--output', type=Path, default=None,
                        help='output mp3 (default: <song>-karaoke-cut.mp3)')
    args = parser.parse_args()

    if not args.song.exists():
        die(f'{args.song} not found')
    if shutil.which('ffmpeg') is None:
        die('ffmpeg not found on PATH')
    if shutil.which('demucs') is None:
        die('demucs not found — run: pip install demucs')

    cut = parse_time(args.cut)
    fade_start = max(cut - args.fade, 0)
    output = args.output or args.song.with_name(f'{args.song.stem}-karaoke-cut.mp3')

    with tempfile.TemporaryDirectory(prefix='lyric-track-') as tmp:
        print(f'[1/2] Separating stems with Demucs (a few minutes on CPU)…')
        subprocess.run(
            ['demucs', '--two-stems=vocals', '-o', tmp, str(args.song)],
            check=True,
        )
        # demucs writes <tmp>/<model>/<songname>/{vocals,no_vocals}.wav
        stems = list(Path(tmp).glob(f'*/{args.song.stem}'))
        if not stems:
            die('could not find Demucs output stems')
        vocals = stems[0] / 'vocals.wav'
        backing = stems[0] / 'no_vocals.wav'

        print(f'[2/2] Mixing: vocals fade out at {cut:.1f}s, backing plays on…')
        subprocess.run(
            [
                'ffmpeg', '-y',
                '-i', str(backing),
                '-i', str(vocals),
                '-filter_complex',
                f'[1:a]atrim=0:{cut},afade=t=out:st={fade_start}:d={args.fade}[v];'
                f'[0:a][v]amix=inputs=2:duration=first:dropout_transition=0:normalize=0[out]',
                '-map', '[out]',
                '-c:a', 'libmp3lame', '-q:a', '2',
                str(output),
            ],
            check=True,
        )

    print(f'\nDone: {output}')
    print('\nPaste into that song\'s entry in src/lib/rounds.js:')
    print(f"    audio: '{output.name}',")
    print(f'    cutAt: {cut:g},')


if __name__ == '__main__':
    main()
