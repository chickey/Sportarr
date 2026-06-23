import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowPathIcon,
  CheckCircleIcon,
  CloudArrowDownIcon,
  ClockIcon,
  InformationCircleIcon,
  PlayCircleIcon,
} from '@heroicons/react/24/outline';
import { toast } from 'sonner';
import apiClient from '../../api/client';
import PageHeader from '../../components/PageHeader';
import PageShell from '../../components/PageShell';

interface CatchupSettings {
  useCatchupWhenAvailable: boolean;
  catchupReadyGraceMinutes: number;
  catchupTimeshiftMode: string;
  catchupBackfillHours: number;
}

const defaultSettings: CatchupSettings = {
  useCatchupWhenAvailable: true,
  catchupReadyGraceMinutes: 5,
  catchupTimeshiftMode: 'auto',
  catchupBackfillHours: 48,
};

export default function CatchupSettingsPage() {
  const [settings, setSettings] = useState<CatchupSettings>(defaultSettings);
  const [baseline, setBaseline] = useState<CatchupSettings>(defaultSettings);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    setLoading(true);
    try {
      const { data } = await apiClient.get<CatchupSettings>('/dvr/catchup-settings');
      const next = {
        ...defaultSettings,
        ...data,
      };
      setSettings(next);
      setBaseline(next);
    } catch (error: any) {
      console.error('Failed to load catchup settings:', error);
      toast.error('Failed to load catchup settings');
    } finally {
      setLoading(false);
    }
  };

  const settingsHasChanges = useMemo(() => {
    return JSON.stringify(settings) !== JSON.stringify(baseline);
  }, [settings, baseline]);

  const handleChange = <K extends keyof CatchupSettings>(key: K, value: CatchupSettings[K]) => {
    setSettings((prev) => ({ ...prev, [key]: value }));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await apiClient.put('/dvr/catchup-settings', settings);
      setBaseline(settings);
      toast.success('Catchup settings saved');
    } catch (error: any) {
      console.error('Failed to save catchup settings:', error);
      toast.error('Failed to save catchup settings', {
        description: error.response?.data?.error || error.message,
      });
    } finally {
      setSaving(false);
    }
  };

  const handleReset = () => {
    setSettings(baseline);
  };

  return (
    <PageShell>
      <PageHeader
        title="Catchup"
        subtitle="Download already-aired events from IPTV archives like an indexer-style source"
        icon={CloudArrowDownIcon}
      />

      <div className="grid gap-6">
        <div className="rounded-2xl border border-cyan-900/30 bg-gradient-to-br from-gray-950 via-slate-950 to-black p-6 shadow-2xl shadow-cyan-950/20">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div className="max-w-3xl">
              <div className="flex items-center gap-3 mb-3">
                <span className="inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-cyan-500/10 border border-cyan-500/20">
                  <CloudArrowDownIcon className="h-6 w-6 text-cyan-400" />
                </span>
                <div>
                  <h2 className="text-xl font-semibold text-white">Catchup downloads</h2>
                  <p className="text-sm text-gray-400">
                    Treat IPTV archive downloads as a standalone source, separate from live DVR recording.
                  </p>
                </div>
              </div>
              <p className="text-sm leading-6 text-gray-300">
                When your provider keeps a timeshift archive, Sportarr can pull the finished event after it airs,
                similar to how an indexer pass discovers a release after it appears. This keeps live recordings for
                real-time capture, while catchup handles the backfilled download path.
              </p>
            </div>

            <Link
              to="/iptv/recordings"
              className="inline-flex items-center gap-2 rounded-xl border border-gray-700 bg-gray-900 px-4 py-2 text-sm text-gray-200 transition-colors hover:border-gray-500 hover:bg-gray-800"
            >
              <PlayCircleIcon className="h-4 w-4" />
              Live recordings
            </Link>
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
          <div className="rounded-2xl border border-gray-800 bg-gray-950/80 p-6">
            <div className="flex items-center gap-3 mb-4">
              <ClockIcon className="h-5 w-5 text-cyan-400" />
              <h3 className="text-lg font-semibold text-white">Download timing</h3>
            </div>

            {loading ? (
              <div className="flex items-center gap-3 py-10 text-gray-400">
                <ArrowPathIcon className="h-5 w-5 animate-spin" />
                Loading catchup settings...
              </div>
            ) : (
              <div className="grid gap-4 md:grid-cols-2">
                <label className="block">
                  <span className="mb-2 block text-sm font-medium text-gray-300">Enable catchup</span>
                  <div className="rounded-xl border border-gray-800 bg-gray-900 p-4">
                    <label className="flex items-center gap-3 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={settings.useCatchupWhenAvailable}
                        onChange={(e) => handleChange('useCatchupWhenAvailable', e.target.checked)}
                        className="h-4 w-4 rounded border-gray-600 bg-gray-800 text-cyan-500 focus:ring-cyan-500"
                      />
                      <div>
                        <div className="text-sm text-white">Use catchup when available</div>
                        <div className="text-xs text-gray-400">Only applies when the provider exposes an archive.</div>
                      </div>
                    </label>
                  </div>
                </label>

                <label className="block">
                  <span className="mb-2 block text-sm font-medium text-gray-300">Start delay</span>
                  <input
                    type="number"
                    min="0"
                    max="180"
                    value={settings.catchupReadyGraceMinutes}
                    onChange={(e) => handleChange('catchupReadyGraceMinutes', parseInt(e.target.value) || 0)}
                    disabled={!settings.useCatchupWhenAvailable}
                    className="w-full rounded-xl border border-gray-800 bg-gray-900 px-4 py-3 text-white outline-none transition-colors focus:border-cyan-500 disabled:opacity-50"
                  />
                  <p className="mt-2 text-xs text-gray-400">
                    Wait this many minutes after the event ends before pulling the archive.
                  </p>
                </label>

                <label className="block">
                  <span className="mb-2 block text-sm font-medium text-gray-300">Timeshift style</span>
                  <select
                    value={settings.catchupTimeshiftMode}
                    onChange={(e) => handleChange('catchupTimeshiftMode', e.target.value)}
                    disabled={!settings.useCatchupWhenAvailable}
                    className="w-full rounded-xl border border-gray-800 bg-gray-900 px-4 py-3 text-white outline-none transition-colors focus:border-cyan-500 disabled:opacity-50"
                  >
                    <option value="auto">Auto-detect</option>
                    <option value="path">Path</option>
                    <option value="php">PHP</option>
                  </select>
                  <p className="mt-2 text-xs text-gray-400">
                    Auto mode will remember the provider style that succeeds first.
                  </p>
                </label>

                <label className="block">
                  <span className="mb-2 block text-sm font-medium text-gray-300">Backfill window</span>
                  <input
                    type="number"
                    min="0"
                    max="336"
                    value={settings.catchupBackfillHours}
                    onChange={(e) => handleChange('catchupBackfillHours', parseInt(e.target.value) || 0)}
                    disabled={!settings.useCatchupWhenAvailable}
                    className="w-full rounded-xl border border-gray-800 bg-gray-900 px-4 py-3 text-white outline-none transition-colors focus:border-cyan-500 disabled:opacity-50"
                  />
                  <p className="mt-2 text-xs text-gray-400">
                    How far back Sportarr should look for missed events to backfill.
                  </p>
                </label>
              </div>
            )}
          </div>

          <div className="space-y-4">
            <div className="rounded-2xl border border-gray-800 bg-gray-950/80 p-5">
              <div className="flex items-center gap-3 mb-3">
                <InformationCircleIcon className="h-5 w-5 text-cyan-400" />
                <h3 className="text-lg font-semibold text-white">How it behaves</h3>
              </div>
              <ul className="space-y-3 text-sm text-gray-300">
                <li className="flex gap-3">
                  <CheckCircleIcon className="mt-0.5 h-4 w-4 flex-shrink-0 text-green-400" />
                  Live DVR still records in real time.
                </li>
                <li className="flex gap-3">
                  <CheckCircleIcon className="mt-0.5 h-4 w-4 flex-shrink-0 text-green-400" />
                  Catchup waits until the event has finished, then downloads the archive window.
                </li>
                <li className="flex gap-3">
                  <CheckCircleIcon className="mt-0.5 h-4 w-4 flex-shrink-0 text-green-400" />
                  A 5 minute grace delay is a good default for providers that need a short buffer before the archive is ready.
                </li>
              </ul>
            </div>

            <div className="rounded-2xl border border-cyan-900/20 bg-cyan-950/20 p-5">
              <h3 className="mb-2 text-sm font-semibold uppercase tracking-wide text-cyan-300">Shortcut</h3>
              <p className="text-sm text-gray-300 mb-4">
                Manage the recordings list, schedules, and import history from the live DVR page.
              </p>
              <Link
                to="/iptv/recordings"
                className="inline-flex items-center gap-2 rounded-xl bg-cyan-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-cyan-500"
              >
                Open recordings
                <PlayCircleIcon className="h-4 w-4" />
              </Link>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-end gap-3 border-t border-gray-800 pt-4">
          <button
            onClick={handleReset}
            disabled={!settingsHasChanges || loading}
            className="rounded-xl border border-gray-700 bg-gray-900 px-4 py-2 text-sm text-gray-200 transition-colors hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Reset
          </button>
          <button
            onClick={handleSave}
            disabled={!settingsHasChanges || loading || saving}
            className="inline-flex items-center gap-2 rounded-xl bg-cyan-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-cyan-500 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {saving ? <ArrowPathIcon className="h-4 w-4 animate-spin" /> : <CheckCircleIcon className="h-4 w-4" />}
            {saving ? 'Saving...' : 'Save Catchup Settings'}
          </button>
        </div>
      </div>
    </PageShell>
  );
}
