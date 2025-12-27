import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Box,
  Typography,
  Tabs,
  Tab,
  Card,
  CardContent,
  Grid,
  TextField,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  CircularProgress,
  Alert,
  Divider,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Chip,
  TablePagination,
} from '@mui/material';
import {
  Add,
  Delete,
  Edit,
  Download,
  Insights,
  ListAlt,
  ShowChart,
  Save,
  Close,
} from '@mui/icons-material';
import toast from 'react-hot-toast';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  BarChart,
  Bar,
} from 'recharts';
import { format } from 'date-fns';
import { healthService } from '../services/healthService';

const DATA_TYPE_OPTIONS = [
  { value: 'heart-rate', label: 'Heart Rate' },
  { value: 'blood-pressure', label: 'Blood Pressure' },
  { value: 'weight', label: 'Weight' },
  { value: 'glucose', label: 'Blood Glucose' },
  { value: 'sleep', label: 'Sleep' },
  { value: 'mood', label: 'Mood' },
  { value: 'activity', label: 'Activity' },
];

const DEFAULT_RECORDED_AT = () => {
  const now = new Date();
  now.setSeconds(0);
  now.setMilliseconds(0);
  return now.toISOString().slice(0, 16);
};

const safeNumber = (value) => {
  if (value === '' || value === null || value === undefined) return undefined;
  const num = Number(value);
  return Number.isFinite(num) ? num : undefined;
};

const formatDateLabel = (date) => {
  try {
    return format(new Date(date), 'MM/dd');
  } catch {
    return '';
  }
};

const summarizeHealthEntry = (entry) => {
  if (!entry) return '';

  switch (entry.dataType) {
    case 'heart-rate':
      return entry.vitalSigns?.heartRate?.value
        ? `${entry.vitalSigns.heartRate.value} bpm`
        : '—';
    case 'blood-pressure':
      return entry.vitalSigns?.bloodPressure?.systolic && entry.vitalSigns?.bloodPressure?.diastolic
        ? `${entry.vitalSigns.bloodPressure.systolic}/${entry.vitalSigns.bloodPressure.diastolic} mmHg`
        : '—';
    case 'weight':
      return entry.measurements?.weight?.value
        ? `${entry.measurements.weight.value} ${entry.measurements.weight.unit || 'kg'}`
        : '—';
    case 'glucose':
      return entry.glucose?.value ? `${entry.glucose.value} ${entry.glucose.unit || 'mg/dL'}` : '—';
    case 'sleep':
      return entry.sleep?.duration ? `${Math.round(entry.sleep.duration / 60 * 10) / 10} hrs` : '—';
    case 'mood':
      return entry.mentalHealth?.mood?.score ? `${entry.mentalHealth.mood.score}/10` : '—';
    case 'activity':
      return entry.activity?.steps ? `${entry.activity.steps.toLocaleString()} steps` : '—';
    default:
      return '—';
  }
};

const buildCreatePayload = ({ dataType, recordedAtLocal, form, userNotes }) => {
  const recordedAt = recordedAtLocal ? new Date(recordedAtLocal).toISOString() : undefined;

  const payload = {
    dataType,
    source: 'manual',
    recordedAt,
    userNotes: userNotes || ''
  };

  switch (dataType) {
    case 'heart-rate': {
      const value = safeNumber(form.heartRate);
      payload.vitalSigns = { heartRate: { value } };
      break;
    }
    case 'blood-pressure': {
      const systolic = safeNumber(form.systolic);
      const diastolic = safeNumber(form.diastolic);
      payload.vitalSigns = { bloodPressure: { systolic, diastolic, position: form.bpPosition || 'sitting' } };
      break;
    }
    case 'weight': {
      const value = safeNumber(form.weight);
      payload.measurements = { weight: { value, unit: form.weightUnit || 'kg' } };
      break;
    }
    case 'glucose': {
      const value = safeNumber(form.glucose);
      payload.glucose = { value, unit: form.glucoseUnit || 'mg/dL', type: form.glucoseType || 'random' };
      break;
    }
    case 'sleep': {
      const hours = safeNumber(form.sleepHours);
      const qualityScore = safeNumber(form.sleepQuality);
      payload.sleep = {
        duration: hours !== undefined ? Math.round(hours * 60) : undefined,
        qualityScore
      };
      break;
    }
    case 'mood': {
      const score = safeNumber(form.moodScore);
      payload.mentalHealth = { mood: { score } };
      break;
    }
    case 'activity': {
      const steps = safeNumber(form.steps);
      const calories = safeNumber(form.calories);
      const activeMinutes = safeNumber(form.activeMinutes);
      payload.activity = { steps, calories, activeMinutes };
      break;
    }
    default:
      break;
  }

  return payload;
};

