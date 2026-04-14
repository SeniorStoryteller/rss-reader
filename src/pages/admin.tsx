import { useState, useEffect, useCallback } from 'react';
import Head from 'next/head';
import type { GetServerSideProps } from 'next';
import type { FeedConfig } from '@/lib/types';

// Returned from getServerSideProps only in production
interface NotAvailableProps {
  notAvailable: true;
}

interface AdminProps {
  notAvailable?: false;
}

type Props = NotAvailableProps | AdminProps;

export const getServerSideProps: GetServerSideProps<Props> = async () => {
  if (process.env.NODE_ENV === 'production') {
    return { props: { notAvailable: true } };
  }
  return { props: {} };
};

const EMPTY_FORM: FeedConfig = { name: '', url: '', category: '' };

function validateFeed(feed: FeedConfig): string | null {
  if (!feed.name.trim()) return 'Name is required.';
  if (!feed.url.startsWith('https://')) return 'URL must start with https://';
  if (!feed.category.trim()) return 'Category is required.';
  return null;
}

export default function AdminPage(props: Props) {
  if ('notAvailable' in props && props.notAvailable) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50 dark:bg-gray-900">
        <p className="text-gray-500 dark:text-gray-400">Not available in production.</p>
      </div>
    );
  }

  return <AdminUI />;
}

