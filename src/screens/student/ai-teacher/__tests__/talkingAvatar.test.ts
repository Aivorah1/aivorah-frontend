// The talking Learning Buddy: lip-sync timing, the face maps of the buddy
// pictures, the mouth / jaw geometry and the blink timing.
import { LipSync, mouthOpenFor } from '../avatar/lipSync';
import { containRect, faceShape, facePointsFor, jawProfile, maxJawDrop, mouthLineY, FACE_POINTS } from '../avatar/faceGeometry';
import { Blinker } from '../avatar/faceRenderer';
import { BUDDY_PICTURES } from '../../profile/buddyPictures.generated';
import { getBuddyById } from '../../profile/learningBuddyConstants';
import { teacherAvatar } from '../utils/buddyAvatar';

describe('lip shapes', () => {
  test('vowels open the mouth, m / b / p close it, pauses close it', () => {
    expect(mouthOpenFor('a')).toBe(1);
    expect(mouthOpenFor('o')).toBeGreaterThan(mouthOpenFor('t'));
    expect(mouthOpenFor('e')).toBeGreaterThan(mouthOpenFor('s'));
    for (const c of ['m', 'b', 'p', 'M', '.', ',', '?']) expect(mouthOpenFor(c)).toBe(0);
    expect(mouthOpenFor(' ')).toBeLessThan(0.1);
  });

  test('Hindi: matras and vowels open, म / ब / प close', () => {
    expect(mouthOpenFor('ा')).toBeGreaterThan(0.5);
    expect(mouthOpenFor('आ')).toBeGreaterThan(0.5);
    expect(mouthOpenFor('म')).toBe(0);
    expect(mouthOpenFor('क')).toBeGreaterThan(0);
  });
});

describe('LipSync', () => {
  test('closed until speech starts and after it ends', () => {
    const l = new LipSync();
    expect(l.openness(0)).toBe(0);
    l.begin('Hello Asha', 'en', 1000);
    expect(l.speaking).toBe(true);
    l.end();
    expect(l.openness(1100)).toBe(0);
  });

  test('without word events the sentence is paced at speaking speed, then the mouth closes', () => {
    const l = new LipSync();
    const text = 'aaaa mmmm';
    l.begin(text, 'en', 0);
    expect(l.openness(50)).toBeGreaterThan(0.8); // in the "aaaa"
    const intoM = (6 / 14.5) * 1000; // about the 7th character
    expect(l.openness(intoM)).toBeLessThan(0.1); // in the "mmmm"
    expect(l.openness(5000)).toBe(0); // past the end
  });

  test('a word event re-anchors to the word being heard, and the mouth waits there for the next one', () => {
    const l = new LipSync();
    const text = 'mama papa amma';
    l.begin(text, 'en', 0);
    l.boundary(10, 2000); // the voice is slow: it only now reached "amma"
    expect(l.position(2000)).toBe(10);
    expect(l.openness(2000)).toBe(1); // "a"
    // However long until the next event, it never runs past the end of "amma".
    expect(l.position(60000)).toBeLessThanOrEqual(text.length);
    l.boundary(5, 2100);
    expect(l.position(2100)).toBe(5);
  });

  test('Hindi is paced a little slower', () => {
    const en = new LipSync(); en.begin('x'.repeat(100), 'en', 0);
    const hi = new LipSync(); hi.begin('x'.repeat(100), 'hi', 0);
    expect(hi.position(1000)).toBeLessThan(en.position(1000));
  });
});