const buildUpdatePayload = ({ dataType, form, userNotes }) => {
  const payload = {
    userNotes: userNotes || ''
  };

  switch (dataType) {
    case 'heart-rate': {
      const value = safeNumber(form.heartRate);
      payload.vitalSigns = { heartRate: { value } };
      break;
    }
    case 'blood-pressure': {
      const systolic = safeNumber(form.systolic);
      const diastolic = safeNumber(form.diastolic);
      payload.vitalSigns = { bloodPressure: { systolic, diastolic, position: form.bpPosition || 'sitting' } };
      break;
    }
    case 'weight': {
      const value = safeNumber(form.weight);
      payload.measurements = { weight: { value, unit: form.weightUnit || 'kg' } };
      break;
    }
    case 'glucose': {
      const value = safeNumber(form.glucose);
      payload.glucose = { value, unit: form.glucoseUnit || 'mg/dL', type: form.glucoseType || 'random' };
      break;
    }
    case 'sleep': {
      const hours = safeNumber(form.sleepHours);
      const qualityScore = safeNumber(form.sleepQuality);
      payload.sleep = {
        duration: hours !== undefined ? Math.round(hours * 60) : undefined,
        qualityScore
      };
      break;
    }
    case 'mood': {
      const score = safeNumber(form.moodScore);
      payload.mentalHealth = { mood: { score } };
      break;
    }
    case 'activity': {
      const steps = safeNumber(form.steps);
      const calories = safeNumber(form.calories);
      const activeMinutes = safeNumber(form.activeMinutes);
      payload.activity = { steps, calories, activeMinutes };
      break;
    }
    default:
      break;
  }

  return payload;
};

