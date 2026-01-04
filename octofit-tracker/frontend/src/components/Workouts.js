import React, { useCallback, useEffect, useMemo, useState } from 'react';

const Workouts = () => {
  const [workouts, setWorkouts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filter, setFilter] = useState('');

  const endpoint = useMemo(() => {
    const codespace = process.env.REACT_APP_CODESPACE_NAME;
    return codespace ? `https://${codespace}-8000.app.github.dev/api/workouts/` : '';
  }, []);

  const fetchData = useCallback(() => {
    const controller = new AbortController();
    setLoading(true);

    if (!endpoint) {
      setError('Backend host not configured. Set REACT_APP_CODESPACE_NAME.');
      setLoading(false);
      return controller;
    }

    (async () => {
      try {
        const response = await fetch(endpoint, { signal: controller.signal });
        const payload = await response.json();
        const normalized = Array.isArray(payload) ? payload : payload?.results ?? [];
        setWorkouts(normalized);
        setError(null);
      } catch (err) {
        if (err.name === 'AbortError') return;
        setError('Failed to load workouts.');
      } finally {
        setLoading(false);
      }
    })();

    return controller;
  }, [endpoint]);

  useEffect(() => {
    const controller = fetchData();
    return () => controller.abort();
  }, [fetchData]);

  const filteredWorkouts = useMemo(() => {
    const term = filter.trim().toLowerCase();
    if (!term) return workouts;
    return workouts.filter((workout) =>
      (workout.name ?? workout.title ?? '').toString().toLowerCase().includes(term)
    );
  }, [workouts, filter]);

  return (
    <section className="card card-surface mb-4">
      <div className="card-header d-flex flex-wrap align-items-center justify-content-between gap-3">
        <div>
          <h2 className="h5 card-title mb-0">Workouts</h2>
          <small className="muted-label">Planned sessions and drills</small>
        </div>
        <div className="d-flex flex-wrap align-items-center gap-2">
          <div className="input-group input-group-sm">
            <span className="input-group-text">Filter</span>
            <input
              type="search"
              className="form-control"
              placeholder="Search workouts"
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
            />
          </div>
          <button
            type="button"
            className="btn btn-primary btn-sm btn-glow"
            onClick={fetchData}
            disabled={loading}
          >
            {loading ? 'Loading…' : 'Refresh'}
          </button>
        </div>
      </div>

      <div className="card-body">
        {error && (
          <div className="alert alert-danger" role="alert">
            {error}
          </div>
        )}

        {loading && (
          <div className="d-flex align-items-center gap-2 text-light">
            <div className="spinner-border spinner-border-sm" role="status" aria-hidden="true" />
            <span>Loading workouts…</span>
          </div>
        )}

        {!loading && !error && (
          <div className="table-responsive">
            <table className="table table-hover align-middle mb-0">
              <thead className="table-light">
                <tr>
                  <th scope="col">Workout</th>
                  <th scope="col">Intensity</th>
                  <th scope="col">Target</th>
                </tr>
              </thead>
              <tbody>
                {filteredWorkouts.length === 0 && (
                  <tr>
                    <td colSpan="3" className="table-empty-state py-4">
                      No workouts found.
                    </td>
                  </tr>
                )}

                {filteredWorkouts.map((workout, idx) => (
                  <tr key={workout.id ?? idx}>
                    <td className="fw-semibold">{workout.name ?? workout.title ?? 'Workout'}</td>
                    <td>
                      {workout.intensity || workout.difficulty ? (
                        <span className="badge bg-info text-dark">
                          {workout.intensity ?? workout.difficulty}
                        </span>
                      ) : (
                        <span className="text-muted">—</span>
                      )}
                    </td>
                    <td>
                      <span className="status-pill">{workout.focus ?? workout.type ?? 'Full-body'}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </section>
  );
};

export default Workouts;
