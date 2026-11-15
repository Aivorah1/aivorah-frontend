import { parseMarkInput } from '../../components/UploadMarksModal';

test.each([
  ['', null], ['  ', null], ['0', 0], ['33', 33], ['100', 100], ['72.5', 72.5], [' 88 ', 88],
  ['101', 'invalid'], ['-1', 'invalid'], ['abc', 'invalid'], ['7.555', 'invalid'], ['1e2', 'invalid'],
])('%j → %j', (input, out) => expect(parseMarkInput(input)).toBe(out));
