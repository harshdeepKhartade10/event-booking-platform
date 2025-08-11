import { useEffect, useState } from "react";
import "../filtered-single-event.css";
import { useDispatch, useSelector } from "react-redux";
import { fetchEvents } from "../slices/eventSlice";
import { Link } from "react-router-dom";
import axios from "axios";

const Home = () => {
  const dispatch = useDispatch();
  let { events, loading, error } = useSelector((state) => state.events);
  if (!Array.isArray(events)) events = [];

  // Local state for search/filter
  const [search, setSearch] = useState("");
  const [location, setLocation] = useState("");
  const [category, setCategory] = useState("");
  const [minPrice, setMinPrice] = useState("");
  const [maxPrice, setMaxPrice] = useState("");
  const [date, setDate] = useState("");
  const [filtered, setFiltered] = useState([]);
  const [filtering, setFiltering] = useState(false);

  useEffect(() => {
    dispatch(fetchEvents());
  }, [dispatch]);

  useEffect(() => {
    setFiltered(events);
  }, [events]);

  // Filter handler
  const handleFilter = async (e) => {
    e.preventDefault();
    setFiltering(true);
    try {
      // Build query params
      let query = [];
      if (search) query.push(`q=${encodeURIComponent(search)}`);
      if (category) query.push(`category=${encodeURIComponent(category)}`);
      if (minPrice) query.push(`minPrice=${minPrice}`);
      if (maxPrice) query.push(`maxPrice=${maxPrice}`);
      if (date) query.push(`date=${date}`);
      let url = `${import.meta.env.VITE_API_URL}/api/events`;
      if (query.length) url += `?${query.join("&")}`;
      const res = await axios.get(url);
      setFiltered(res.data);
    } catch {
      setFiltered([]);
    } finally {
      setFiltering(false);
    }
  };

  return (
    <div
      className="home-mmt"
      style={{
        maxWidth: "1300px",
        width: "98vw",
        minHeight: "100vh",
        margin: "0 auto",
        padding: "0 2vw",
        background: "#fff",
        borderRadius: "0 0 16px 16px",
        boxShadow: "0 2px 16px rgba(0,0,0,0.08)",
        display: "flex",
        flexDirection: "column",
        alignItems: "stretch",
        justifyContent: "flex-start",
        overflowX: "auto",
      }}
    >
      {/* Filter Bar */}
      <form
        onSubmit={handleFilter}
        className="event-filter-bar"
        style={{
          width: "100%",
          maxWidth: "1200px",
          margin: "1.1em auto 1.5em auto",
          display: "flex",
          gap: "0.7em",
          padding: "0.3em 0.2em",
          background: "transparent",
          borderRadius: "0",
          boxShadow: "none",
          alignItems: "center",
          justifyContent: "flex-start",
          overflowX: "auto",
          flexWrap: "nowrap",
        }}
      >
        <input
          type="text"
          placeholder="Search event"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{
            width: "140px",
            padding: "0.37em 0.7em",
            borderRadius: "5px",
            border: "1px solid #d1d5db",
            fontSize: "0.97em",
          }}
        />
        <input
          type="text"
          placeholder="Location"
          value={location}
          onChange={(e) => setLocation(e.target.value)}
          style={{
            width: "120px",
            padding: "0.37em 0.7em",
            borderRadius: "5px",
            border: "1px solid #d1d5db",
            fontSize: "0.97em",
          }}
        />
        <select
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          style={{
            width: "120px",
            padding: "0.37em 0.7em",
            borderRadius: "5px",
            border: "1px solid #d1d5db",
            fontSize: "0.97em",
          }}
        >
          <option value="">All Categories</option>
          <option value="Sports">Sports</option>
          <option value="Music Festival">Music Festival</option>
          <option value="Literature">Literature</option>
          <option value="Conference">Conference</option>
          <option value="Comedy">Comedy</option>
          <option value="Workshop">Workshop</option>
          <option value="Other">Other</option>
        </select>
        <input
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          style={{
            width: "120px",
            padding: "0.37em 0.7em",
            borderRadius: "5px",
            border: "1px solid #d1d5db",
            fontSize: "0.97em",
          }}
        />
        <input
          type="number"
          placeholder="Min ₹"
          value={minPrice}
          onChange={(e) => setMinPrice(e.target.value)}
          min="0"
          style={{
            width: "85px",
            padding: "0.37em 0.7em",
            borderRadius: "5px",
            border: "1px solid #d1d5db",
            fontSize: "0.97em",
          }}
        />
        <input
          type="number"
          placeholder="Max ₹"
          value={maxPrice}
          onChange={(e) => setMaxPrice(e.target.value)}
          min="0"
          style={{
            width: "85px",
            padding: "0.37em 0.7em",
            borderRadius: "5px",
            border: "1px solid #d1d5db",
            fontSize: "0.97em",
          }}
        />
        <button
          type="submit"
          disabled={filtering}
          style={{
            padding: "0.37em 1.1em",
            borderRadius: "5px",
            background: "#1a73e8",
            color: "#fff",
            border: "none",
            fontWeight: 600,
            fontSize: "0.97em",
            cursor: filtering ? "not-allowed" : "pointer",
            transition: "background 0.2s",
          }}
        >
          {filtering ? "..." : "Filter"}
        </button>
        <button
          type="button"
          onClick={() => {
            setSearch("");
            setCategory("");
            setLocation("");
            setMinPrice("");
            setMaxPrice("");
            setDate("");
            setFiltered(events);
          }}
          style={{
            padding: "0.37em 0.9em",
            borderRadius: "5px",
            background: "#e5e7eb",
            color: "#222",
            border: "none",
            fontWeight: 500,
            fontSize: "0.97em",
            cursor: "pointer",
            marginLeft: "0.2em",
          }}
        >
          Clear
        </button>
      </form>

      <div
        className={`event-mmt-grid${(filtered.length === 1) ? ' filtered-single-event' : ''}`}
        style={{
          width: "100%",
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(350px, 1fr))",
          gap: "2.5rem 2rem",
          padding: 0,
          margin: 0,
        }}
      >
        {loading ? (
          <div>Loading events...</div>
        ) : error ? (
          <div>{error}</div>
        ) : (filtered.length > 0 ? filtered : events).length === 0 ? (
          <div className="no-events">No events found.</div>
        ) : (
          (filtered.length > 0 ? filtered : events).map((event) => (
            <div
              className="event-mmt-card"
              key={event._id}
              style={{
                background: "#fff",
                borderRadius: "16px",
                boxShadow: "0 2px 12px rgba(44,62,80,0.09)",
                overflow: "hidden",
                display: "flex",
                flexDirection: "column",
                transition: "box-shadow 0.2s",
                minHeight: "380px",
              }}
            >
              <img
                src={
                  event.image ||
                  `https://images.unsplash.com/800x600/?${encodeURIComponent(
                    [
                      event.category?.toLowerCase() || 'event',
                      'concert',
                      'entertainment'
                    ].join(' ')
                  )}&auto=format&fit=crop&w=800&q=80`
                }
                alt={event.name}
                className="event-mmt-img"
                style={{
                  width: "100%",
                  height: "200px",
                  objectFit: "cover",
                  background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
                  borderRadius: "16px 16px 0 0"
                }}
                onError={(e) => {
                  e.target.onerror = null;
                  // Fallback to a reliable placeholder service
                  e.target.src = `https://via.placeholder.com/600x400/667eea/ffffff?text=${encodeURIComponent(event.name || 'Event')}`;
                }}
              />
              <div
                className="event-mmt-body"
                style={{
                  padding: "1.4rem 1.2rem 1.2rem 1.2rem",
                  display: "flex",
                  flexDirection: "column",
                  gap: "0.5rem",
                  flex: 1,
                }}
              >
                <h3
                  className="event-mmt-title"
                  style={{
                    fontSize: "1.22rem",
                    fontWeight: 600,
                    marginBottom: "0.2rem",
                    color: "#222",
                  }}
                >
                  {event.name}
                </h3>
                <div
                  className="event-mmt-meta"
                  style={{
                    display: "flex",
                    gap: "1.1rem",
                    fontSize: "1rem",
                    color: "#6b7280",
                    marginBottom: "0.3rem",
                  }}
                >
                  <span>{new Date(event.date).toLocaleDateString()}</span>
                  <span>{event.venue}</span>
                </div>
                <div
                  className="event-mmt-cat"
                  style={{
                    fontSize: "0.99rem",
                    color: "#1a73e8",
                    marginBottom: "0.2rem",
                  }}
                >
                  {event.category}
                </div>
                <div
                  className="event-mmt-price"
                  style={{
                    fontSize: "1.09rem",
                    fontWeight: 500,
                    color: "#111827",
                    marginBottom: "0.5rem",
                  }}
                >
                  ₹{event.price}
                </div>
                <Link
                  to={`/events/${event._id}`}
                  className="event-mmt-link"
                  style={{
                    marginTop: "auto",
                    background: "#1a73e8",
                    color: "#fff",
                    padding: "0.6em 1.2em",
                    border: "none",
                    borderRadius: "8px",
                    fontWeight: 600,
                    fontSize: "1rem",
                    textAlign: "center",
                    textDecoration: "none",
                    transition: "background 0.2s",
                    cursor: "pointer",
                    display: "inline-block",
                  }}
                >
                  View & Book
                </Link>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
export default Home;
