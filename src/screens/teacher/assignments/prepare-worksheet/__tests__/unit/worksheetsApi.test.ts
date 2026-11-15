// /worksheets client: signed-in requests to the assignments service.
import * as api from '../../services/worksheetsApi';

jest.mock('../../../../../../config/assignmentsServerUrl', () => 'https://assign.test');
jest.mock('../../../../../../services/authHeader', () => ({ authHeader: async () => ({ Authorization: 'Bearer tok' }) }));

const realFetch = global.fetch;
afterEach(() => { global.fetch = realFetch; });

function mockFetch(body: any, ok = true) {
  const f = jest.fn(async () => ({ ok, json: async () => body }));
  global.fetch = f as any;
  return f;
}

test('save, update and share send JSON with the sign-in token', async () => {
  const f = mockFetch({ item: { id: 'w1', title: 'A', updated_at: 'x' } });
  await api.createWorksheet('A', '<p>x</p>');
  expect(f).toHaveBeenLastCalledWith('https://assign.test/worksheets', {
    method: 'POST', headers: { Authorization: 'Bearer tok', 'Content-Type': 'application/json' }, body: JSON.stringify({ title: 'A', html: '<p>x</p>' }),
  });
  await api.updateWorksheet('w1', 'B', '<p>y</p>');
  expect(f).toHaveBeenLastCalledWith('https://assign.test/worksheets/w1', expect.objectContaining({ method: 'PUT', body: JSON.stringify({ title: 'B', html: '<p>y</p>' }) }));
  mockFetch({ sharedWith: { id: 't2' } });
  await api.shareWorksheet('w1', 't2');
  expect(global.fetch).toHaveBeenLastCalledWith('https://assign.test/worksheets/w1/share', expect.objectContaining({ method: 'POST', body: JSON.stringify({ teacherId: 't2' }) }));
});

test('lists and the Word file use GET', async () => {
  const f = mockFetch({ items: [{ id: 'w1' }], teachers: [{ id: 't2' }], fileName: 'A.docx', base64: 'AAA', mimeType: 'x' });
  expect(await api.listWorksheets()).toEqual([{ id: 'w1' }]);
  expect(await api.listSharedWorksheets()).toEqual([{ id: 'w1' }]);
  expect(await api.listSchoolTeachers()).toEqual([{ id: 't2' }]);
  expect((await api.fetchWorksheetDocx('w1')).fileName).toBe('A.docx');
  expect(f.mock.calls.map((c: any) => c[0])).toEqual([
    'https://assign.test/worksheets', 'https://assign.test/worksheets/shared', 'https://assign.test/worksheets/teachers', 'https://assign.test/worksheets/w1/docx',
  ]);
  expect((f.mock.calls[0] as any)[1]).toEqual({ method: 'GET', headers: { Authorization: 'Bearer tok' }, body: undefined });
});

test('the server\'s error message is shown', async () => {
  mockFetch({ error: 'You can only share with teachers of your school' }, false);
  await expect(api.shareWorksheet('w1', 't9')).rejects.toThrow('You can only share with teachers of your school');
});