function AdminUI() {
  const [feeds, setFeeds] = useState<FeedConfig[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Add form
  const [addForm, setAddForm] = useState<FeedConfig>(EMPTY_FORM);
  const [addError, setAddError] = useState<string | null>(null);
  const [addSuccess, setAddSuccess] = useState(false);

  // Edit state
  const [editIndex, setEditIndex] = useState<number | null>(null);
  const [editForm, setEditForm] = useState<FeedConfig>(EMPTY_FORM);
  const [editError, setEditError] = useState<string | null>(null);

  // Git state
  const [gitStatus, setGitStatus] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [gitLoading, setGitLoading] = useState(false);
  const [hasUnsaved, setHasUnsaved] = useState(false);

  const fetchFeeds = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/feeds');
      if (!res.ok) throw new Error('Failed to fetch feeds');
      const data = (await res.json()) as FeedConfig[];
      setFeeds(data);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load feeds');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchFeeds();
  }, [fetchFeeds]);

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    setAddError(null);
    setAddSuccess(false);
    const validationError = validateFeed(addForm);
    if (validationError) {
      setAddError(validationError);
      return;
    }
    const res = await fetch('/api/admin/feeds', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(addForm),
    });
    if (!res.ok) {
      const data = (await res.json()) as { error: string };
      setAddError(data.error ?? 'Failed to add feed');
      return;
    }
    const data = (await res.json()) as FeedConfig[];
    setFeeds(data);
    setAddForm(EMPTY_FORM);
    setAddSuccess(true);
    setHasUnsaved(true);
  }

  function startEdit(index: number) {
    setEditIndex(index);
    setEditForm({ ...feeds[index] });
    setEditError(null);
  }

  function cancelEdit() {
    setEditIndex(null);
    setEditForm(EMPTY_FORM);
    setEditError(null);
  }

  async function handleSaveEdit(e: React.FormEvent) {
    e.preventDefault();
    if (editIndex === null) return;
    setEditError(null);
    const validationError = validateFeed(editForm);
    if (validationError) {
      setEditError(validationError);
      return;
    }
    const res = await fetch('/api/admin/feeds', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ index: editIndex, feed: editForm }),
    });
    if (!res.ok) {
      const data = (await res.json()) as { error: string };
      setEditError(data.error ?? 'Failed to update feed');
      return;
    }
    const data = (await res.json()) as FeedConfig[];
    setFeeds(data);
    setEditIndex(null);
    setEditForm(EMPTY_FORM);
    setHasUnsaved(true);
  }

  async function handleDelete(index: number) {
    if (!confirm(`Delete "${feeds[index].name}"?`)) return;
    const res = await fetch('/api/admin/feeds', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ index }),
    });
    if (!res.ok) return;
    const data = (await res.json()) as FeedConfig[];
    setFeeds(data);
    setHasUnsaved(true);
  }

  async function handleCommitPush() {
    setGitLoading(true);
    setGitStatus(null);
    const res = await fetch('/api/admin/git', { method: 'POST' });
    const data = (await res.json()) as { success: boolean; hash?: string; error?: string };
    if (data.success) {
      setGitStatus({ type: 'success', message: `Pushed successfully. Commit: ${data.hash ?? ''}` });
      setHasUnsaved(false);
    } else {
      setGitStatus({ type: 'error', message: data.error ?? 'Git operation failed' });
    }
    setGitLoading(false);
  }

  return (
    <>
      <Head>
        <title>Admin — RSS Reader</title>
      </Head>
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <header className="border-b border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-800">
          <div className="mx-auto flex max-w-4xl items-center justify-between px-4 py-4">
            <h1 className="text-xl font-bold text-gray-900 dark:text-gray-100">Feed Admin</h1>
            <a href="/" className="text-sm text-blue-600 hover:underline dark:text-blue-400">
              ← Back to reader
            </a>
          </div>
        </header>

        <main className="mx-auto max-w-4xl px-4 py-8 space-y-10">
          {/* Commit & Push */}
          <section>
            <div className="flex items-center gap-4">
              <button
                onClick={() => void handleCommitPush()}
                disabled={!hasUnsaved || gitLoading}
                className="rounded-md bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {gitLoading ? 'Pushing…' : 'Commit & Push'}
              </button>
              {gitStatus && (
                <p
                  className={`text-sm ${gitStatus.type === 'success' ? 'text-green-700 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}
                >
                  {gitStatus.message}
                </p>
              )}
              {hasUnsaved && !gitStatus && (
                <p className="text-sm text-amber-600 dark:text-amber-400">Unsaved changes — click to commit &amp; push.</p>
              )}
            </div>
          </section>

          {/* Feed list */}
          <section>
            <h2 className="mb-4 text-lg font-semibold text-gray-900 dark:text-gray-100">Feeds</h2>
            {loading ? (
              <p className="text-sm text-gray-500">Loading…</p>
            ) : error ? (
              <p className="text-sm text-red-600">{error}</p>
            ) : feeds.length === 0 ? (
              <p className="text-sm text-gray-500 dark:text-gray-400">No feeds. Add one below.</p>
            ) : (
              <div className="overflow-hidden rounded-lg border border-gray-200 dark:border-gray-700">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 dark:bg-gray-800">
                    <tr>
                      <th className="px-4 py-2 text-left font-medium text-gray-700 dark:text-gray-300">Name</th>
                      <th className="px-4 py-2 text-left font-medium text-gray-700 dark:text-gray-300">URL</th>
                      <th className="px-4 py-2 text-left font-medium text-gray-700 dark:text-gray-300">Category</th>
                      <th className="px-4 py-2 text-left font-medium text-gray-700 dark:text-gray-300">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 bg-white dark:divide-gray-700 dark:bg-gray-900">
                    {feeds.map((feed, i) => (
                      <tr key={i}>
                        {editIndex === i ? (
                          <td colSpan={4} className="px-4 py-3">
                            <form onSubmit={(e) => void handleSaveEdit(e)} className="flex flex-wrap items-end gap-2">
                              <input
                                value={editForm.name}
                                onChange={(e) => setEditForm((f) => ({ ...f, name: e.target.value }))}
                                placeholder="Name"
                                className="w-36 rounded border border-gray-300 px-2 py-1 text-sm dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100"
                              />
                              <input
                                value={editForm.url}
                                onChange={(e) => setEditForm((f) => ({ ...f, url: e.target.value }))}
                                placeholder="https://..."
                                className="w-64 rounded border border-gray-300 px-2 py-1 text-sm dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100"
                              />
                              <input
                                value={editForm.category}
                                onChange={(e) => setEditForm((f) => ({ ...f, category: e.target.value }))}
                                placeholder="Category"
                                className="w-28 rounded border border-gray-300 px-2 py-1 text-sm dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100"
                              />
                              <button
                                type="submit"
                                className="rounded bg-blue-600 px-3 py-1 text-sm text-white hover:bg-blue-700"
                              >
                                Save
                              </button>
                              <button
                                type="button"
                                onClick={cancelEdit}
                                className="rounded bg-gray-200 px-3 py-1 text-sm text-gray-700 hover:bg-gray-300 dark:bg-gray-700 dark:text-gray-200"
                              >
                                Cancel
                              </button>
                              {editError && <p className="w-full text-xs text-red-600">{editError}</p>}
                            </form>
                          </td>
                        ) : (
                          <>
                            <td className="px-4 py-3 text-gray-900 dark:text-gray-100">{feed.name}</td>
                            <td className="max-w-xs truncate px-4 py-3 text-gray-600 dark:text-gray-400">
                              <a href={feed.url} target="_blank" rel="noopener noreferrer" className="hover:underline">
                                {feed.url}
                              </a>
                            </td>
                            <td className="px-4 py-3 text-gray-700 dark:text-gray-300">{feed.category}</td>
                            <td className="px-4 py-3">
                              <div className="flex gap-2">
                                <button
                                  onClick={() => startEdit(i)}
                                  className="rounded bg-gray-100 px-2 py-1 text-xs font-medium text-gray-700 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
                                >
                                  Edit
                                </button>
                                <button
                                  onClick={() => void handleDelete(i)}
                                  className="rounded bg-red-50 px-2 py-1 text-xs font-medium text-red-600 hover:bg-red-100 dark:bg-red-900/20 dark:text-red-400 dark:hover:bg-red-900/40"
                                >
                                  Delete
                                </button>
                              </div>
                            </td>
                          </>
                        )}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>

          {/* Add feed form */}
          <section>
            <h2 className="mb-4 text-lg font-semibold text-gray-900 dark:text-gray-100">Add Feed</h2>
            <form onSubmit={(e) => void handleAdd(e)} className="flex flex-wrap items-end gap-3">
              <div className="flex flex-col gap-1">
                <label className="text-xs font-medium text-gray-600 dark:text-gray-400">Name</label>
                <input
                  value={addForm.name}
                  onChange={(e) => setAddForm((f) => ({ ...f, name: e.target.value }))}
                  placeholder="Ars Technica"
                  className="w-44 rounded border border-gray-300 px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100"
                />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-xs font-medium text-gray-600 dark:text-gray-400">URL</label>
                <input
                  value={addForm.url}
                  onChange={(e) => setAddForm((f) => ({ ...f, url: e.target.value }))}
                  placeholder="https://..."
                  className="w-72 rounded border border-gray-300 px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100"
                />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-xs font-medium text-gray-600 dark:text-gray-400">Category</label>
                <input
                  value={addForm.category}
                  onChange={(e) => setAddForm((f) => ({ ...f, category: e.target.value }))}
                  placeholder="Tech"
                  className="w-32 rounded border border-gray-300 px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100"
                />
              </div>
              <button
                type="submit"
                className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
              >
                Add Feed
              </button>
              {addError && <p className="w-full text-sm text-red-600 dark:text-red-400">{addError}</p>}
              {addSuccess && <p className="w-full text-sm text-green-700 dark:text-green-400">Feed added.</p>}
            </form>
          </section>
        </main>
      </div>
    </>
  );
}