const renderFieldsForType = (type, state, setState) => {
  switch (type) {
    case 'heart-rate':
      return (
        <TextField
          fullWidth
          label="Heart Rate (bpm)"
          value={state.heartRate}
          onChange={(e) => setState((prev) => ({ ...prev, heartRate: e.target.value }))}
          type="number"
          required
        />
      );
    case 'blood-pressure':
      return (
        <Grid container spacing={2}>
          <Grid item xs={12} md={4}>
            <TextField
              fullWidth
              label="Systolic (mmHg)"
              value={state.systolic}
              onChange={(e) => setState((prev) => ({ ...prev, systolic: e.target.value }))}
              type="number"
              required
            />
          </Grid>
          <Grid item xs={12} md={4}>
            <TextField
              fullWidth
              label="Diastolic (mmHg)"
              value={state.diastolic}
              onChange={(e) => setState((prev) => ({ ...prev, diastolic: e.target.value }))}
              type="number"
              required
            />
          </Grid>
          <Grid item xs={12} md={4}>
            <FormControl fullWidth>
              <InputLabel>Position</InputLabel>
              <Select
                value={state.bpPosition || 'sitting'}
                label="Position"
                onChange={(e) => setState((prev) => ({ ...prev, bpPosition: e.target.value }))}
              >
                <MenuItem value="sitting">Sitting</MenuItem>
                <MenuItem value="standing">Standing</MenuItem>
                <MenuItem value="lying-down">Lying Down</MenuItem>
              </Select>
            </FormControl>
          </Grid>
        </Grid>
      );
    case 'weight':
      return (
        <Grid container spacing={2}>
          <Grid item xs={12} md={8}>
            <TextField
              fullWidth
              label="Weight"
              value={state.weight}
              onChange={(e) => setState((prev) => ({ ...prev, weight: e.target.value }))}
              type="number"
              required
            />
          </Grid>
          <Grid item xs={12} md={4}>
            <FormControl fullWidth>
              <InputLabel>Unit</InputLabel>
              <Select
                value={state.weightUnit || 'kg'}
                label="Unit"
                onChange={(e) => setState((prev) => ({ ...prev, weightUnit: e.target.value }))}
              >
                <MenuItem value="kg">kg</MenuItem>
                <MenuItem value="lbs">lbs</MenuItem>
              </Select>
            </FormControl>
          </Grid>
        </Grid>
      );
    case 'glucose':
      return (
        <Grid container spacing={2}>
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              label="Glucose"
              value={state.glucose}
              onChange={(e) => setState((prev) => ({ ...prev, glucose: e.target.value }))}
              type="number"
              required
            />
          </Grid>
          <Grid item xs={12} md={3}>
            <FormControl fullWidth>
              <InputLabel>Unit</InputLabel>
              <Select
                value={state.glucoseUnit || 'mg/dL'}
                label="Unit"
                onChange={(e) => setState((prev) => ({ ...prev, glucoseUnit: e.target.value }))}
              >
                <MenuItem value="mg/dL">mg/dL</MenuItem>
                <MenuItem value="mmol/L">mmol/L</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} md={3}>
            <FormControl fullWidth>
              <InputLabel>Type</InputLabel>
              <Select
                value={state.glucoseType || 'random'}
                label="Type"
                onChange={(e) => setState((prev) => ({ ...prev, glucoseType: e.target.value }))}
              >
                <MenuItem value="fasting">Fasting</MenuItem>
                <MenuItem value="post-meal">Post-meal</MenuItem>
                <MenuItem value="random">Random</MenuItem>
                <MenuItem value="bedtime">Bedtime</MenuItem>
              </Select>
            </FormControl>
          </Grid>
        </Grid>
      );
    case 'sleep':
      return (
        <Grid container spacing={2}>
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              label="Sleep Duration (hours)"
              value={state.sleepHours}
              onChange={(e) => setState((prev) => ({ ...prev, sleepHours: e.target.value }))}
              type="number"
              required
            />
          </Grid>
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              label="Quality Score (1-10)"
              value={state.sleepQuality}
              onChange={(e) => setState((prev) => ({ ...prev, sleepQuality: e.target.value }))}
              type="number"
            />
          </Grid>
        </Grid>
      );
    case 'mood':
      return (
        <TextField
          fullWidth
          label="Mood Score (1-10)"
          value={state.moodScore}
          onChange={(e) => setState((prev) => ({ ...prev, moodScore: e.target.value }))}
          type="number"
          required
        />
      );
    case 'activity':
      return (
        <Grid container spacing={2}>
          <Grid item xs={12} md={4}>
            <TextField
              fullWidth
              label="Steps"
              value={state.steps}
              onChange={(e) => setState((prev) => ({ ...prev, steps: e.target.value }))}
              type="number"
              required
            />
          </Grid>
          <Grid item xs={12} md={4}>
            <TextField
              fullWidth
              label="Calories (optional)"
              value={state.calories}
              onChange={(e) => setState((prev) => ({ ...prev, calories: e.target.value }))}
              type="number"
            />
          </Grid>
          <Grid item xs={12} md={4}>
            <TextField
              fullWidth
              label="Active Minutes (optional)"
              value={state.activeMinutes}
              onChange={(e) => setState((prev) => ({ ...prev, activeMinutes: e.target.value }))}
              type="number"
            />
          </Grid>
        </Grid>
      );
    default:
      return null;
  }
};