describe('face maps', () => {
  test('every picture buddy, in every outfit, has a face map for lips and eyes', () => {
    for (const [character, pictures] of Object.entries(BUDDY_PICTURES)) {
      for (const [key, source] of Object.entries(pictures)) {
        const points = facePointsFor(source);
        expect({ picture: `${character}/${key}`, mapped: !!points }).toEqual({ picture: `${character}/${key}`, mapped: true });
        expect(points).toHaveLength(FACE_POINTS.length * 2);
        expect(points!.every((v) => v >= 0 && v <= 1)).toBe(true);
      }
    }
  });

  test('the default teacher avatar is mapped; a classic buddy with no face found is not', () => {
    expect(facePointsFor(teacherAvatar(null).source)).not.toBeNull();
    const jerry = getBuddyById('jerry');
    if (jerry) expect(facePointsFor(jerry.image)).toBeNull();
    expect(facePointsFor(null)).toBeNull();
    expect(facePointsFor(12345)).toBeNull();
  });

  test('eyes sit above the mouth and the mouth above the chin on every map', () => {
    for (const pictures of Object.values(BUDDY_PICTURES)) {
      for (const source of Object.values(pictures)) {
        const f = faceShape(facePointsFor(source)!, { x: 0, y: 0, w: 512, h: 512 });
        for (const eye of f.eyes) {
          expect(eye.center.y).toBeLessThan(f.mouth.center.y);
          expect(eye.width).toBeGreaterThan(5);
        }
        expect(f.mouth.center.y).toBeLessThan(f.chin.y);
        expect(f.mouth.width).toBeGreaterThan(10);
      }
    }
  });
});

describe('mouth geometry', () => {
  const points = facePointsFor(teacherAvatar(null).source)!;
  const rect = containRect(512, 512, 400, 300);
  const face = faceShape(points, rect);

  test('the picture is fitted inside the box, centred', () => {
    expect(rect).toEqual({ x: 50, y: 0, w: 300, h: 300 });
    expect(containRect(1024, 512, 200, 200)).toEqual({ x: 0, y: 50, w: 200, h: 100 });
  });

  test('the lips part along a line through both corners and the middle of the lips', () => {
    expect(mouthLineY(face, face.mouth.left.x)).toBeCloseTo(face.mouth.left.y, 5);
    expect(mouthLineY(face, face.mouth.right.x)).toBeCloseTo(face.mouth.right.y, 5);
    expect(mouthLineY(face, face.mouth.center.x)).toBeCloseTo(face.mouth.center.y, 0);
  });

  test('the jaw drops most in the middle and not at the corners', () => {
    expect(jawProfile(face, face.mouth.center.x)).toBeCloseTo(1, 5);
    expect(jawProfile(face, face.mouth.left.x)).toBeLessThan(0.05);
    expect(jawProfile(face, face.mouth.right.x + 20)).toBe(0);
    expect(maxJawDrop(face)).toBeGreaterThan(1);
    expect(maxJawDrop(face)).toBeLessThan(face.chin.y - face.mouth.center.y);
  });
});

describe('Blinker', () => {
  test('eyes stay open between blinks; a blink closes them fully and reopens within ~150 ms', () => {
    const b = new Blinker(0, () => 0); // first blink at 1200 ms, never a double blink
    expect(b.value(0)).toBe(0);
    expect(b.value(1199)).toBe(0);
    expect(b.value(1200)).toBe(0);
    expect(b.value(1275)).toBeCloseTo(1, 1);
    expect(b.value(1340)).toBeLessThan(0.3);
    expect(b.value(1400)).toBe(0);
    expect(b.value(2000)).toBe(0); // the next blink is at least 2.2 s later
  });

  test('sometimes blinks twice', () => {
    const b = new Blinker(0, () => 0.1); // 0.1 < 0.18: a double blink
    const seen: number[] = [];
    for (let t = 1300; t < 2000; t += 10) seen.push(b.value(t));
    const closings = seen.filter((v, i) => v > 0.9 && (i === 0 || seen[i - 1] <= 0.9)).length;
    expect(closings).toBe(2);
  });
});

describe('LipSync with a real voice\'s word events', () => {
  test('learns the voice speed from the gaps between word events', () => {
    const l = new LipSync();
    const text = 'one two six ten red sun';
    l.begin(text, 'en', 0);
    l.boundary(0, 0);
    l.boundary(4, 1000); // 4 characters a second: a slow voice
    l.boundary(8, 2000);
    const before = l.position(2100) - 8;
    expect(before).toBeLessThan((14.5 * 0.1)); // slower than the default pace now
  });

  test('while waiting on a long word the lips keep moving instead of freezing', () => {
    const l = new LipSync();
    l.begin('extraordinarily long words here', 'en', 0);
    l.boundary(0, 0);
    const samples = [3000, 3050, 3100, 3150].map((t) => l.openness(t));
    expect(Math.max(...samples) - Math.min(...samples)).toBeGreaterThan(0.05);
    expect(Math.min(...samples)).toBeGreaterThan(0.1);
  });
});