const HealthData = () => {
  const [tabValue, setTabValue] = useState(0);

  // Entry form state
  const [dataType, setDataType] = useState('heart-rate');
  const [recordedAtLocal, setRecordedAtLocal] = useState(DEFAULT_RECORDED_AT());
  const [userNotes, setUserNotes] = useState('');
  const [form, setForm] = useState({
    heartRate: '',
    systolic: '',
    diastolic: '',
    bpPosition: 'sitting',
    weight: '',
    weightUnit: 'kg',
    glucose: '',
    glucoseUnit: 'mg/dL',
    glucoseType: 'random',
    sleepHours: '',
    sleepQuality: '',
    moodScore: '',
    steps: '',
    calories: '',
    activeMinutes: '',
  });
  const [creating, setCreating] = useState(false);

  // List state
  const [filters, setFilters] = useState({
    dataType: '',
    startDate: '',
    endDate: ''
  });
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [page, setPage] = useState(0);
  const [entriesLoading, setEntriesLoading] = useState(true);
  const [entriesError, setEntriesError] = useState('');
  const [entries, setEntries] = useState([]);
  const [totalEntries, setTotalEntries] = useState(0);

  // Edit dialog state
  const [editOpen, setEditOpen] = useState(false);
  const [editEntry, setEditEntry] = useState(null);
  const [editNotes, setEditNotes] = useState('');
  const [editForm, setEditForm] = useState({
    heartRate: '',
    systolic: '',
    diastolic: '',
    bpPosition: 'sitting',
    weight: '',
    weightUnit: 'kg',
    glucose: '',
    glucoseUnit: 'mg/dL',
    glucoseType: 'random',
    sleepHours: '',
    sleepQuality: '',
    moodScore: '',
    steps: '',
    calories: '',
    activeMinutes: '',
  });
  const [savingEdit, setSavingEdit] = useState(false);

  // Charts state
  const [period, setPeriod] = useState('30d');
  const [trendsLoading, setTrendsLoading] = useState(false);
  const [trendsError, setTrendsError] = useState('');
  const [trends, setTrends] = useState(null);

  // Insights state
  const [insightsLoading, setInsightsLoading] = useState(false);
  const [insightsError, setInsightsError] = useState('');
  const [insights, setInsights] = useState([]);
  const [healthScore, setHealthScore] = useState(null);

  const entryTypeLabel = useMemo(() => {
    return DATA_TYPE_OPTIONS.find((o) => o.value === dataType)?.label || dataType;
  }, [dataType]);

  const fetchEntries = useCallback(async () => {
    setEntriesLoading(true);
    setEntriesError('');
    try {
      const response = await healthService.getHealthData({
        ...filters,
        limit: rowsPerPage,
        page: page + 1
      });

      setEntries(response.data?.data || []);
      setTotalEntries(response.data?.total || 0);
    } catch (error) {
      setEntriesError(error.response?.data?.message || error.message || 'Failed to load health data');
    } finally {
      setEntriesLoading(false);
    }
  }, [filters, page, rowsPerPage]);

  const fetchTrends = useCallback(async () => {
    setTrendsLoading(true);
    setTrendsError('');
    try {
      const response = await healthService.getHealthTrends({ period });
      setTrends(response.data?.trends || null);
    } catch (error) {
      setTrendsError(error.response?.data?.message || error.message || 'Failed to load trends');
    } finally {
      setTrendsLoading(false);
    }
  }, [period]);

  const fetchInsights = useCallback(async () => {
    setInsightsLoading(true);
    setInsightsError('');
    try {
      const [insightsResp, scoreResp] = await Promise.all([
        healthService.getHealthInsights(),
        healthService.getHealthScore()
      ]);

      setInsights(insightsResp.data?.insights || []);
      setHealthScore(scoreResp.data?.healthScore || null);
    } catch (error) {
      setInsightsError(error.response?.data?.message || error.message || 'Failed to load insights');
    } finally {
      setInsightsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchEntries();
  }, [fetchEntries]);

  useEffect(() => {
    if (tabValue === 2) {
      fetchTrends();
    }
  }, [tabValue, fetchTrends]);

  useEffect(() => {
    if (tabValue === 3) {
      fetchInsights();
    }
  }, [tabValue, fetchInsights]);

  const resetEntryForm = () => {
    setRecordedAtLocal(DEFAULT_RECORDED_AT());
    setUserNotes('');
    setForm((prev) => ({
      ...prev,
      heartRate: '',
      systolic: '',
      diastolic: '',
      weight: '',
      glucose: '',
      sleepHours: '',
      sleepQuality: '',
      moodScore: '',
      steps: '',
      calories: '',
      activeMinutes: '',
    }));
  };

  const validateCreate = () => {
    switch (dataType) {
      case 'heart-rate':
        return !!safeNumber(form.heartRate);
      case 'blood-pressure':
        return !!safeNumber(form.systolic) && !!safeNumber(form.diastolic);
      case 'weight':
        return !!safeNumber(form.weight);
      case 'glucose':
        return !!safeNumber(form.glucose);
      case 'sleep':
        return !!safeNumber(form.sleepHours);
      case 'mood':
        return !!safeNumber(form.moodScore);
      case 'activity':
        return !!safeNumber(form.steps);
      default:
        return false;
    }
  };

  const handleCreate = async () => {
    if (!validateCreate()) {
      toast.error('Please fill in the required fields');
      return;
    }

    setCreating(true);
    try {
      const payload = buildCreatePayload({ dataType, recordedAtLocal, form, userNotes });
      await healthService.addHealthData(payload);

      toast.success(`${entryTypeLabel} entry saved`);
      resetEntryForm();
      setPage(0);
      await fetchEntries();
    } catch (error) {
      toast.error(error.response?.data?.message || error.message || 'Failed to save entry');
    } finally {
      setCreating(false);
    }
  };

  const openEditDialog = (entry) => {
    setEditEntry(entry);
    setEditNotes(entry.userNotes || '');

    const next = {
      heartRate: entry.vitalSigns?.heartRate?.value ?? '',
      systolic: entry.vitalSigns?.bloodPressure?.systolic ?? '',
      diastolic: entry.vitalSigns?.bloodPressure?.diastolic ?? '',
      bpPosition: entry.vitalSigns?.bloodPressure?.position ?? 'sitting',
      weight: entry.measurements?.weight?.value ?? '',
      weightUnit: entry.measurements?.weight?.unit ?? 'kg',
      glucose: entry.glucose?.value ?? '',
      glucoseUnit: entry.glucose?.unit ?? 'mg/dL',
      glucoseType: entry.glucose?.type ?? 'random',
      sleepHours: entry.sleep?.duration ? Math.round(entry.sleep.duration / 60 * 10) / 10 : '',
      sleepQuality: entry.sleep?.qualityScore ?? '',
      moodScore: entry.mentalHealth?.mood?.score ?? '',
      steps: entry.activity?.steps ?? '',
      calories: entry.activity?.calories ?? '',
      activeMinutes: entry.activity?.activeMinutes ?? '',
    };

    setEditForm(next);
    setEditOpen(true);
  };

  const handleSaveEdit = async () => {
    if (!editEntry) return;

    setSavingEdit(true);
    try {
      const payload = buildUpdatePayload({
        dataType: editEntry.dataType,
        form: editForm,
        userNotes: editNotes
      });

      await healthService.updateHealthData(editEntry._id, payload);
      toast.success('Entry updated');
      setEditOpen(false);
      setEditEntry(null);
      await fetchEntries();
    } catch (error) {
      toast.error(error.response?.data?.message || error.message || 'Failed to update entry');
    } finally {
      setSavingEdit(false);
    }
  };

  const handleDelete = async (entry) => {
    const confirmed = window.confirm('Delete this health entry?');
    if (!confirmed) return;

    try {
      await healthService.deleteHealthData(entry._id);
      toast.success('Entry deleted');
      await fetchEntries();
    } catch (error) {
      toast.error(error.response?.data?.message || error.message || 'Failed to delete entry');
    }
  };

  const handleExport = async (exportFormat) => {
    try {
      const response = await healthService.exportHealthData(exportFormat, {
        dataType: filters.dataType || undefined,
        startDate: filters.startDate || undefined,
        endDate: filters.endDate || undefined,
      });

      const blob = new Blob([response.data], {
        type:
          exportFormat === 'json'
            ? 'application/json'
            : 'text/csv'
      });

      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `health-data.${exportFormat === 'json' ? 'json' : 'csv'}`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);

      toast.success('Export started');
    } catch (error) {
      toast.error(error.response?.data?.message || error.message || 'Failed to export data');
    }
  };

  const preparedTrends = useMemo(() => {
    if (!trends) return null;

    return {
      heartRate: (trends.heartRate || []).map((d) => ({
        date: formatDateLabel(d.date),
        value: d.value
      })),
      bloodPressure: (trends.bloodPressure || []).map((d) => ({
        date: formatDateLabel(d.date),
        systolic: d.systolic,
        diastolic: d.diastolic
      })),
      weight: (trends.weight || []).map((d) => ({
        date: formatDateLabel(d.date),
        value: d.value
      })),
      glucose: (trends.glucose || []).map((d) => ({
        date: formatDateLabel(d.date),
        value: d.value
      })),
      sleep: (trends.sleep || []).map((d) => ({
        date: formatDateLabel(d.date),
        hours: Math.round((d.duration / 60) * 10) / 10
      })),
      mood: (trends.mood || []).map((d) => ({
        date: formatDateLabel(d.date),
        score: d.score
      })),
    };
  }, [trends]);

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Health Data
      </Typography>

      <Tabs
        value={tabValue}
        onChange={(_, v) => setTabValue(v)}
        sx={{ mb: 2 }}
      >
        <Tab icon={<Add />} iconPosition="start" label="Add Entry" />
        <Tab icon={<ListAlt />} iconPosition="start" label="History" />
        <Tab icon={<ShowChart />} iconPosition="start" label="Charts" />
        <Tab icon={<Insights />} iconPosition="start" label="Insights" />
      </Tabs>

      {tabValue === 0 && (
        <Card className="health-card">
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Add a Health Entry
            </Typography>

            <Grid container spacing={2}>
              <Grid item xs={12} md={4}>
                <FormControl fullWidth>
                  <InputLabel>Data Type</InputLabel>
                  <Select
                    value={dataType}
                    label="Data Type"
                    onChange={(e) => setDataType(e.target.value)}
                  >
                    {DATA_TYPE_OPTIONS.map((opt) => (
                      <MenuItem key={opt.value} value={opt.value}>
                        {opt.label}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>

              <Grid item xs={12} md={4}>
                <TextField
                  fullWidth
                  label="Recorded At"
                  type="datetime-local"
                  value={recordedAtLocal}
                  onChange={(e) => setRecordedAtLocal(e.target.value)}
                  InputLabelProps={{ shrink: true }}
                />
              </Grid>

              <Grid item xs={12} md={4}>
                <TextField
                  fullWidth
                  label="Notes (optional)"
                  value={userNotes}
                  onChange={(e) => setUserNotes(e.target.value)}
                />
              </Grid>

              <Grid item xs={12}>
                {renderFieldsForType(dataType, form, setForm)}
              </Grid>

              <Grid item xs={12}>
                <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1 }}>
                  <Button variant="outlined" onClick={resetEntryForm} disabled={creating}>
                    Reset
                  </Button>
                  <Button
                    variant="contained"
                    startIcon={creating ? <CircularProgress size={18} /> : <Save />}
                    onClick={handleCreate}
                    disabled={creating}
                  >
                    Save Entry
                  </Button>
                </Box>
              </Grid>
            </Grid>
          </CardContent>
        </Card>
      )}

      {tabValue === 1 && (
        <Card className="health-card">
          <CardContent>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography variant="h6">History</Typography>
              <Box sx={{ display: 'flex', gap: 1 }}>
                <Button
                  variant="outlined"
                  startIcon={<Download />}
                  onClick={() => handleExport('csv')}
                >
                  Export CSV
                </Button>
                <Button
                  variant="outlined"
                  startIcon={<Download />}
                  onClick={() => handleExport('json')}
                >
                  Export JSON
                </Button>
              </Box>
            </Box>

            <Grid container spacing={2} sx={{ mb: 2 }}>
              <Grid item xs={12} md={4}>
                <FormControl fullWidth>
                  <InputLabel>Data Type</InputLabel>
                  <Select
                    value={filters.dataType}
                    label="Data Type"
                    onChange={(e) => {
                      setFilters((prev) => ({ ...prev, dataType: e.target.value }));
                      setPage(0);
                    }}
                  >
                    <MenuItem value="">All</MenuItem>
                    {DATA_TYPE_OPTIONS.map((opt) => (
                      <MenuItem key={opt.value} value={opt.value}>
                        {opt.label}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} md={4}>
                <TextField
                  fullWidth
                  label="Start Date"
                  type="date"
                  value={filters.startDate}
                  onChange={(e) => {
                    setFilters((prev) => ({ ...prev, startDate: e.target.value }));
                    setPage(0);
                  }}
                  InputLabelProps={{ shrink: true }}
                />
              </Grid>
              <Grid item xs={12} md={4}>
                <TextField
                  fullWidth
                  label="End Date"
                  type="date"
                  value={filters.endDate}
                  onChange={(e) => {
                    setFilters((prev) => ({ ...prev, endDate: e.target.value }));
                    setPage(0);
                  }}
                  InputLabelProps={{ shrink: true }}
                />
              </Grid>
            </Grid>

            <Divider sx={{ mb: 2 }} />

            {entriesError && <Alert severity="error" sx={{ mb: 2 }}>{entriesError}</Alert>}

            {entriesLoading ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', py: 5 }}>
                <CircularProgress />
              </Box>
            ) : entries.length === 0 ? (
              <Alert severity="info">No health entries found. Add your first entry in the “Add Entry” tab.</Alert>
            ) : (
              <>
                <TableContainer>
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell>Date</TableCell>
                        <TableCell>Type</TableCell>
                        <TableCell>Summary</TableCell>
                        <TableCell>Source</TableCell>
                        <TableCell align="right">Actions</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {entries.map((entry) => (
                        <TableRow key={entry._id} hover>
                          <TableCell>
                            {entry.recordedAt ? format(new Date(entry.recordedAt), 'PP p') : '—'}
                          </TableCell>
                          <TableCell>
                            <Chip
                              size="small"
                              label={DATA_TYPE_OPTIONS.find((o) => o.value === entry.dataType)?.label || entry.dataType}
                            />
                          </TableCell>
                          <TableCell>{summarizeHealthEntry(entry)}</TableCell>
                          <TableCell>{entry.source || 'manual'}</TableCell>
                          <TableCell align="right">
                            <IconButton size="small" onClick={() => openEditDialog(entry)}>
                              <Edit fontSize="small" />
                            </IconButton>
                            <IconButton size="small" onClick={() => handleDelete(entry)}>
                              <Delete fontSize="small" />
                            </IconButton>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>

                <TablePagination
                  component="div"
                  count={totalEntries}
                  page={page}
                  onPageChange={(_, nextPage) => setPage(nextPage)}
                  rowsPerPage={rowsPerPage}
                  onRowsPerPageChange={(e) => {
                    setRowsPerPage(parseInt(e.target.value, 10));
                    setPage(0);
                  }}
                  rowsPerPageOptions={[5, 10, 25, 50]}
                />
              </>
            )}
          </CardContent>
        </Card>
      )}

      {tabValue === 2 && (
        <Card className="health-card">
          <CardContent>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography variant="h6">Trends</Typography>
              <FormControl sx={{ minWidth: 160 }}>
                <InputLabel>Period</InputLabel>
                <Select
                  value={period}
                  label="Period"
                  onChange={(e) => setPeriod(e.target.value)}
                >
                  <MenuItem value="7d">Last 7 days</MenuItem>
                  <MenuItem value="30d">Last 30 days</MenuItem>
                  <MenuItem value="90d">Last 90 days</MenuItem>
                  <MenuItem value="1y">Last year</MenuItem>
                </Select>
              </FormControl>
            </Box>

            {trendsError && <Alert severity="error" sx={{ mb: 2 }}>{trendsError}</Alert>}

            {trendsLoading ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', py: 5 }}>
                <CircularProgress />
              </Box>
            ) : !preparedTrends ? (
              <Alert severity="info">No trend data yet. Add entries and come back to see charts.</Alert>
            ) : (
              <Grid container spacing={3}>
                <Grid item xs={12} md={6}>
                  <Typography variant="subtitle1" sx={{ mb: 1 }}>Heart Rate</Typography>
                  <Box sx={{ height: 260 }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={preparedTrends.heartRate}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="date" />
                        <YAxis />
                        <Tooltip />
                        <Legend />
                        <Line type="monotone" dataKey="value" stroke="#d32f2f" name="bpm" dot={false} />
                      </LineChart>
                    </ResponsiveContainer>
                  </Box>
                </Grid>

                <Grid item xs={12} md={6}>
                  <Typography variant="subtitle1" sx={{ mb: 1 }}>Blood Pressure</Typography>
                  <Box sx={{ height: 260 }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={preparedTrends.bloodPressure}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="date" />
                        <YAxis />
                        <Tooltip />
                        <Legend />
                        <Line type="monotone" dataKey="systolic" stroke="#1976d2" name="Systolic" dot={false} />
                        <Line type="monotone" dataKey="diastolic" stroke="#388e3c" name="Diastolic" dot={false} />
                      </LineChart>
                    </ResponsiveContainer>
                  </Box>
                </Grid>

                <Grid item xs={12} md={6}>
                  <Typography variant="subtitle1" sx={{ mb: 1 }}>Weight</Typography>
                  <Box sx={{ height: 260 }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={preparedTrends.weight}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="date" />
                        <YAxis />
                        <Tooltip />
                        <Legend />
                        <Line type="monotone" dataKey="value" stroke="#7b1fa2" name="Weight" dot={false} />
                      </LineChart>
                    </ResponsiveContainer>
                  </Box>
                </Grid>

                <Grid item xs={12} md={6}>
                  <Typography variant="subtitle1" sx={{ mb: 1 }}>Glucose</Typography>
                  <Box sx={{ height: 260 }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={preparedTrends.glucose}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="date" />
                        <YAxis />
                        <Tooltip />
                        <Legend />
                        <Line type="monotone" dataKey="value" stroke="#f57c00" name="Glucose" dot={false} />
                      </LineChart>
                    </ResponsiveContainer>
                  </Box>
                </Grid>

                <Grid item xs={12} md={6}>
                  <Typography variant="subtitle1" sx={{ mb: 1 }}>Sleep</Typography>
                  <Box sx={{ height: 260 }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={preparedTrends.sleep}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="date" />
                        <YAxis />
                        <Tooltip />
                        <Legend />
                        <Bar dataKey="hours" fill="#0097a7" name="Hours" />
                      </BarChart>
                    </ResponsiveContainer>
                  </Box>
                </Grid>

                <Grid item xs={12} md={6}>
                  <Typography variant="subtitle1" sx={{ mb: 1 }}>Mood</Typography>
                  <Box sx={{ height: 260 }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={preparedTrends.mood}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="date" />
                        <YAxis domain={[0, 10]} />
                        <Tooltip />
                        <Legend />
                        <Line type="monotone" dataKey="score" stroke="#5d4037" name="Mood (1-10)" dot={false} />
                      </LineChart>
                    </ResponsiveContainer>
                  </Box>
                </Grid>
              </Grid>
            )}
          </CardContent>
        </Card>
      )}

      {tabValue === 3 && (
        <Card className="health-card">
          <CardContent>
            <Typography variant="h6" gutterBottom>Insights</Typography>

            {insightsError && <Alert severity="error" sx={{ mb: 2 }}>{insightsError}</Alert>}

            {insightsLoading ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', py: 5 }}>
                <CircularProgress />
              </Box>
            ) : (
              <Grid container spacing={3}>
                <Grid item xs={12} md={4}>
                  <Card variant="outlined">
                    <CardContent>
                      <Typography variant="subtitle1" gutterBottom>
                        Health Score
                      </Typography>
                      {healthScore ? (
                        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1 }}>
                          <CircularProgress variant="determinate" value={healthScore.score} size={90} />
                          <Typography variant="h6">{healthScore.score}/100</Typography>
                          <Typography variant="body2" color="textSecondary">{healthScore.level}</Typography>
                        </Box>
                      ) : (
                        <Typography variant="body2" color="textSecondary">No score yet. Add some data points.</Typography>
                      )}
                    </CardContent>
                  </Card>
                </Grid>

                <Grid item xs={12} md={8}>
                  <Card variant="outlined">
                    <CardContent>
                      <Typography variant="subtitle1" gutterBottom>
                        Key Factors
                      </Typography>
                      {healthScore?.factors?.length ? (
                        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                          {healthScore.factors.map((f, idx) => (
                            <Chip
                              key={idx}
                              label={`${f.factor} (${f.impact})`}
                              color={f.impact < 0 ? 'warning' : 'default'}
                              variant="outlined"
                            />
                          ))}
                        </Box>
                      ) : (
                        <Typography variant="body2" color="textSecondary">No factors identified yet.</Typography>
                      )}

                      {healthScore?.recommendations?.length ? (
                        <Box sx={{ mt: 2 }}>
                          <Typography variant="subtitle2" gutterBottom>
                            Recommendations
                          </Typography>
                          <ul style={{ margin: 0, paddingLeft: 18 }}>
                            {healthScore.recommendations.map((r) => (
                              <li key={r}>
                                <Typography variant="body2">{r}</Typography>
                              </li>
                            ))}
                          </ul>
                        </Box>
                      ) : null}
                    </CardContent>
                  </Card>
                </Grid>

                <Grid item xs={12}>
                  <Card variant="outlined">
                    <CardContent>
                      <Typography variant="subtitle1" gutterBottom>
                        Recent Insights (Last 30 Days)
                      </Typography>
                      {insights.length ? (
                        <Grid container spacing={2}>
                          {insights.map((ins, idx) => (
                            <Grid key={idx} item xs={12} md={6}>
                              <Alert severity={ins.severity || 'info'}>
                                {ins.message}
                              </Alert>
                            </Grid>
                          ))}
                        </Grid>
                      ) : (
                        <Typography variant="body2" color="textSecondary">
                          No insights generated yet.
                        </Typography>
                      )}
                    </CardContent>
                  </Card>
                </Grid>
              </Grid>
            )}
          </CardContent>
        </Card>
      )}

      <Dialog open={editOpen} onClose={() => setEditOpen(false)} fullWidth maxWidth="sm">
        <DialogTitle>
          Edit Entry
          <IconButton
            onClick={() => setEditOpen(false)}
            sx={{ position: 'absolute', right: 8, top: 8 }}
            size="small"
          >
            <Close fontSize="small" />
          </IconButton>
        </DialogTitle>
        <DialogContent dividers>
          {editEntry ? (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <Alert severity="info">
                Type: {DATA_TYPE_OPTIONS.find((o) => o.value === editEntry.dataType)?.label || editEntry.dataType}
                {editEntry.recordedAt ? ` • ${format(new Date(editEntry.recordedAt), 'PP p')}` : ''}
              </Alert>

              {renderFieldsForType(editEntry.dataType, editForm, setEditForm)}

              <TextField
                fullWidth
                label="Notes"
                value={editNotes}
                onChange={(e) => setEditNotes(e.target.value)}
              />
            </Box>
          ) : null}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditOpen(false)} disabled={savingEdit}>
            Cancel
          </Button>
          <Button
            variant="contained"
            startIcon={savingEdit ? <CircularProgress size={18} /> : <Save />}
            onClick={handleSaveEdit}
            disabled={savingEdit || !editEntry}
          >
            Save
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default HealthData;
